import {
  DB,
  Model,
  Column as DBColumn,
  Relation as DBRelation,
} from "easy-postgresql";
import { EngineQueries, schema } from "./constants";
import { normalizeNumber } from "../utils/generic";
import { Column, Relation } from "./types";
import fs from "fs/promises";
import path from "path";

DB.registerDatabase(schema);
DB.registerConnectionConfig({
  host: process.env.DB_HOST || "localhost",
  port: normalizeNumber(process.env.DB_PORT, 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "postgres",
  min: normalizeNumber(process.env.MIN_POOL_CONNECTIONS || 0),
  max: normalizeNumber(process.env.MAX_POOL_CONNECTIONS || 10),
});

class BaseModel {
  table: string = "";

  constructor(table: string) {
    this.table = table;
  }

  modelFactory(columns: Column[], relations: Relation[]): any {
    const table = this.table;
    return class mdlFacotry extends Model {
      constructor(conn?: any) {
        super(table, conn);
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
    return (rows || []) as Column[];
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

export async function init() {
  await loadSchemaTablesWithColumns();
  return DB;
}
