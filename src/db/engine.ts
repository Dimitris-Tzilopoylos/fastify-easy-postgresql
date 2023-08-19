import { DB, Model, Relation } from "easy-postgresql";
import { init } from ".";
import { toKebabCase, toSchemaRef } from "../utils/generic";
import { buildModelGetResponseSchema, buildModelSchema } from "./schema";
import { buildJsonSchemas } from "fastify-zod";
import { z } from "zod";
import { array_relation } from "./constants";

export default class Engine {
  static db: typeof DB;
  static apiRoutes: {
    [key: string]: {
      model: Model;
      modelFactory: typeof Model;
      modelZodSchema: any;
      modelGetResponseZodSchema: any;
      schemaName: string;
      getResponseSchemaName: string;
    };
  } = {};

  static async init() {
    Engine.db = await init();
    Object.entries(Engine.db.models).forEach(([key, model]: any[]) => {
      if (key.includes("aggregate")) {
        return;
      }
      const apiRoute = `/${toKebabCase(key)}`;
      if (Engine.apiRoutes[apiRoute]) {
        return;
      }
      const modelZodSchema = buildModelSchema(model);
      Engine.apiRoutes[apiRoute] = {
        model: model as Model,
        modelFactory: (Engine.db.modelFactory as any)[
          model.table
        ] as typeof Model,
        modelZodSchema: modelZodSchema,
        modelGetResponseZodSchema: buildModelGetResponseSchema(model),
        schemaName: toSchemaRef(model.table),
        getResponseSchemaName: toSchemaRef(model.table, "Response"),
      };
    });
  }

  static buildZodSchemas() {
    return buildJsonSchemas(
      Object.values(Engine.apiRoutes).reduce(
        (acc, { modelZodSchema, modelGetResponseZodSchema, model }) => {
          return {
            ...acc,
            ...Object.entries(modelZodSchema).reduce(
              (acc, [key, value]: any) => {
                const extendedSchemas = Object.values(model.relations)
                  .map((relation: any) => {
                    const zodSchema =
                      Engine.apiRoutes[`/${toKebabCase(relation.to_table)}`]
                        ?.modelZodSchema;
                    if (!zodSchema) {
                      return;
                    }
                    const zodSchemaValue: any =
                      zodSchema[toSchemaRef(relation.to_table)];
                    return {
                      [relation.alias]:
                        relation.type === array_relation
                          ? z.array(zodSchemaValue.optional()).optional()
                          : zodSchemaValue.optional(),
                    };
                  })
                  .filter(Boolean);
                if (!extendedSchemas.length) {
                  acc[key] = value;
                } else {
                  acc[key] = value.extend(
                    extendedSchemas.reduce(
                      (acc, extendedSchema) => ({
                        ...acc,
                        ...extendedSchema,
                      }),
                      {} as any
                    )
                  );
                }

                return acc;
              },
              {} as any
            ),
            ...modelGetResponseZodSchema,
          };
        },
        {}
      )
    );
  }
}
