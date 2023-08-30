import { FastifyInstance } from "fastify";
import fs from "fs/promises";
import path from "path";
import axios from "axios";

export const writeSwaggerFile = async (
  server: FastifyInstance,
  filename = "engine.swagger.json"
) => {
  try {
    await server.ready();
    const { data } = await axios.get(
      `http://0.0.0.0:${process.env.PORT || 8000}/api/v1/swagger/json`
    );
    await fs.writeFile(
      path.join(process.cwd(), filename),
      JSON.stringify(data, null, 2)
    );
  } catch (error) {
    console.error(error);
  }
};
