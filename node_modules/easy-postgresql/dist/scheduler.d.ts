export = Scheduler;
declare class Scheduler {
    static jobs: {};
    static JobStates: {
        CREATED: string;
        RUNNING: string;
        SKIPPED: string;
        COMPLETED: string;
        ERROR: string;
        EXIT: string;
    };
    static schedule({ seconds, exec, isPromise, log }: {
        seconds?: number;
        exec: any;
        isPromise: any;
        log?: boolean;
    }): void;
    static getJobs(): {};
    static getJobsToArray(): any[];
    static getJobIds(): string[];
    static getJobStateByID(id: any): any;
    static setJobStatusByID(id: any, status: any): void;
    static terminateJobByID(id: any): any;
    static removeJobByID(id: any): void;
}
