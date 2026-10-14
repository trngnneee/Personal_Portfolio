import { createApp } from "./app.js";
import { createContext } from "./context.factory.js";
import { hasCloudinary, loadEnv } from "./env.js";
import { describeError, startupHint } from "./lib/errors.js";
import { logger } from "./lib/logger.js";

async function main() {
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
}

main().catch((err: unknown) => {
  // Plain stderr so the reason is the last thing in the host's logs.
  const message = describeError(err);
  const hint = startupHint(message);
  console.error(`\nAPI failed to start:\n  ${message}${hint ? `\n\nHint: ${hint}` : ""}\n`);
  process.exit(1);
});
