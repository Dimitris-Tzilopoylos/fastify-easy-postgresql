import { register, withRefResolver } from "fastify-zod";
import { FastifyInstance } from "fastify";

export const registerZodSwagger = async (server: FastifyInstance) => {
  const jsonSchemas = server.engine.buildZodSchemas();
  const { $ref, schemas } = jsonSchemas;

  await register(server, {
    jsonSchemas,
    swaggerUiOptions: {
      routePrefix: "/api/v1/swagger",
      staticCSP: true,
      theme: {
        title: "Engine API",
      },
    },
    swaggerOptions: withRefResolver({
      openapi: {
        info: {
          title: "Engine API",
          description: "Engine API",
          version: "1",
          contact: {
            email: "dimtzilop@iti.gr",
            name: "Dimitris Tzilopoylos",
          },
        },
      },
    }),
  });

  return { $ref, schemas };
};
