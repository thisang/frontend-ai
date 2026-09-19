import type { FastifyInstance } from "fastify";
import { handleGenerateRequest } from "../controllers/generate.controller.js";
import type { KnowledgeService } from "../services/knowledge.service.js";
import type { SkillLoader } from "../skills/skill-loader.js";

export async function registerGenerateRoutes(
  app: FastifyInstance,
  knowledgeService?: KnowledgeService,
  skillLoader?: SkillLoader,
): Promise<void> {
  app.post("/api/generate", async (request, reply) => {
    const body = request.body as {
      userPrompt?: string;
      figmaUrl?: string;
      workspacePath?: string;
      currentFile?: string;
      selectedText?: string;
      projectContext?: unknown;
      outputTarget?: { path?: string; mode?: string };
    };

    if (!body.userPrompt) {
      reply.code(400);
      return {
        status: "error",
        message: "userPrompt is required",
        data: null,
        error: { code: "VALIDATION_ERROR", details: "Missing userPrompt" },
      };
    }

    return handleGenerateRequest(body as any, reply, knowledgeService, skillLoader);
  });

  app.post("/api/figma/parse", async (request, reply) => {
    const body = request.body as { figmaUrl?: string; nodeId?: string };

    if (!body.figmaUrl) {
      reply.code(400);
      return {
        status: "error",
        message: "figmaUrl is required",
        data: null,
        error: { code: "VALIDATION_ERROR", details: "Missing figmaUrl" },
      };
    }

    try {
      const { parseFigmaDesign } = await import("../integrations/figma/figma.parser.js");
      const parsed = await parseFigmaDesign(body.figmaUrl, body.nodeId);
      return {
        status: "success",
        message: "figma parsed",
        data: parsed,
        error: null,
      };
    } catch (error) {
      reply.code(400);
      return {
        status: "error",
        message: "failed to parse figma design",
        data: null,
        error: {
          code: "FIGMA_PARSE_FAILED",
          details: error instanceof Error ? error.message : String(error),
        },
      };
    }
  });
}
