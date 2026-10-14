import { createApp } from "./app.js";
import { createContext } from "./context.factory.js";
import { hasCloudinary, loadEnv } from "./env.js";
import { logger } from "./lib/logger.js";

const env = loadEnv();
const ctx = await createContext(env);
const app = createApp(ctx);

const server = app.listen(env.PORT, () => {
  logger.info(
    { storage: hasCloudinary(env) ? "cloudinary" : "local" },
    `API listening on :${env.PORT}`,
  );
});

const shutdown = () => {
  server.close(() => {
    void ctx.db.$client.end().finally(() => process.exit(0));
  });
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
