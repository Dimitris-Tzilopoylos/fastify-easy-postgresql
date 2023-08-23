import dotenv from "dotenv";
dotenv.config();
import server from "./app";
import { normalizeNumber } from "./utils/generic";
import fastifyPGEngine from "./plugin";
import { PGEngineOptions } from "./db/types";

const start = async () => {
  try {
    const options: PGEngineOptions = {
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
        users: {
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
              auth: false,
              canAccess: async (user: any) => user?.role?.name === "superadmin",
            },
          },
          effects: {
            onSelectAsync: async (data: any, instance: any) => {},
          },
        },
      },
      graphql: false,
    };
    await server.register(fastifyPGEngine, options);
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
