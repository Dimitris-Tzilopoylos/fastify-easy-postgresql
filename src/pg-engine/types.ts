import { z } from "zod";
import { columnSchema, dbTableSchema, relationSchema } from "./schema";
import { Model } from "easy-psql";
import jwt from "jsonwebtoken";
import { FastifyRequest } from "fastify";

export type Relation = z.infer<typeof relationSchema>;
export type Column = z.infer<typeof columnSchema>;
export type DatabaseTable = z.infer<typeof dbTableSchema>;
export type ModelFilters = Record<
  string,
  (value: any, where?: any, filters?: any) => Record<string, any>
>;

export type HttpVerbKey = "get" | "post" | "put" | "delete";

export type BaseModelHttpHandlerConfig = {
  auth?: boolean;
  canAccess?: (user: any, req: any) => Promise<boolean>;
  queryParamsFormatter?: (value: any, user: any) => any;
  paramsFormatter?: (value: any, user: any) => any;
  responseFormatter?: (data: any, user: any) => any;
};

export type ModelHttpHandlers = {
  get?: BaseModelHttpHandlerConfig & {
    include?: (req: FastifyRequest<any>, user: any) => any;
  };
  post?: BaseModelHttpHandlerConfig & {
    bodyFormatter: (value: any, user: any) => any;
  };
  put?: BaseModelHttpHandlerConfig & {
    bodyFormatter: (value: any, user: any) => any;
  };
  delete?: BaseModelHttpHandlerConfig & {
    bodyFormatter: (value: any, user: any) => any;
  };
};

export type EngineAuthConfig = {
  table: string;
  primaryKeys?: string[];
  url?: string;
  accessTokenConfig?: {
    expiresIn?: string;
    secret?: string;
    algorithm?: jwt.Algorithm;
  };
  refreshTokenConfig?: {
    expiresIn?: string;
    secret?: string;
    algorithm?: jwt.Algorithm;
  };
  loginConfig?: {
    identityField: string;
    credentialsField: string;
    include: any;
    shouldLogin: (value: any) => Promise<boolean>;
  };
};

export type EngineApiRoute = {
  model: Model;
  modelFactory: typeof Model;
  modelFilters: ModelFilters;
  pagination: boolean;
  modelZodSchema: any;
  modelGetResponseZodSchema: any;
  modelZodQueryParamsSchema: any;
  modelStatementResponseZodSchema: any;
  modelParamsZodSchema?: any;
  schemaName: string;
  getResponseSchemaName: string;
  queryParamsSchemaName: string;
  statementResponseSchemaName: string;
  paramsSchemaName?: string;
  httpHandlers?: ModelHttpHandlers;
  effects?: Record<string, Promise<void>>;
  identifier?: string;
};

export type EngineSwaggerOptions = {
  endpoint: string;
  enabled?: boolean;
  description?: string;
  title?: string;
  version?: string;
  contact?: {
    email?: string;
    name?: string;
  };
};

export type CustomMigrationConfig = {
  up: string;
  down: string;
};

export type MigrationOptions = {
  reset?: boolean;
  additionalMigrations?: CustomMigrationConfig[];
  schema?: string;
};

export type PGEngineOptions = {
  migrationOptions?: MigrationOptions;
  disableApiHandlers?: boolean;
  apiPrefix?: string;
  swaggerConfig?: EngineSwaggerOptions;
  authOptions?: EngineAuthConfig;
  modelOptions?: Record<
    string,
    {
      identifier?: string;
      filters?: Record<string, (value: any, where?: any, data?: any) => any>;
      pagination?: boolean;
      httpHandlers?: ModelHttpHandlers;
      effects?: {
        onSelect?: (data: any, instance: any) => Promise<void>;
        onSelectAsync?: (data: any, instance: any) => Promise<void>;
        onInsert?: (data: any, instance: any) => Promise<void>;
        onInsertAsync?: (data: any, instance: any) => Promise<void>;
        onUpdate?: (data: any, instance: any) => Promise<void>;
        onUpdateAsync?: (data: any, instance: any) => Promise<void>;
        onDelete?: (data: any, instance: any) => Promise<void>;
        onDeleteAsync?: (data: any, instance: any) => Promise<void>;
        onError?: (data: any, instance: any) => Promise<void>;
        onErrorAsync?: (data: any, instance: any) => Promise<void>;
      };
    }
  >;
  graphql?: boolean;
};

