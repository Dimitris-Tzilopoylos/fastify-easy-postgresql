import {
  DB,
  Model,
  Column as DBColumn,
  Relation as DBRelation,
  Migrations,
  DBManager,
} from "easy-postgresql";
import { EngineQueries, schema } from "./constants";
import { normalizeNumber } from "../utils/generic";
import { Column, MigrationOptions, ModelFilters, Relation } from "./types";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

DB.registerDatabase(schema);
DB.registerConnectionConfig({
  host: process.env.DB_HOST || "localhost",
  port: normalizeNumber(process.env.DB_PORT, 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "postgres",
  min: normalizeNumber(process.env.MIN_POOL_CONNECTIONS || 10),
  max: normalizeNumber(process.env.MAX_POOL_CONNECTIONS || 100),
});

class BaseModel {
  table: string = "";

  constructor(table: string) {
    this.table = table;
  }

  modelFactory(columns: Column[], relations: Relation[]): any {
    const table = this.table;
    return class MdlFacotry extends Model {
      registeredFilters?: ModelFilters;
      constructor(conn?: any, filters?: ModelFilters) {
        super(table, conn);
        this.registeredFilters = filters;
        this.columns = columns.reduce((acc, column) => {
          acc[column.name] = new DBColumn(column);
          return acc;
        }, {} as { [key: string]: DBColumn });

        this.relations = relations.reduce((acc, relation) => {
          acc[relation.alias] = new DBRelation(relation);
          return acc;
        }, {} as { [key: string]: DBRelation });
      }
    };
  }
}

export async function loadSchemaTables(): Promise<string[]> {
  try {
    const { rows }: any = await DB.pool.query(EngineQueries.getTables);
    return (rows || []).map(({ table }: { table: string }) => table);
  } catch (error) {
    console.log(error);
    return [];
  }
}

export async function getTableColumns(table: string): Promise<Column[]> {
  try {
    const { rows } = await DB.pool.query(EngineQueries.getTableColumns, [
      table,
    ]);
    const { rows: primaryKeys } = await DB.pool.query(
      EngineQueries.getTablePrimaryKeys,
      [schema, table]
    );

    const { rows: uniqueColumns } = await DB.pool.query(
      EngineQueries.getTableUniqueColumns,
      [schema, table, schema, table]
    );

    return (rows || []).map((x: any) => ({
      ...x,
      primary: primaryKeys.some((column: any) => column.column_name === x.name),
      auto_increment: primaryKeys.some(
        (column: any) =>
          column.column_name === x.name && column.is_auto_increment === "yes"
      ),
      type: x.type === "ARRAY" ? `${x.mixed_column_type}[]` : x.type,
      defaultValue: x.default_value,
      unique: uniqueColumns.some((c: any) => c.column_name === x.name),
    })) as Column[];
  } catch (error) {
    return [] as Column[];
  }
}

export const readRelations = async () => {
  try {
    const buffer = await fs.readFile(
      path.join(process.cwd(), "relations.json")
    );
    return JSON.parse(buffer.toString());
  } catch (error) {
    return {} as any;
  }
};

export async function loadSchemaTablesWithColumns() {
  const tables = await loadSchemaTables();
  const relations = await readRelations();
  for (const table of tables) {
    const columns = await getTableColumns(table);
    const dbRelations = (relations[table] || []) as Relation[];
    const base = new BaseModel(table);
    DB.register(base.modelFactory(columns, dbRelations));
  }
}

export async function applyMigrations({
  schema: dbSchema,
  reset = false,
  additionalMigrations = [],
}: MigrationOptions) {
  dbSchema = dbSchema || schema;
  if (reset) {
    await DBManager.dropSchema(schema);
    fsSync.rmSync(path.join(process.cwd(), "migrations"), {
      recursive: true,
      force: true,
    });
  }

  const isInitialLoad = !Migrations.migrationsFolderExists();

  Migrations.createMigrationsFolder();
  if (!isInitialLoad) {
    await Migrations.runNewMigration(
      async () => await DBManager.createSchema(schema)
    ).catch((err) => console.error(err));

    for (const model of Object.values(DB.models || {})) {
      await Migrations.runNewMigration(
        async () => await DBManager.createTable(model)
      ).catch((err) => console.log(err));
    }

    if (additionalMigrations.length) {
      for (const migration of additionalMigrations) {
        await Migrations.createMigration(migration);
      }
    }
  }

  await Migrations.applyMigrations();
}

export async function init({
  schema,
  reset,
  additionalMigrations,
}: MigrationOptions) {
  await loadSchemaTablesWithColumns();
  await applyMigrations({ schema, reset, additionalMigrations });
  return DB;
}
