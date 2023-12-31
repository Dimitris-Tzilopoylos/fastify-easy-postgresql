import fastify, { FastifyInstance as BaseFastifyInstance } from "fastify";
import { Model } from "easy-psql";
import Engine from "./pg-engine/engine";
import { ModelFilters } from "./pg-engine/types";

interface FastifyEnhancedInstance {
  engine: typeof Engine;
}

export interface FastifyEnhancedRequest {
  model: Model & { registeredFilters?: ModelFilters };
  user?: any;
}

export interface FastifyRequestWithModel extends FastifyEnhancedRequest {
  model: Model;
}

declare module "fastify" {
  interface FastifyInstance extends FastifyEnhancedInstance {}
  interface FastifyRequest extends FastifyEnhancedRequest {}
}

const server = fastify({ logger: true });

export default server;
