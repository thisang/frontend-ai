import { config } from "./config.js";
import { KnowledgeService } from "./services/knowledge.service.js";
import { SkillLoader } from "./skills/skill-loader.js";
import { ToolRegistry } from "./tools/registry.js";
import { FigmaClient } from "./integrations/mcp/figma.client.js";
import { registerBuiltinTools } from "./tools/builtin.js";
import { EnterpriseLLMProvider } from "./integrations/llm/llm.provider.js";
import { SemaCoreAdapter } from "./sema/core.js";

export type AppDependencies = {
  knowledgeService: KnowledgeService;
  skillLoader: SkillLoader;
  toolRegistry: ToolRegistry;
  figmaClient: FigmaClient;
  llmProvider: EnterpriseLLMProvider;
  semaCore: SemaCoreAdapter;
};

export async function createDependencies(): Promise<AppDependencies> {
  const knowledgeService = new KnowledgeService({
    curatedPath: config.knowledgeCuratedPath,
    generatedPath: config.knowledgeGeneratedPath,
    manifestsPath: config.knowledgeManifestsPath,
  });
  await knowledgeService.initialize();

  const skillLoader = new SkillLoader(config.skillsPath);
  await skillLoader.loadAll();

  const toolRegistry = new ToolRegistry();
  const figmaClient = new FigmaClient({
    command: config.figmaMcpCommand,
    args: config.figmaMcpArgs,
    apiKey: config.figmaMcpApiKey,
    cachePath: config.figmaCachePath,
  });
  registerBuiltinTools(toolRegistry, figmaClient);

  const llmProvider = new EnterpriseLLMProvider();
  const semaCore = new SemaCoreAdapter();
  await semaCore.initialize();

  return {
    knowledgeService,
    skillLoader,
    toolRegistry,
    figmaClient,
    llmProvider,
    semaCore,
  };
}
