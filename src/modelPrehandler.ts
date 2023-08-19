import { FastifyRequest, FastifyReply } from "fastify";
import { Model } from "easy-postgresql";
import server from "./app";

export function modelPreHandler(
  modelFactory: any
): (req: FastifyRequest, reply: FastifyReply, done: any) => Promise<void> {
  return async (req: FastifyRequest, reply: FastifyReply, done: any) => {
    const model = new modelFactory();

    if (!model) {
      server.httpErrors.notFound();
    } else {
      req.model = model;
      done();
    }
  };
}
