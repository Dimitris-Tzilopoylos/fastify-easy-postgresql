import { DB, Model } from "easy-postgresql";
import { init } from ".";
import { toKebabCase, toSchemaRef } from "../utils/generic";
import {
  authSchema,
  registerResponseSchema,
  forgotPasswordBodySchema,
  loginResponseSchema,
  refreshTokenResponseSchema,
  refreshTokenSchema,
  buildModelGetResponseSchema,
  buildModelQueryParamsSchema,
  buildModelSchema,
  buildModelStatementResponseSchema,
  buildLoginRequestBodySchema,
  buildRegisterRequestBodySchema,
} from "./schema";
import { buildJsonSchemas } from "fastify-zod";
import { z } from "zod";
import {
  QueryParamsSchemaLEX,
  ResponseSchemaLEX,
  StatementResponseSchemaLEX,
  array_relation,
} from "./constants";
import {
  EngineApiRoute,
  EngineAuthConfig,
  HttpVerbKey,
  ModelFilters,
} from "./types";

export default class Engine {
  static db: typeof DB;
  static schemas: any = {};
  static apiRoutes: Record<string, EngineApiRoute> = {};
  static authModel: Model;
  static authConfig: EngineAuthConfig = {
    table: "users",
    primaryKeys: ["id"],
    accessTokenConfig: {
      expiresIn: "15m",
      secret: "access_token_secret",
    },
    refreshTokenConfig: {
      expiresIn: "1d",
      secret: "refresh_token_secret",
    },
    loginConfig: {
      identityField: "email",
      credentialsField: "password",
      include: {},
      shouldLogin: async (value: any) => true,
    },
  };
  static modelColumnFilters: Record<string, ModelFilters> = {};

  static async init({
    modelOptions,
    authConfig,
  }: {
    modelOptions: any;
    authConfig?: EngineAuthConfig;
  }) {
    Engine.db = await init();

    Engine.authConfig = {
      ...Engine.authConfig,
      ...(authConfig || {}),
    };

    Engine.authModel = (Engine.db.modelFactory as any)?.[
      Engine.authConfig?.table
    ];

    Engine.modelColumnFilters = Object.entries(modelOptions || {}).reduce(
      (acc, [key, value]: any) => {
        acc[key] = value.filters || {};
        return acc;
      },
      {} as Record<string, ModelFilters>
    );
    Engine.buildAllModelZodSchemas();

    Object.entries(Engine.db.models).forEach(([key, model]: any[]) => {
      if (model.isAggregate) {
        return;
      }
      const apiRoute = `/${toKebabCase(key)}`;
      if (Engine.apiRoutes[apiRoute]) {
        return;
      }
      const modelZodSchema =
        Engine.schemas[model.table][toSchemaRef(model.table)];
      const currentModelOptions = modelOptions?.[model.table] || {};
      const modelFilters = Engine.modelColumnFilters?.[model.table] || {};
      const { httpHandlers } = currentModelOptions || {};
      const pagination =
        typeof currentModelOptions.pagination === "undefined"
          ? true
          : !!currentModelOptions.pagination;
      const modelEffects = currentModelOptions.effects || {};
      Engine.apiRoutes[apiRoute] = {
        model: model as Model,
        modelFactory: (Engine.db.modelFactory as any)[
          model.table
        ] as typeof Model,
        modelZodSchema: Engine.schemas[model.table],
        modelZodQueryParamsSchema: buildModelQueryParamsSchema(
          model,
          modelFilters
        ),
        modelGetResponseZodSchema: buildModelGetResponseSchema(
          model,
          modelZodSchema,
          currentModelOptions
        ),
        modelStatementResponseZodSchema: buildModelStatementResponseSchema(
          model,
          modelZodSchema
        ),
        schemaName: toSchemaRef(model.table),
        getResponseSchemaName: toSchemaRef(model.table, ResponseSchemaLEX),
        queryParamsSchemaName: toSchemaRef(model.table, QueryParamsSchemaLEX),
        statementResponseSchemaName: toSchemaRef(
          model.table,
          StatementResponseSchemaLEX
        ),
        modelFilters,
        pagination,
        httpHandlers,
        effects: modelEffects,
      };

      Object.entries(modelEffects as Record<any, Promise<void>>).forEach(
        ([type, exec]) => {
          switch (type) {
            case "onInsert":
              Engine.db.onInsert(model.table, exec);
              break;
            case "onInsertAsync":
              Engine.db.onInsertAsync(model.table, exec);
              break;
            case "onUpdate":
              Engine.db.onUpdate(model.table, exec);
              break;
            case "onUpdateAsync":
              Engine.db.onUpdateAsync(model.table, exec);
              break;
            case "onSelect":
              Engine.db.onSelect(model.table, exec);
              break;
            case "onSelectAsync":
              Engine.db.onSelectAsync(model.table, exec);
              break;
            case "onDelete":
              Engine.db.onDelete(model.table, exec);
              break;
            case "onInsertAsync":
              Engine.db.onDeleteAsync(model.table, exec);
              break;
            case "onError":
              Engine.db.onError(model.table, exec);
              break;
            case "onErrorAsync":
              Engine.db.onErrorAsync(model.table, exec);
              break;
            default:
              break;
          }
        }
      );
    });
  }

