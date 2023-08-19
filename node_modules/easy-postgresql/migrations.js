const fs = require("fs");
const path = require("path");
const prompt = require("prompt-sync")({ sigint: true });
const DBManager = require("./DBManager");
const { Query } = require("pg");
const { v4 } = require("uuid");

class Migrations {
  static migrationsFolder = "migrations";

  static migrationsFolderExists() {
    return fs.existsSync(Migrations.resolvePath(Migrations.migrationsFolder));
  }

  static resolvePath(...entries) {
    return path.join(process.cwd(), ...entries);
  }

  static createMigrationsFolder() {
    if (Migrations.migrationsFolderExists()) {
      return;
    }

    fs.mkdirSync(Migrations.resolvePath(Migrations.migrationsFolder));
  }
  static setMigrationsFolder(name) {
    Migrations.migrationsFolder = name;
  }

  static async runNewMigration(cb) {
    const { up, down, args = [] } = await cb();

    const filename = `${new Date().getTime()}__migration.json`;
    fs.writeFileSync(
      Migrations.resolvePath(Migrations.migrationsFolder, filename),
      JSON.stringify({
        filename,
        up,
        down,
        timestamp: new Date().toUTCString(),
        id: v4(),
        applied: true,
        args,
      })
    );
  }

  static readMigrationFiles() {
    const files = [];
    fs.readdirSync(Migrations.resolvePath(Migrations.migrationsFolder)).forEach(
      (file) => {
        files.push(Migrations.resolvePath(Migrations.migrationsFolder, file));
      }
    );

    return files.map((file) =>
      JSON.parse(fs.readFileSync(file, { encoding: "utf8" }).toString())
    );
  }

  static async applyMigrations() {
    Migrations.createMigrationsFolder();

    const notApplied = Migrations.readMigrationFiles().filter(
      (x) => !x.applied
    );

    for (const migration of notApplied) {
      await DBManager.exec(migration.up, migration.args);
      fs.writeFileSync(
        Migrations.resolvePath(Migrations.migrationsFolder, migration.filename),
        JSON.stringify({
          ...migration,
          applied: true,
        })
      );
    }
  }

  static async rollbackToMigration(id) {
    const files = Migrations.readMigrationFiles();
    const migrationIndex = files.findIndex((file) => file.id === id);
    if (migrationIndex === -1) {
      console.log(`No such migration: ${id}`);
      return;
    }

    const rollbackItems = files.slice(migrationIndex);
    for (let i = rollbackItems.length - 1; i >= 0; i--) {
      await DBManager.exec(rollbackItems[i].down);
      fs.writeFileSync(
        Migrations.resolvePath(
          Migrations.migrationsFolder,
          rollbackItems[i].filename
        ),
        JSON.stringify({
          ...rollbackItems[i],
          applied: false,
        })
      );
    }
  }

  static async createMigration({ up, down }) {
    await Migrations.runNewMigration(async () => {
      new Query(up);
      new Query(down);

      await DBManager.exec(up);
      return { up, down };
    });
  }

  static async bashMigrationInput() {
    const up = prompt("Enter New SQL Statement: ");
    const down = prompt("Enter The opposite SQL Action: ");
    if (!up || !down) {
      console.log("please provide up and  down properties!");
      process.exit(1);
    }
    await Migrations.runNewMigration(async () => {
      new Query(up);
      new Query(down);

      await DBManager.exec(up);
      return { up, down };
    });

    console.log("completed!!");
    const continueMig = prompt("Press 1 to continue");
    if (continueMig.trim() !== "1") {
      console.log("BYE!");
      process.exit(0);
    }

    await Migrations.bashMigrationInput();
  }
}

module.exports = Migrations;
