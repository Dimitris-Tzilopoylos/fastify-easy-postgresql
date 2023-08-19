import { Model } from "easy-postgresql";
import { FastifyInstance } from "fastify";
import { modelPreHandler } from "../../modelPrehandler";
import { get, post, put, remove } from "./controllers";
import { toKebabCase, toUpperCaseModelTitle } from "../../utils/generic";
import { $Ref, JsonSchema } from "fastify-zod/build/JsonSchema";

export function dataRoutes({
  $ref,
  schemas,
}: {
  $ref: $Ref<any>;
  schemas: JsonSchema[];
}) {
  return async (fastify: FastifyInstance) => {
    Object.values(fastify.engine.apiRoutes).forEach((value) => {
      const model = value.model;
      const apiRoute = `/${toKebabCase(model.table)}`;
      const preHandler = modelPreHandler(value.modelFactory);

      fastify.get(
        apiRoute,
        {
          preHandler,
          schema: {
            tags: [toUpperCaseModelTitle(model.table)],
            response: {
              200: $ref(value.getResponseSchemaName),
            },
          },
        },
        get
      );

      fastify.post(
        apiRoute,
        {
          preHandler,
          schema: {
            tags: [toUpperCaseModelTitle(model.table)],
            response: {
              // 200: $ref(``)
              201: $ref(value.schemaName),
            },
          },
        },
        post
      );

      fastify.put(
        apiRoute,
        {
          preHandler,
          schema: {
            tags: [toUpperCaseModelTitle(model.table)],
            response: {
              // 200: $ref(``)
              200: $ref(value.schemaName),
            },
          },
        },
        put
      );

      fastify.delete(
        apiRoute,
        {
          preHandler,
          schema: {
            tags: [toUpperCaseModelTitle(model.table)],
            response: {
              // 200: $ref(``)
              200: $ref(value.schemaName),
            },
          },
        },
        remove
      );
    });
  };
}
