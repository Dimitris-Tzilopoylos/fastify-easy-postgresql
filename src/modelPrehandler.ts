import { FastifyRequest, FastifyReply } from "fastify";

import server from "./app";
import { ModelFilters } from "./db/types";

export function modelPreHandler(
  modelFactory: any,
  modelFilters?: ModelFilters
): (req: FastifyRequest, reply: FastifyReply, done: any) => Promise<void> {
  return async (req: FastifyRequest, reply: FastifyReply, done: any) => {
    const model = new modelFactory(null, modelFilters);

    if (!model) {
      throw server.httpErrors.notFound();
    } else {
      req.model = model;
    }
  };
}
