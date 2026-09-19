import type { FastifyInstance } from "fastify";

export async function closeGracefully(app: FastifyInstance): Promise<void> {
  try {
    await app.close();
  } catch (error) {
    process.stderr.write(
      `Graceful shutdown failed: ${error instanceof Error ? error.stack : String(error)}\n`,
    );
  }
}
