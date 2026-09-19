import type { ApiResponse, ChatRequest, ChatResponse } from "@frontend-ai/common";

function buildSuggestionCode(source: string, prompt: string): string {
  const trimmedSource = source.trim();
  const hasVue = /<template|<script|<style/i.test(trimmedSource);
  const safeSource = trimmedSource || "const count = 0;\n\nexport default {\n  setup() {\n    return { count };\n  },\n};\n";

  if (hasVue) {
    return `
<script setup lang="ts">
const props = defineProps<{\n  title?: string;\n  subtitle?: string;\n}>();

const suggestionText = ${JSON.stringify(prompt)};
</script>

<template>
  <section class="optimized-card">
    <h2>{{ props.title || '优化建议' }}</h2>
    <p>{{ suggestionText }}</p>
    <div class="meta-row">
      <span>已根据当前代码进行重构</span>
      <span>保持 Vue 3 + TS 语法</span>
    </div>
  </section>
</template>

<style scoped>
.optimized-card {
  padding: 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%);
  color: #1f2937;
  border: 1px solid #dbeafe;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  font-size: 12px;
  color: #475569;
}
</style>
`.trim();
  }

  return `
const optimizeValue = () => {
  const input = ${JSON.stringify(safeSource)};

  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
};

export function optimizeCode() {
  return optimizeValue();
}
`.trim();
}

export async function handleChatRequest(
  body: ChatRequest,
  reply: { code: (status: number) => { code: (status: number) => unknown } },
): Promise<ApiResponse<ChatResponse>> {
  if (!body.message) {
    reply.code(400);
    return {
      status: "error",
      message: "message is required",
      data: null,
      error: { code: "VALIDATION_ERROR", details: "Missing message" },
    } satisfies ApiResponse<null>;
  }

  const currentFileContent = body.context?.currentFileContent ?? "";
  const selectedText = body.context?.selectedText ?? "";
  const sourceForSuggestion = selectedText || currentFileContent;
  const suggestionCode = buildSuggestionCode(sourceForSuggestion, body.message);

  const response: ChatResponse = {
    reply: `已收到任务：${body.message}。我已参考当前代码${sourceForSuggestion ? "与选中内容" : ""}，给出一版可直接应用的优化建议。`,
    suggestedAction: "generate-code",
    followUpQuestions: [
      "是否要直接将这版建议写回当前文件？",
      "是否需要继续收敛成更贴合当前项目的写法？",
    ],
    suggestedCode: suggestionCode,
    targetPath: body.context?.currentFile ?? undefined,
  };

  return {
    status: "success",
    message: "assistant reply",
    data: response,
    error: null,
  } satisfies ApiResponse<ChatResponse>;
}
