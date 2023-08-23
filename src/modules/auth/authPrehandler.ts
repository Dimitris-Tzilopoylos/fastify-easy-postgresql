import { FastifyReply, FastifyRequest } from "fastify";
import { EngineAuthConfig } from "../../pg-engine/types";
import { authorize } from "./utils";
import server from "../../app";

export const authPrehandler =
  (authModel: any, opt: EngineAuthConfig) =>
  async (req: FastifyRequest, reply: FastifyReply, done: any) => {
    const user = authorize(req, "access", opt);
    if (!user) {
      throw server.httpErrors.unauthorized();
    }

    req.user = user;
  };
