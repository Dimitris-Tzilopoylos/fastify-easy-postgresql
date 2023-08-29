import { register, withRefResolver } from "fastify-zod";
import { FastifyInstance } from "fastify";

export const registerZodSwagger = async (server: FastifyInstance) => {
  const jsonSchemas = server.engine.buildZodSchemas();
  const { $ref, schemas } = jsonSchemas;
  const swaggerConfig = !!server.engine.swaggerOptions.enabled
    ? {
        swaggerUiOptions: {
          routePrefix: server.engine.swaggerOptions?.endpoint,
          staticCSP: true,
          theme: {
            title: server.engine.swaggerOptions?.title,
          },
        },
        swaggerOptions: withRefResolver({
          openapi: {
            info: {
              title: server.engine.swaggerOptions?.title || "ENGINE API",
              description: server.engine.swaggerOptions?.description,
              version: server.engine.swaggerOptions?.version || "1",
              contact: server.engine.swaggerOptions?.contact,
            },
          },
        }),
      }
    : {};

  await register(server, {
    jsonSchemas,
    ...swaggerConfig,
  });

  return { $ref, schemas };
};
