const DB = require("./db");

class Index {
  constructor({ type, columns, auto_increment, table, onUpdate, onDelete }) {
    this.type = type;
    this.columns = columns;
    this.auto_increment;
    this.table = table;
  }

  produceIndexCreateSQL() {
    switch (this.type.toLowerCase()) {
      case "primary":
        return {
          up: this.produceCreatePrimaryKeySQL(),
          down: this.produceDropPrimaryKeySQL(),
        };
    }
  }

  produceCreatePrimaryKeySQL() {
    const cols = Array.isArray(columns) ? columns : [columns];
    if (auto_increment && cols.length > 1) {
      throw new Error("composite primary key cannot be auto increment");
    }
    let sequence = "";
    if (auto_increment) {
      const sequence_name = `${DB.database}_${this.table}_${cols
        .map((x) => x.column)
        .join("_")}_sequence`;
      sequence = `CREATE SEQUENCE ${
        DB.database
      }.${sequence_name} INCREMENT 1 START 1 MINVALUE 1;ALTER TABLE ALTER COLUMN ${cols
        .map((x) => x.column)
        .join(",")} SET DEFAULT nextval('${sequence_name}'::regclass);`;
    }

    return `${sequence}ALTER TABLE ${DB.database}.${
      this.table
    } ADD PRIMARY KEY (${columns.map((x) => x.column)})`;
  }

  produceDropPrimaryKeySQL() {
    const cols = Array.isArray(columns) ? columns : [columns];
    if (auto_increment && cols.length > 1) {
      throw new Error("composite primary key cannot be auto increment");
    }
    let sequence = "";
    if (auto_increment) {
      const sequence_name = `${DB.database}_${this.table}_${cols
        .map((x) => x.column)
        .join("_")}_sequence`;
      sequence = `DROP SEQUENCE  INCREMENT 1 START 1 MINVALUE 1;ALTER TABLE ALTER COLUMN ${cols
        .map((x) => x.column)
        .join(",")} SET DEFAULT nextval('${sequence_name}'::regclass);`;
    }
  }

  produceCreateForeignKeySQL() {}

  productDropForeignKeySQL() {}
}

module.exports = Index;
