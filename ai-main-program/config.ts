export const config = {
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? "0.0.0.0",
  knowledgeCuratedPath: process.env.KNOWLEDGE_CURATED_PATH ?? "./.data/knowledge/projects",
  knowledgeGeneratedPath: process.env.KNOWLEDGE_GENERATED_PATH ?? "./.data/knowledge/generated",
  knowledgeManifestsPath: process.env.KNOWLEDGE_MANIFESTS_PATH ?? "./.data/knowledge/manifests",
  skillsPath: process.env.SKILLS_PATH ?? "./.data/skills",
  figmaMcpCommand: process.env.FIGMA_MCP_COMMAND ?? "",
  figmaMcpArgs: (process.env.FIGMA_MCP_ARGS ?? "").split(" ").filter(Boolean),
  figmaMcpApiKey: process.env.FIGMA_MCP_API_KEY ?? "",
  figmaCachePath: process.env.FIGMA_CACHE_PATH ?? "./.data/figma-cache",
};
