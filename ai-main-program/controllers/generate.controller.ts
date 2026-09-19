import type { ApiResponse, GenerateRequest } from "@frontend-ai/common";
import { generateCodeForRequest } from "../services/generation.service.js";
import type { KnowledgeService } from "../services/knowledge.service.js";
import type { SkillLoader } from "../skills/skill-loader.js";

export async function handleGenerateRequest(
  body: GenerateRequest,
  reply: { code: (status: number) => { code: (status: number) => unknown } },
  knowledgeService?: KnowledgeService,
  skillLoader?: SkillLoader,
): Promise<ApiResponse<Awaited<ReturnType<typeof generateCodeForRequest>>>> {
  try {
    const data = await generateCodeForRequest(body, knowledgeService, skillLoader);
    return {
      status: "success",
      message: "code generated",
      data,
      error: null,
    } satisfies ApiResponse<typeof data>;
  } catch (error) {
    reply.code(500);
    return {
      status: "error",
      message: "failed to generate code",
      data: null,
      error: {
        code: "GENERATION_FAILED",
        details: error instanceof Error ? error.message : String(error),
      },
    } satisfies ApiResponse<null>;
  }
}