export const gqlFloat = "Float";
export const gqlInt = "Int";
export const gqlString = "String";
export const gqlBoolean = "Boolean";
export const gqlObject = "JSONObject";

export const gqlFloatArray = "[Float]";
export const gqlIntArray = "[Int]";
export const gqlStringArray = "[String]";
export const gqlBooleanArray = "[Boolean]";
export const gqlObjectArray = "[JSONObject]";

export const supportedWhereClauseTypesByOperator: {
  [key: string]: { [key: string]: string }[];
} = {
  _in: [
    { type: "float_array", value: gqlFloatArray },
    { type: "int_array", value: gqlIntArray },
    { type: "string_array", value: gqlStringArray },
    { type: "boolean_array", value: gqlBooleanArray },
  ],
  _nin: [
    { type: "float_array", value: gqlFloatArray },
    { type: "int_array", value: gqlIntArray },
    { type: "string_array", value: gqlStringArray },
    { type: "boolean_array", value: gqlBooleanArray },
  ],
  _all: [
    { type: "float_array", value: gqlFloatArray },
    { type: "int_array", value: gqlIntArray },
    { type: "string_array", value: gqlStringArray },
    { type: "boolean_array", value: gqlBooleanArray },
  ],
  _any: [
    { type: "float_array", value: gqlFloatArray },
    { type: "int_array", value: gqlIntArray },
    { type: "string_array", value: gqlStringArray },
    { type: "boolean_array", value: gqlBooleanArray },
  ],
  _nany: [
    { type: "float_array", value: gqlFloatArray },
    { type: "int_array", value: gqlIntArray },
    { type: "string_array", value: gqlStringArray },
    { type: "boolean_array", value: gqlBooleanArray },
  ],
  _lt: [
    { type: "float", value: gqlFloat },
    { type: "int", value: gqlInt },
  ],
  _lte: [
    { type: "float", value: gqlFloat },
    { type: "int", value: gqlInt },
  ],
  _gt: [
    { type: "float", value: gqlFloat },
    { type: "int", value: gqlInt },
  ],
  _gte: [
    { type: "float", value: gqlFloat },
    { type: "int", value: gqlInt },
  ],
  _eq: [
    { type: "float", value: gqlFloat },
    { type: "int", value: gqlInt },
    { type: "string", value: gqlString },
    { type: "boolean", value: gqlBoolean },
  ],
  _neq: [
    { type: "float", value: gqlFloat },
    { type: "int", value: gqlInt },
    { type: "string", value: gqlString },
    { type: "boolean", value: gqlBoolean },
  ],
  _is: [
    { type: "float", value: gqlFloat },
    { type: "int", value: gqlInt },
    { type: "string", value: gqlString },
    { type: "boolean", value: gqlBoolean },
  ],
  _is_not: [
    { type: "float", value: gqlFloat },
    { type: "int", value: gqlInt },
    { type: "string", value: gqlString },
    { type: "boolean", value: gqlBoolean },
  ],
  _like: [
    { type: "float", value: gqlFloat },
    { type: "int", value: gqlInt },
    { type: "string", value: gqlString },
    { type: "boolean", value: gqlBoolean },
  ],
  _ilike: [
    { type: "float", value: gqlFloat },
    { type: "int", value: gqlInt },
    { type: "string", value: gqlString },
    { type: "boolean", value: gqlBoolean },
  ],
  _in_array: [
    { type: "float", value: gqlFloat },
    { type: "int", value: gqlInt },
    { type: "string", value: gqlString },
    { type: "boolean", value: gqlBoolean },
  ],
};
