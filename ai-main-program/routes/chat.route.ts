import type { FastifyInstance } from "fastify";
import type { ChatRequest } from "@frontend-ai/common";
import { handleChatRequest } from "../controllers/chat.controller.js";

export async function registerChatRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/chat", async (request, reply) => {
    const body = request.body as Partial<ChatRequest> | undefined;
    return handleChatRequest(
      {
        message: body?.message ?? "",
        sessionId: body?.sessionId,
        context: {
          workspacePath: body?.context?.workspacePath,
          currentFile: body?.context?.currentFile,
          currentFileContent: body?.context?.currentFileContent,
          selectedText: body?.context?.selectedText,
        },
      },
      reply,
    );
  });
}
