import dotenv from "dotenv";
dotenv.config();
import server from "./app";
import { normalizeNumber } from "./utils/generic";
import registerEngine from "./plugin";

const start = async () => {
  try {
    await registerEngine(server, {
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
        products: {
          filters: {
            from_name: (value: string) => ({
              name: {
                _ilike: value,
              },
            }),
          },
          pagination: true,
          httpHandlers: {
            get: {
              auth: false,
              canAccess: async (user: any) => user?.role?.name === "superadmin",
              include: (req, user) => ({
                category: { where: { name: { _eq: "jk" } } },
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
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
