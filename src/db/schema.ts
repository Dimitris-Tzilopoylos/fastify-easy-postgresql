import { z } from "zod";
import { array_relation, object_relation, schema } from "./constants";
import { Model, Column } from "easy-postgresql";
import { toSchemaRef } from "../utils/generic";
import { ModelFilters } from "./types";

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

export const buildInitialModelQueryParamsSchema = (model: Model) => {
  return z.object({
    page: z.number().min(1).optional().default(1),
    view: z.number().min(0).optional(),
    ...Object.entries(model.columns).reduce((acc, [key, value]: any) => {
      acc[key] = columnToZodType(value).optional();
      return acc;
    }, {} as any),
  });
};

export const buildModelQueryParamsSchema = (
  model: Model,
  modelFilters: ModelFilters
) => {
  const initialFiltersSchema = buildInitialModelQueryParamsSchema(model);
  const _iter = Object.entries(modelFilters);
  const schemaName = toSchemaRef(model.table, "QueryParams");
  if (!_iter.length) {
    return { [schemaName]: initialFiltersSchema };
  }
  return {
    [schemaName]: initialFiltersSchema.extend(
      _iter.reduce((acc, [key]) => {
        acc[key] = z.any().optional();
      }, {} as any)
    ),
  };
};

export const buildModelGetResponseSchema = (model: Model, modelSchema: any) => {
  return {
    [toSchemaRef(model.table, "Response")]: z.object({
      page: z.number(),
      view: z.number(),
      total: z.number(),
      limit: z.number(),
      skip: z.number(),
      per_page: z.number(),
      results: z.array(modelSchema.optional()),
    }),
  };
};
