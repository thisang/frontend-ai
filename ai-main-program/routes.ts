import type { FastifyInstance } from "fastify";
import type { KnowledgeService } from "./services/knowledge.service.js";
import type { SkillLoader } from "./skills/skill-loader.js";
import type { ToolRegistry } from "./tools/registry.js";
import type { FigmaClient } from "./integrations/mcp/figma.client.js";
import type { EnterpriseLLMProvider } from "./integrations/llm/llm.provider.js";
import type { SemaCoreAdapter } from "./sema/core.js";
import { registerGenerateRoutes } from "./routes/generate.route.js";
import { registerChatRoutes } from "./routes/chat.route.js";

export type AppRouteDependencies = {
  knowledgeService: KnowledgeService;
  skillLoader: SkillLoader;
  toolRegistry: ToolRegistry;
  figmaClient: FigmaClient;
  llmProvider: EnterpriseLLMProvider;
  semaCore: SemaCoreAdapter;
};

export async function registerRoutes(
  app: FastifyInstance,
  deps: AppRouteDependencies,
): Promise<void> {
  app.get("/health", async () => ({
    ok: true,
    service: "frontend-ai",
    dependencies: Object.keys(deps),
    timestamp: new Date().toISOString(),
  }));

  app.get("/status", async () => ({
    ok: true,
    knowledgeReady: !!deps.knowledgeService,
    skillsReady: !!deps.skillLoader,
    toolsReady: !!deps.toolRegistry,
    figmaReady: !!deps.figmaClient,
    llmReady: !!deps.llmProvider,
    semaReady: !!deps.semaCore,
  }));

  app.get("/", async () => ({
    name: "frontend-ai",
    version: "1.0.0",
    status: "online",
  }));

  await registerGenerateRoutes(app, deps.knowledgeService, deps.skillLoader);
  await registerChatRoutes(app);
}
