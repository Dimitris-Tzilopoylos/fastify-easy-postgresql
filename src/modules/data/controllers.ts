import { FastifyRequest, FastifyReply } from "fastify";
import server from "../../app";

export async function get(req: FastifyRequest, reply: FastifyReply) {
  const data = await req.model.find({ include: { category: true } });
  reply.code(200).send(data);
}

export async function post(req: FastifyRequest, reply: FastifyReply) {
  const data = await req.model.create(req.body);
  if (!data) {
    throw server.httpErrors.internalServerError(
      `${req.model.table} entity failed to be created`
    );
  }
  reply.code(201).send(data);
}

export async function put(req: FastifyRequest, reply: FastifyReply) {
  const data = await req.model.update(req.body as any);
  if (!data?.length) {
    throw server.httpErrors.internalServerError(
      `${req.model.table} entity/-ies failed to be updated`
    );
  }
  reply.code(200).send(data);
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const data = await req.model.delete(req.body as any);
  if (!data?.length) {
    throw server.httpErrors.internalServerError(
      `${req.model.table} entity/-ies failed to be deleted`
    );
  }
  reply.code(200).send(data);
}
