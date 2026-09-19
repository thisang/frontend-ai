import type { GenerateRequest, GeneratedFile, ProjectContext } from "@frontend-ai/common";
import { parseFigmaDesign } from "../integrations/figma/figma.parser.js";
import type { SkillLoader } from "../skills/skill-loader.js";
import { getProjectContext } from "./project-context.service.js";
import type { KnowledgeService } from "./knowledge.service.js";

export type GenerationResult = {
  summary: string;
  files: GeneratedFile[];
  warnings: string[];
  nextSuggestions: string[];
};

export async function generateCodeForRequest(
  body: GenerateRequest,
  knowledgeService?: KnowledgeService,
  skillLoader?: SkillLoader,
): Promise<GenerationResult> {
  const workspacePath = body.workspacePath ?? process.cwd();
  const projectContext: ProjectContext =
    body.projectContext ?? (await getProjectContext(workspacePath));
  const figmaSummary = body.figmaUrl ? await parseFigmaDesign(body.figmaUrl) : null;
  const generatedFilePath =
    body.outputTarget?.path ?? `${workspacePath}/generated/GeneratedComponent.vue`;

  const projectName = body.workspacePath
    ? body.workspacePath.split(/[\\/]/).filter(Boolean).at(-1) ?? "admin-console-demo"
    : "admin-console-demo";

  const knowledgeContext = knowledgeService
    ? await knowledgeService.loadProjectContextForPrompt(projectName, "page")
    : "";

  const skillContext = skillLoader
    ? skillLoader
        .listSkills()
        .map((name) => skillLoader.getSkill(name))
        .filter((skill): skill is NonNullable<typeof skill> => !!skill)
        .map((skill) => `## Skill: ${skill.name}\n${skill.content.trim()}`)
        .join("\n\n")
    : "";

  const contextSummary = [knowledgeContext, skillContext].filter(Boolean).join("\n\n");

  const generatedContent = `<!-- Generated from prompt: ${body.userPrompt} -->

<script setup lang="ts">
    interface Props {
        title?: string;
        subtitle?: string;
    }

    const props = withDefaults(defineProps<Props>(), {
        title: "${figmaSummary?.pageName ?? "Generated Page"}",
        subtitle: "Generated from Figma + project context",
    });
</script>

<template>
    <section class="generated-shell">
        <header class="topbar">
            <span class="eyebrow">${projectContext.framework.toUpperCase()}</span>
            <h1>{{ props.title }}</h1>
        </header>

        <p class="subtitle">{{ props.subtitle }}</p>

        <div class="card-grid">
            <div class="info-card">
                <span class="label">Framework</span>
                <strong>${projectContext.framework}</strong>
            </div>
            <div class="info-card">
                <span class="label">Style</span>
                <strong>${projectContext.styleSystem ?? "default"}</strong>
            </div>
            <div class="info-card">
                <span class="label">Project</span>
                <strong>${projectName}</strong>
            </div>
        </div>

        ${figmaSummary ? `<p class="design-note">Design summary: ${figmaSummary.pageName}</p>` : ""}
    </section>
</template>

<style scoped>
    .generated-shell {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 24px;
        border-radius: 16px;
        background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
        color: #0f172a;
    }

    .topbar {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .eyebrow {
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #4f46e5;
        font-weight: 700;
    }

    h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1.2;
    }

    .subtitle {
        margin: 0;
        color: #475569;
    }

    .card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
    }

    .info-card {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 16px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(148, 163, 184, 0.4);
    }

    .label {
        font-size: 12px;
        color: #64748b;
        text-transform: uppercase;
    }

    strong {
        font-size: 16px;
    }

    .design-note {
        margin: 0;
        font-size: 14px;
        color: #334155;
    }
</style>
`;

  return {
    summary: `已根据设计稿和项目风格生成 ${projectContext.framework} 组件代码，使用 ${projectContext.styleSystem ?? "default style"}。${contextSummary ? "已参考项目知识库与技能约定。" : ""}`,
    files: [
      {
        path: generatedFilePath,
        content: generatedContent,
        diff: "+ <template> ... </template>",
        status: "generated",
      },
    ],
    warnings: figmaSummary ? [] : ["未提供 Figma 链接，使用项目上下文生成保守实现。"],
    nextSuggestions: [
      "是否继续改成更贴近当前组件库的写法？",
      "是否生成对应的样式文件或子组件？",
    ],
  };
}
