import fastify, { FastifyInstance as BaseFastifyInstance } from "fastify";
import { Model } from "easy-postgresql";
import Engine from "./db/engine";
import { ModelFilters } from "./db/types";

interface FastifyEnhancedInstance {
  engine: typeof Engine;
  // Add other custom properties if needed
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
