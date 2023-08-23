import { FastifyRequest } from "fastify";
import { EngineAuthConfig } from "../../db/types";
import jwt from "jsonwebtoken";

export const signAccessToken = (payload: any, opt: EngineAuthConfig) => {
  return jwt.sign(payload, opt.accessTokenConfig?.secret || "secret", {
    expiresIn: opt.accessTokenConfig?.expiresIn || "15m",
    ...(opt.accessTokenConfig?.algorithm && {
      algorithm: opt.accessTokenConfig?.algorithm,
    }),
  });
};

export const signRefreshToken = (payload: any, opt: EngineAuthConfig) => {
  return jwt.sign(payload, opt.refreshTokenConfig?.secret || "secret", {
    expiresIn: opt.refreshTokenConfig?.expiresIn || "1h",
    ...(opt.refreshTokenConfig?.algorithm && {
      algorithm: opt.refreshTokenConfig?.algorithm,
    }),
  });
};

export const signTokens = (payload: any, opt: EngineAuthConfig) => {
  return {
    access_token: signAccessToken(payload, opt),
    refresh_token: signRefreshToken(payload, opt),
  };
};

export const verifyAccessToken = (token: string, opt: EngineAuthConfig) => {
  return jwt.verify(token, opt.accessTokenConfig?.secret || "secret");
};

export const verifyRefreshToken = (token: string, opt: EngineAuthConfig) => {
  return jwt.verify(token, opt.refreshTokenConfig?.secret || "secret");
};

export const getTokenFromHeaders = (req: FastifyRequest) => {
  return req.headers.authorization?.split(" ")?.pop() || null;
};

export const authorize = (
  req: FastifyRequest<{ Body?: any }>,
  type: "access" | "refresh",
  opt: EngineAuthConfig
) => {
  const token =
    type === "access"
      ? getTokenFromHeaders(req)
      : (req.body as any)?.refresh_token;
  if (!token) {
    return null;
  }
  try {
    return type === "access"
      ? verifyAccessToken(token, opt)
      : verifyRefreshToken(token, opt);
  } catch (error) {
    return null;
  }
};

export const getLoginConfigWithDefaults = (opt: EngineAuthConfig) => {
  const {
    identityField = "email",
    credentialsField = "password",
    shouldLogin = (val: any) => true,
    include = {},
  } = opt.loginConfig || {};

  return {
    identityField,
    credentialsField,
    shouldLogin,
    include,
  };
};
