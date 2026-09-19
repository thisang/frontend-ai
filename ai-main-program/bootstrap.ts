import { config } from "./config.js";
import { registerRoutes } from "./routes.js";
import { createApp } from "./app.js";
import { createDependencies } from "./dependencies.js";
import { closeGracefully } from "./shutdown.js";

export async function bootstrap(): Promise<void> {
  const app = await createApp();
  const dependencies = await createDependencies();

  await registerRoutes(app, dependencies);

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`Received ${signal}, shutting down gracefully`);
    await closeGracefully(app);
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  await app.listen({ port: config.port, host: config.host });
}
