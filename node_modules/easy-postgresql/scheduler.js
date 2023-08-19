const { Worker, isMainThread, parentPort } = require("worker_threads");
const ValidationService = require("./validation");
const { v4 } = require("uuid");

class Scheduler {
  static jobs = {};
  static JobStates = {
    CREATED: "CREATED",
    RUNNING: "RUNNING",
    SKIPPED: "SKIPPED",
    COMPLETED: "COMPLETED",
    ERROR: "ERROR",
    EXIT: "EXIT",
  };

  static schedule({ seconds = 1, exec, isPromise, log = false }) {
    if (!ValidationService.validateNumber({ value: seconds, min: 0.001 })) {
      throw new Error("Seconds minimum value should be 0.001");
    }
    let worker;
    const id = v4();
    Scheduler.jobs[id] = {
      seconds,
      exec,
      isPromise,
      id,
      status: Scheduler.JobStates.CREATED,
    };
    exec = exec.split("\\").join("/");
    if (!isPromise) {
      worker = new Worker(
        `
        const { parentPort } = require('worker_threads');
        const exec = require('${exec}');
        let isRunning = false
        setInterval(async () => {
          if (!isRunning) {
            isRunning = true;
            parentPort.postMessage('${Scheduler.JobStates.RUNNING}')
            exec();
            parentPort.postMessage('${Scheduler.JobStates.COMPLETED}')
            isRunning = false;
          } else {
            if (log) {
              console.log('Skipping next cycle: Job ${id} already running!');
            }
          }
        }, ${seconds * 1000})`,
        {
          eval: true,
        }
      );
      Scheduler.jobs[id].terminate = worker.terminate.bind(worker);
    } else {
      worker = new Worker(
        `
        const {parentPort} = require('worker_threads')
        const exec = require('${exec}')
        let isRunning = false
        setInterval(async () => {
          if (!isRunning) {
            isRunning = true;
            parentPort.postMessage('${Scheduler.JobStates.RUNNING}')
            await exec();
            parentPort.postMessage('${Scheduler.JobStates.COMPLETED}')
            isRunning = false;
          } else {
            if (log) {
              console.log('Skipping next cycle: Job ${id} already running!');
            }
          }
        }, ${seconds * 1000})`,
        {
          eval: true,
        }
      );
      Scheduler.jobs[id].terminate = worker.terminate.bind(worker);
    }

    Scheduler.jobs[id].threadId = worker.threadId;
    Scheduler.jobs[id].worker = worker;
    worker.on("message", (status) => {
      Scheduler.setJobStatusByID(id, status);
    });
    worker.on("error", (err) => {
      if (log) {
        console.table([
          `Background Worker Error: Job ${id}`,
          err.name,
          err.message,
        ]);
      }
    });

    worker.on("exit", (exitCode) => {
      if (log) {
        console.table([
          `Background Worker Exited: Job ${id}!`,
          `Exit Code ${exitCode}`,
        ]);
      }
    });
  }

  static getJobs() {
    return Scheduler.jobs;
  }

  static getJobsToArray() {
    return Object.values(Scheduler.jobs).map(
      ({ worker, terminate, ...rest }) => rest
    );
  }

  static getJobIds() {
    return Object.keys(Scheduler.jobs);
  }

  static getJobStateByID(id) {
    return Scheduler.jobs?.[id]?.status;
  }

  static setJobStatusByID(id, status) {
    try {
      Scheduler.jobs[id].status = status;
    } catch (error) {}
  }

  static terminateJobByID(id) {
    try {
      const { threadId } = Scheduler.jobs[id];
      console.log(`Terminating worker ${threadId} of Job: ${id}`);
      Scheduler.jobs[id].terminate().then(() => {
        Scheduler.removeJobByID(id);
        console.log(`Worker ${threadId} terminated`);
      });
      return id;
    } catch (error) {
      console.log(
        `Job ${id} was not found or the background worker was not attached yet`
      );
      return null;
    }
  }

  static removeJobByID(id) {
    try {
      delete Scheduler.jobs[id];
    } catch (error) {}
  }
}

module.exports = Scheduler;