  static buildZodSchemas() {
    return buildJsonSchemas(
      Object.values(Engine.apiRoutes).reduce(
        (
          acc,
          {
            modelZodSchema,
            modelGetResponseZodSchema,
            modelZodQueryParamsSchema,
            modelStatementResponseZodSchema,
            model,
          }
        ) => {
          return {
            ...acc,
            ...modelZodSchema,
            ...modelGetResponseZodSchema,
            ...modelZodQueryParamsSchema,
            ...modelStatementResponseZodSchema,
            ...(model.table === Engine.authConfig.table &&
              buildLoginRequestBodySchema(model, Engine.authConfig)),
            ...(model.table === Engine.authConfig.table &&
              buildRegisterRequestBodySchema(model, Engine.authConfig)),
          };
        },
        {
          authSchema,
          registerResponseSchema,
          forgotPasswordBodySchema,
          loginResponseSchema,
          refreshTokenResponseSchema,
          refreshTokenSchema,
        }
      )
    );
  }

  static buildAllModelZodSchemas() {
    Object.values(Engine.db.models as any).forEach((model: any) => {
      if (model.isAggregate) {
        return;
      }
      Engine.schemas[model.table] = buildModelSchema(model);
    });

    Object.values(Engine.db.models).forEach((model: any) => {
      if (model.isAggregate) {
        return;
      }
      const extendedSchemas = Object.values(model.relations)
        .map((relation: any) => {
          const zodSchema =
            Engine.schemas[relation.to_table]?.[toSchemaRef(relation.to_table)];

          if (!zodSchema) {
            return;
          }
          return {
            [relation.alias]:
              relation.type === array_relation
                ? z.array(zodSchema.optional()).optional()
                : zodSchema.optional(),
          };
        })
        .filter(Boolean);

      if (extendedSchemas.length) {
        Engine.schemas[model.table][toSchemaRef(model.table)] = Engine.schemas[
          model.table
        ][toSchemaRef(model.table)].extend(
          extendedSchemas.reduce(
            (acc, extendedSchema) => ({ ...acc, ...extendedSchema }),
            {} as any
          )
        );
      }
    });

    Object.values(Engine.db.models).forEach((model: any) => {
      if (model.isAggregate) {
        return;
      }
      const extendedSchemas = Object.values(model.relations)
        .map((relation: any) => {
          const zodSchema =
            Engine.schemas[relation.to_table]?.[toSchemaRef(relation.to_table)];

          if (!zodSchema) {
            return;
          }
          return {
            [relation.alias]:
              relation.type === array_relation
                ? z.array(zodSchema.optional()).optional()
                : zodSchema.optional(),
          };
        })
        .filter(Boolean);
      if (extendedSchemas.length) {
        Engine.schemas[model.table][toSchemaRef(model.table)] = Engine.schemas[
          model.table
        ][toSchemaRef(model.table)].extend(
          extendedSchemas.reduce(
            (acc, extendedSchema) => ({ ...acc, ...extendedSchema }),
            {} as any
          )
        );
      }
    });
  }

  static modelHasEnabledAuthForMethod(
    method: HttpVerbKey,
    config: EngineApiRoute
  ) {
    return !!config.httpHandlers?.[method]?.auth;
  }

  static getModelAuthAccessFunction(
    method: HttpVerbKey,
    config: EngineApiRoute
  ) {
    return config?.httpHandlers?.[method]?.canAccess;
  }
}
