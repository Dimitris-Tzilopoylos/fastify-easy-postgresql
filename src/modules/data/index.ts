import { FastifyInstance } from "fastify";
import { modelPreHandler } from "./modelPrehandler";
import {
  get,
  getByIdentifier,
  post,
  put,
  putByIdentifier,
  remove,
} from "./controllers";
import { toKebabCase, toUpperCaseModelTitle } from "../../utils/generic";
import { $Ref, JsonSchema } from "fastify-zod/build/JsonSchema";
import { EngineApiRoute } from "../../pg-engine/types";

export function dataRoutes({
  $ref,
}: {
  $ref: $Ref<any>;
  schemas: JsonSchema[];
}) {
  return async (fastify: FastifyInstance) => {
    Object.values(fastify.engine.apiRoutes).forEach((value: EngineApiRoute) => {
      const {
        model,
        identifier,
        paramsSchemaName,
        modelParamsZodSchema,
        queryParamsSchemaName,
        modelZodQueryParamsSchema,
      } = value;
      const apiRoute = `/${toKebabCase(model.table)}`;

      const getHeaders = fastify.engine.modelHasEnabledAuthForMethod(
        "get",
        value
      )
        ? { headers: $ref("authSchema") }
        : {};
      const postHeaders = fastify.engine.modelHasEnabledAuthForMethod(
        "post",
        value
      )
        ? { headers: $ref("authSchema") }
        : {};
      const putHeaders = fastify.engine.modelHasEnabledAuthForMethod(
        "put",
        value
      )
        ? { headers: $ref("authSchema") }
        : {};
      const deleteHeaders = fastify.engine.modelHasEnabledAuthForMethod(
        "delete",
        value
      )
        ? { headers: $ref("authSchema") }
        : {};

      const $paramsRef =
        identifier && paramsSchemaName
          ? { params: $ref(paramsSchemaName) }
          : {};

      const withIdentifierEndpoint =
        identifier && paramsSchemaName
          ? `${apiRoute}/:${identifier}`
          : apiRoute;

      const getPreHandler = modelPreHandler(
        value.modelFactory,
        value.modelFilters,
        fastify.engine.modelHasEnabledAuthForMethod("get", value),
        fastify.engine.getModelAuthAccessFunction("get", value),
        fastify.engine.authModel,
        fastify.engine.authConfig
      );

      const postPreHandler = modelPreHandler(
        value.modelFactory,
        value.modelFilters,
        fastify.engine.modelHasEnabledAuthForMethod("post", value),
        fastify.engine.getModelAuthAccessFunction("post", value),
        fastify.engine.authModel,
        fastify.engine.authConfig
      );

      const putPreHandler = modelPreHandler(
        value.modelFactory,
        value.modelFilters,
        fastify.engine.modelHasEnabledAuthForMethod("put", value),
        fastify.engine.getModelAuthAccessFunction("put", value),
        fastify.engine.authModel,
        fastify.engine.authConfig
      );

      const removePreHandler = modelPreHandler(
        value.modelFactory,
        value.modelFilters,
        fastify.engine.modelHasEnabledAuthForMethod("delete", value),
        fastify.engine.getModelAuthAccessFunction("delete", value),
        fastify.engine.authModel,
        fastify.engine.authConfig
      );

      fastify.get(
        apiRoute,
        {
          preHandler: getPreHandler,
          schema: {
            tags: [toUpperCaseModelTitle(model.table)],
            querystring: $ref(value.queryParamsSchemaName),
            ...getHeaders,
            response: {
              200: $ref(value.getResponseSchemaName),
            },
          },
        },
        get({
          pagination: value.pagination,
          include: value.httpHandlers?.get?.include,
          responseFormatter: value.httpHandlers?.get?.responseFormatter,
        })
      );

      fastify.post(
        apiRoute,
        {
          preHandler: postPreHandler,
          schema: {
            tags: [toUpperCaseModelTitle(model.table)],
            ...postHeaders,
            response: {
              201: $ref(value.schemaName),
            },
          },
        },
        post({
          responseFormatter: value.httpHandlers?.post?.responseFormatter,
        })
      );

      if (identifier && paramsSchemaName) {
        fastify.get(
          withIdentifierEndpoint,
          {
            preHandler: getPreHandler,
            schema: {
              tags: [toUpperCaseModelTitle(model.table)],
              ...getHeaders,
              ...$paramsRef,
              response: {
                200: $ref(value.schemaName),
              },
            },
          },
          getByIdentifier({
            identifier,
            modelParamsZodSchema: modelParamsZodSchema[paramsSchemaName],
            include: value.httpHandlers?.get?.include,
            responseFormatter: value.httpHandlers?.get?.responseFormatter,
          })
        );
        fastify.put(
          withIdentifierEndpoint,
          {
            preHandler: putPreHandler,
            schema: {
              tags: [toUpperCaseModelTitle(model.table)],
              ...putHeaders,
              ...$paramsRef,
              response: {
                200: $ref(value.statementResponseSchemaName),
              },
            },
          },
          putByIdentifier({
            identifier,
            modelParamsZodSchema: value.modelParamsZodSchema[paramsSchemaName],
            responseFormatter: value.httpHandlers?.put?.responseFormatter,
          })
        );

        fastify.delete(
          withIdentifierEndpoint,
          {
            preHandler: removePreHandler,
            schema: {
              tags: [toUpperCaseModelTitle(model.table)],
              ...deleteHeaders,
              ...$paramsRef,
              response: {
                200: $ref(value.statementResponseSchemaName),
              },
            },
          },
          remove({
            identifier,
            modelParamsZodSchema: value.modelParamsZodSchema[paramsSchemaName],
            responseFormatter: value.httpHandlers?.delete?.responseFormatter,
          })
        );
      }
      fastify.put(
        apiRoute,
        {
          preHandler: putPreHandler,
          schema: {
            tags: [toUpperCaseModelTitle(model.table)],
            querystring: $ref(queryParamsSchemaName),
            ...putHeaders,
            ...$paramsRef,
            response: {
              200: $ref(value.statementResponseSchemaName),
            },
          },
        },
        put({
          identifier,
          modelQueryParamsZodSchema:
            modelZodQueryParamsSchema?.[queryParamsSchemaName],
          responseFormatter: value.httpHandlers?.put?.responseFormatter,
        })
      );

      fastify.delete(
        apiRoute,
        {
          preHandler: removePreHandler,
          schema: {
            tags: [toUpperCaseModelTitle(model.table)],
            querystring: $ref(value.queryParamsSchemaName),
            ...deleteHeaders,
            ...$paramsRef,
            response: {
              200: $ref(value.statementResponseSchemaName),
            },
          },
        },
        remove({
          responseFormatter: value.httpHandlers?.delete?.responseFormatter,
          modelQueryParamsZodSchema:
            modelZodQueryParamsSchema?.[queryParamsSchemaName],
        })
      );
    });
  };
}
