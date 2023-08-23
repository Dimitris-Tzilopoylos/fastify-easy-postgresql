import { FastifyInstance } from "fastify";
import {
  loginHandler,
  refreshTokenHandler,
  registerHandler,
} from "./controllers";
import { $Ref } from "fastify-zod/build/JsonSchema";

export const authRoutes =
  ({ $ref }: { $ref: $Ref<any> }) =>
  async (server: FastifyInstance) => {
    const authModel = server.engine.authModel;
    const authConfig = server.engine.authConfig;

    server.post(
      "/login",
      {
        schema: {
          tags: ["Authentication"],
          body: $ref("loginRequestBodySchema"),
          response: {
            200: $ref("loginResponseSchema"),
          },
        },
      },
      loginHandler(authModel, authConfig)
    );

    server.post(
      "/register",
      {
        schema: {
          tags: ["Authentication"],
          body: $ref("registerRequestBodySchema"),
          response: {
            201: $ref("registerResponseSchema"),
          },
        },
      },
      registerHandler(authModel, authConfig)
    );

    server.post(
      "/refresh-token",
      {
        schema: { tags: ["Authentication"], body: $ref("refreshTokenSchema") },
      },
      refreshTokenHandler(authModel, authConfig)
    );
  };
