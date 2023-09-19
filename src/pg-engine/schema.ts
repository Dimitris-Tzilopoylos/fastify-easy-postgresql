import { z } from "zod";
import {
  PathParamsSchemaLEX,
  QueryParamsSchemaLEX,
  ResponseSchemaLEX,
  StatementResponseSchemaLEX,
  array_relation,
  object_relation,
  schema,
} from "./constants";
import { Model, Column } from "easy-psql";
import { toSchemaRef } from "../utils/generic";
import { EngineAuthConfig, ModelFilters } from "./types";

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

export const authSchema = z.object({
  authorization: z
    .string()
    .refine(
      (value) => value.startsWith("Bearer ") && value.length > `Bearer `.length
    ),
});

export const refreshTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(4),
});

export const registerResponseSchema = z.object({
  message: z.string(),
});

export const loginResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});

export const forgotPasswordBodySchema = z.object({
  email: z.string().trim().email(),
});

const columnToZodType = (column: Column, strict = true) => {
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
    column.type.startsWith("money") ||
    column.type.startsWith("serial") ||
    column.type.startsWith("bigserial") ||
    column.type.startsWith("bigint") ||
    column.type.startsWith("real")
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
    chain = z.any();
  } else {
    chain = z.any();
  }

  if (isArray) {
    if (column.columnConfig.nullable) {
      return z.union([z.array(chain), z.null()]).optional();
    }
    return z.array(chain);
  }

  if (column.columnConfig.nullable && strict) {
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
  const schemaName = toSchemaRef(model.table, QueryParamsSchemaLEX);
  if (!_iter.length) {
    return { [schemaName]: initialFiltersSchema };
  }
  return {
    [schemaName]: initialFiltersSchema.extend(
      _iter.reduce((acc, [key]) => {
        acc[key] = z.any().optional();
        return acc;
      }, {} as any)
    ),
  };
};

export const buildModelPathParamsSchema = (
  model: Model,
  identifier?: string
) => {
  if (!identifier) {
    return {};
  }

  const column = (model.columns as any)?.[identifier];

  if (!column) {
    return {};
  }

  return {
    [toSchemaRef(model.table, PathParamsSchemaLEX)]: z.object({
      [identifier]: columnToZodType(column, false),
    }),
  };
};

export const buildModelGetResponseSchema = (
  model: Model,
  modelSchema: any,
  opt?: any
) => {
  const { pagination = true } = opt || {};
  if (!pagination) {
    return {
      [toSchemaRef(model.table, ResponseSchemaLEX)]: z.array(
        modelSchema.optional()
      ),
    };
  }
  return {
    [toSchemaRef(model.table, ResponseSchemaLEX)]: z.object({
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

export const buildModelStatementResponseSchema = (
  model: Model,
  modelSchema: any
) => {
  return {
    [toSchemaRef(model.table, StatementResponseSchemaLEX)]: z.array(
      modelSchema.optional()
    ),
  };
};

export const buildLoginRequestBodySchema = (
  model: Model,
  authConfig: EngineAuthConfig
) => {
  if (!authConfig.loginConfig) {
    return {};
  }

  const identityColumn = (model.columns as any)?.[
    authConfig.loginConfig.identityField
  ];

  const credentialsColumn = (model.columns as any)?.[
    authConfig.loginConfig.credentialsField
  ];

  if (!identityColumn) {
    return {};
  }
  if (!credentialsColumn) {
    return {};
  }

  return {
    loginRequestBodySchema: z.object({
      [authConfig.loginConfig.identityField]: columnToZodType(identityColumn),
      [authConfig.loginConfig.credentialsField]:
        columnToZodType(credentialsColumn),
    }),
  };
};

export const buildRegisterRequestBodySchema = (
  model: Model,
  authConfig: EngineAuthConfig
) => {
  return {
    registerRequestBodySchema: z.object(
      Object.values(model.columns).reduce((acc: any, column: any) => {
        const { primaryKeys = [] } = authConfig;
        if (primaryKeys?.indexOf(column.column) !== -1) {
          return acc;
        }
        acc[column.column] = columnToZodType(column);
        return acc;
      }, {} as any) as any
    ),
  };
};
