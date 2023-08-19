import dotenv from "dotenv";
dotenv.config();
import server from "./app";
import Engine from "./db/engine";
import { normalizeNumber } from "./utils/generic";
import fastifySensible from "@fastify/sensible";
import { registerZodSwagger } from "./swagger";
import { dataRoutes } from "./modules/data";
import { FastifyInstance } from "fastify";

const fastifyPGEngine = async (
  fastify: FastifyInstance,
  opt: any,
  next: any
) => {
  const {
    disableApiHandlers = false,
    apiPrefix = "api/v1",
    modelsColumnFilters = {},
  } = opt || {};

  await Engine.init(modelsColumnFilters);
  fastify.decorate("engine", Engine);
  fastify.decorateRequest("model", null);
  const { $ref, schemas } = await registerZodSwagger(fastify);
  if (!disableApiHandlers) {
    await fastify.register(dataRoutes({ $ref, schemas }), {
      prefix: apiPrefix,
    });
  }
  await next();
};

const start = async () => {
  try {
    const options = {
      modelsColumnFilters: {
        products: {
          id: (value: string) => ({
            id: {
              _eq: value,
            },
          }),
        },
      },
    };
    await server.register(fastifySensible);
    await server.register(fastifyPGEngine, options);
    await server.listen({
      host: process.env.HOST,
      port: normalizeNumber(process.env.PORT),
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
