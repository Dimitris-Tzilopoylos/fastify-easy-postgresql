import { z } from "zod";
import { array_relation, object_relation, schema } from "./constants";
import { Model, Column } from "easy-postgresql";
import { toSchemaRef } from "../utils/generic";

export const relationSchema = z.object({
  alias: z.string(),
  from_table: z.string(),
  to_table: z.string(),
  from_column: z.string(),
  to_column: z.string(),
  type: z.enum([object_relation, array_relation]),
});

export const columnSchema = z.object({
  name: z.string(),
  type: z.string(),
  defaultValue: z.any().optional(),
  nullable: z.boolean().optional(),
  length: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  alias: z.string().optional(),
  primary: z.boolean().optional(),
  unique: z.boolean().optional(),
  foreign: z.boolean().optional(),
  auto_increment: z.boolean().optional(),
});

export const dbTableSchema = z.object({
  schema: z.string().default(schema),
  name: z.string(),
  columns: z.record(z.string(), columnSchema).optional(),
  relations: z.record(z.string(), relationSchema).optional(),
});

const columnToZodType = (column: Column) => {
  let chain: any = z;
  let isArray = false;
  if (column.type.includes("[]") || column.type === "ARRAY") {
    isArray = true;
  }

  if (
    column.type.startsWith("int") ||
    column.type.startsWith("numeric") ||
    column.type.startsWith("float") ||
    column.type.startsWith("decimal") ||
    column.type.startsWith("float") ||
    column.type.startsWith("double") ||
    column.type.startsWith("money")
  ) {
    chain = z.number();
  } else if (
    column.type.includes("char") ||
    column.type.includes("text") ||
    column.type.includes("time") ||
    column.type.includes("date") ||
    column.type.includes("uuid")
  ) {
    chain = z.string();
  } else if (column.type.startsWith("bool")) {
    chain = z.boolean();
  } else if (column.type.startsWith("json")) {
    chain = z.object({});
  } else {
    chain = z.any();
  }

  if (isArray) {
    if (column.columnConfig.nullable) {
      return z.union([z.array(chain), z.null()]).optional();
    }
    return z.array(chain);
  }

  if (column.columnConfig.nullable) {
    return z.union([chain.optional(), z.null()]).optional();
  }

  return chain;
};

export const buildModelSchema = (model: Model) => {
  return {
    [toSchemaRef(model.table)]: z.object(
      Object.values(model.columns).reduce((acc: any, column: any) => {
        acc[column.column] = columnToZodType(column);
        return acc;
      }, {} as any) as any
    ),
  };
};

export const buildModelGetResponseSchema = (model: Model) => {
  return {
    [toSchemaRef(model.table, "Response")]: z.array(
      buildModelSchema(model)[toSchemaRef(model.table)]
    ),
  };
};
