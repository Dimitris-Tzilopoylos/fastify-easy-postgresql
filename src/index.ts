import dotenv from "dotenv";
dotenv.config();
import server from "./app";
import { normalizeNumber } from "./utils/generic";
import registerEngine from "./plugin";
import { writeSwaggerFile } from "./utils/swagger";
import cluster from "node:cluster";

const start = async () => {
  try {
    await registerEngine(server, {
      swaggerConfig: {
        enabled: process.env.NODE_ENV !== "production",
        endpoint: "/api/v1/swagger",
        title: "Engine API",
        description: "My API",
      },
      authOptions: {
        url: "/auth",
        table: "users",
        primaryKeys: ["id"],
        loginConfig: {
          identityField: "email",
          credentialsField: "password",
          include: { role: true },
          shouldLogin: async (user: any) => !!user?.verified,
        },
      },
      modelOptions: {
        roles: {
          pagination: false,
        },
        tags: {
          pagination: false,
        },
        users: {
          pagination: false,
          httpHandlers: {
            get: {
              include: (req, user) => ({ role: true }),
            },
          },
        },
        products: {
          identifier: "id",
          filters: {
            from_name: (value: string) => ({
              name: {
                _ilike: value,
              },
            }),
          },
          pagination: false,
          httpHandlers: {
            get: {
              auth: true,
              canAccess: async (user: any) => user?.role?.name === "superadmin",
              include: (req, user) => ({
                category: true,
              }),
            },
          },
        },
      },
      graphql: false,
    });
    await server.listen({
      host: process.env.HOST,
      port: normalizeNumber(process.env.PORT),
    });
    if (process.env.NODE_ENV === "development") {
      await writeSwaggerFile(server);
    }
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

if (cluster.isPrimary) {
  for (let i = 0; i < 16; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  start();
}
