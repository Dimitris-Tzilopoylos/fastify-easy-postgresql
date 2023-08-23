import { FastifyReply, FastifyRequest } from "fastify";
import { EngineAuthConfig } from "../../db/types";
import server from "../../app";
import bcrypt from "bcryptjs";
import { authorize, getLoginConfigWithDefaults, signTokens } from "./utils";
import { RefreshTokenRequestBody } from "./schema";

export const loginHandler =
  (authModel: any, opt: EngineAuthConfig) =>
  async (req: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const { identityField, credentialsField, shouldLogin, include } =
      getLoginConfigWithDefaults(opt);

    if (!identityField || !credentialsField) {
      throw server.httpErrors.internalServerError();
    }

    const requestBody: any = req.body;
    const identityFieldValue = requestBody[identityField];
    const credentialsFieldValue = requestBody[credentialsField];

    const model = new authModel();

    const user = await model.findOne({
      include,
      where: { [identityField]: { _eq: identityFieldValue } },
    });

    if (!user) {
      throw server.httpErrors.unauthorized("Invalid credentials");
    }

    const isAuthorized = await bcrypt.compare(
      credentialsFieldValue,
      user[credentialsField]
    );
    if (!isAuthorized) {
      throw server.httpErrors.unauthorized("Invalid credentials");
    }

    if (!(await shouldLogin(user))) {
      throw server.httpErrors.forbidden(
        "Access to this resource is restricted"
      );
    }

    const { [credentialsField]: _, ...sanitizedUser } = user;

    reply.code(200).send(signTokens(sanitizedUser, opt));
  };

export const registerHandler =
  (authModel: any, opt: EngineAuthConfig) =>
  async (req: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const requestBody: any = req.body;

    const { credentialsField } = getLoginConfigWithDefaults(opt);

    const hashPWD = await bcrypt.hash(requestBody[credentialsField], 12);

    const model = new authModel();

    const user = await model.create({
      ...requestBody,
      [credentialsField]: hashPWD,
    });

    if (!user) {
      throw server.httpErrors.internalServerError("User was not registered");
    }

    reply.code(201).send({ message: "User registration completed" });
  };

export const refreshTokenHandler =
  (authModel: any, opt: EngineAuthConfig) =>
  async (
    req: FastifyRequest<{ Body: RefreshTokenRequestBody }>,
    reply: FastifyReply
  ) => {
    const authorizedUser: any = authorize(req, "refresh", opt);
    if (!authorizedUser) {
      throw server.httpErrors.badRequest("Refresh token is invalid");
    }

    const model = new authModel();

    const { identityField, credentialsField, shouldLogin, include } =
      getLoginConfigWithDefaults(opt);

    const user = await model.findOne({
      include,
      where: { [identityField]: authorizedUser?.[identityField] },
    });

    if (!user) {
      throw server.httpErrors.notFound("User not found");
    }

    if (!(await shouldLogin(user))) {
      throw server.httpErrors.forbidden(
        "Access to this resource is restricted"
      );
    }

    const { [credentialsField]: _, ...sanitizedUser } = user;

    reply.code(200).send(signTokens(sanitizedUser, opt));
  };
