import { FastifyInstance } from "fastify";
import server from "../app";
import Engine from "../pg-engine/engine";
import fastifySensible from "@fastify/sensible";
import { registerZodSwagger } from "../swagger";
import { authRoutes } from "../modules/auth";
import { dataRoutes } from "../modules/data";
import GraphQL from "../pg-engine/graphql";
import { PGEngineOptions } from "../pg-engine/types";

const fastifyPGEngine = async (
  fastify: FastifyInstance,
  opt: any,
  next: any
) => {
  const {
    disableApiHandlers = false,
    apiPrefix = "api/v1",
    authOptions,
    modelOptions = {},
    graphql = false,
  } = opt || {};
  await server.register(fastifySensible);
  await Engine.init({ modelOptions, authConfig: authOptions });
  fastify.decorate("engine", Engine);
  fastify.decorateRequest("model", null);

  const { $ref, schemas } = await registerZodSwagger(fastify);
  if (authOptions) {
    await fastify.register(authRoutes({ $ref }), {
      prefix: `${apiPrefix}${
        authOptions?.url?.startsWith("/")
          ? authOptions?.url
          : `/${authOptions?.url || "auth"}`
      }`,
    });
  }
  if (!disableApiHandlers) {
    await fastify.register(dataRoutes({ $ref, schemas }), {
      prefix: apiPrefix,
    });
  }

  if (graphql) {
    GraphQL.engine = Engine;
    GraphQL.buildGraphQLSchema();
  }
  await next();
};

const registerEngine = async (
  server: FastifyInstance,
  options: PGEngineOptions
) => {
  await server.register(fastifyPGEngine, options);
};

export default registerEngine;
