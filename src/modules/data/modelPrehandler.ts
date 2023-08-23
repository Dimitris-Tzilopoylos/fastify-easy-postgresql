import { FastifyRequest, FastifyReply } from "fastify";

import server from "../../app";
import { EngineAuthConfig, ModelFilters } from "../../pg-engine/types";
import { authPrehandler } from "../auth/authPrehandler";

export function modelPreHandler(
  modelFactory: any,
  modelFilters?: ModelFilters,
  auth?: boolean,
  canAccess?: (user: any) => Promise<boolean>,
  authModel?: any,
  opt?: EngineAuthConfig
): (req: FastifyRequest, reply: FastifyReply, done: any) => Promise<void> {
  return async (req: FastifyRequest, reply: FastifyReply, done: any) => {
    if (auth && authModel && opt) {
      await authPrehandler(authModel, opt)(req, reply, done);
      console.log();
      if (canAccess) {
        const isAccessPermitted = await canAccess(req.user);
        if (!isAccessPermitted) {
          throw server.httpErrors.forbidden(
            "Access to this resource is restricted"
          );
        }
      }
    }

    const model = new modelFactory(null, modelFilters);

    if (!model) {
      throw server.httpErrors.notFound();
    } else {
      req.model = model;
    }
  };
}
