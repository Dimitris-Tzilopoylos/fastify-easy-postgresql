import { DB, Model } from "easy-postgresql";
import { init } from ".";
import { toKebabCase, toSchemaRef } from "../utils/generic";
import {
  buildModelGetResponseSchema,
  buildModelQueryParamsSchema,
  buildModelSchema,
} from "./schema";
import { buildJsonSchemas } from "fastify-zod";
import { z } from "zod";
import { array_relation } from "./constants";
import { ModelFilters } from "./types";

export default class Engine {
  static db: typeof DB;
  static schemas: any = {};
  static apiRoutes: {
    [key: string]: {
      model: Model;
      modelFactory: typeof Model;
      modelZodSchema: any;
      modelGetResponseZodSchema: any;
      modelZodQueryParamsSchema: any;
      schemaName: string;
      getResponseSchemaName: string;
      queryParamsSchemaName: string;
      modelFilters: ModelFilters;
    };
  } = {};

  static modelColumnFilters: Record<string, ModelFilters> = {};

  static async init(filters: Record<string, ModelFilters>) {
    Engine.modelColumnFilters = filters || {};
    Engine.db = await init();
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
      const modelFilters = Engine.modelColumnFilters?.[model.table] || {};
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
          modelZodSchema
        ),
        schemaName: toSchemaRef(model.table),
        getResponseSchemaName: toSchemaRef(model.table, "Response"),
        queryParamsSchemaName: toSchemaRef(model.table, "QueryParams"),
        modelFilters,
      };
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
          }
        ) => {
          return {
            ...acc,
            ...modelZodSchema,
            ...modelGetResponseZodSchema,
            ...modelZodQueryParamsSchema,
          };
        },
        {}
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
}
