import dotenv from "dotenv";
dotenv.config();
import server from "./app";
import Engine from "./db/engine";
import { normalizeNumber } from "./utils/generic";
import fastifySensible from "@fastify/sensible";
import { registerZodSwagger } from "./swagger";
import { dataRoutes } from "./modules/data";

const start = async () => {
  try {
    await Engine.init();
    server.decorate("engine", Engine);
    server.decorateRequest("model", null);
    await server.register(fastifySensible);
    const { $ref, schemas } = await registerZodSwagger(server);
    await server.register(dataRoutes({ $ref, schemas }), { prefix: "api/v1" });

    await server.listen({
      host: process.env.HOST,
      port: normalizeNumber(process.env.PORT),
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
