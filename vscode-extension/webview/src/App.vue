<script setup lang="ts">
import { computed, ref } from "vue";

type MessageRole = "user" | "assistant";

type MessageItem = {
    role: MessageRole;
    text: string;
};

const API_BASE_URL = "http://localhost:3000";

const prompt = ref("");
const workspacePath = ref("");
const currentFile = ref("");
const messages = ref<MessageItem[]>([
    {
        role: "assistant",
        text: "你好，我是 Frontend AI。告诉我你要实现哪个页面或组件，我会按 Vue 3 + TypeScript 生成代码。",
    },
]);
const sending = ref(false);
const status = ref("等待输入");
const generatedCode = ref("");
const generatedPath = ref("");

const canSubmit = computed(() => !sending.value && prompt.value.trim().length > 0);
const canApplyCode = computed(() => generatedCode.value.trim().length > 0);

const defaultTargetPath = computed(() => {
    if (!workspacePath.value) {
        return "";
    }

    if (currentFile.value && currentFile.value.toLowerCase().endsWith(".vue")) {
        return currentFile.value;
    }

    return `${workspacePath.value}/src/components/GeneratedComponent.vue`;
});

async function requestJson<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Request failed (${response.status}): ${text || response.statusText}`);
    }

    return (await response.json()) as T;
}

function appendMessage(role: MessageRole, text: string): void {
    messages.value.push({ role, text });
}

async function submit(): Promise<void> {
    const value = prompt.value.trim();
    if (!value || sending.value) {
        return;
    }

    appendMessage("user", value);
    prompt.value = "";
    sending.value = true;
    status.value = "请求中...";

    try {
        const chatResponse = await requestJson<{
            status: string;
            data?: {
                reply?: string;
                suggestedAction?: string;
                suggestedCode?: string;
                targetPath?: string;
            };
        }>("/api/chat", {
            message: value,
            context: {
                workspacePath: workspacePath.value,
                currentFile: currentFile.value,
                currentFileContent: "",
                selectedText: "",
            },
        });

        const reply = chatResponse?.data?.reply ?? "已收到你的需求。";
        appendMessage("assistant", reply);
        status.value = "已返回结果";

        const suggestionCode = chatResponse?.data?.suggestedCode?.trim();
        if (suggestionCode) {
            generatedCode.value = suggestionCode;
            generatedPath.value = chatResponse?.data?.targetPath ?? defaultTargetPath.value;
            status.value = "建议已返回，可点击应用";
            return;
        }

        if (chatResponse?.data?.suggestedAction === "generate-code") {
            const generateResponse = await requestJson<{
                status: string;
                data?: {
                    summary?: string;
                    files?: Array<{ content?: string; path?: string }>;
                };
            }>("/api/generate", {
                userPrompt: value,
                workspacePath: workspacePath.value,
                currentFile: currentFile.value,
                projectContext: {
                    framework: "vue",
                    styleSystem: "tailwind",
                    packageInfo: {
                        name: "frontend-ai",
                        dependencies: ["vue", "typescript", "tailwindcss"],
                    },
                    existingPatterns: ["vue 3", "script setup"],
                },
            });

            const file = generateResponse?.data?.files?.[0];
            const code = file?.content ?? generateResponse?.data?.summary ?? "未生成代码内容。";
            generatedCode.value = code;
            generatedPath.value = file?.path ?? defaultTargetPath.value;
            appendMessage("assistant", `${generateResponse?.data?.summary ?? "已生成代码。"}\n\n${code}`);
            status.value = "代码已生成";
        }
    } catch (error) {
        appendMessage("assistant", `错误：${error instanceof Error ? error.message : String(error)}`);
        status.value = "请求失败";
    } finally {
        sending.value = false;
    }
}

function applyCode(): void {
    if (!generatedCode.value.trim()) {
        return;
    }

    const vscodeApi = (window as Window & { acquireVsCodeApi?: () => { postMessage: (payload: unknown) => void } }).acquireVsCodeApi?.();
    if (!vscodeApi) {
        return;
    }

    const resolvedPath = generatedPath.value || defaultTargetPath.value;
    vscodeApi.postMessage({
        type: "apply-generated-code",
        content: generatedCode.value,
        path: resolvedPath,
    });

    status.value = "已发送到编辑器";
}

function submitOnEnter(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        submit();
    }
}

window.addEventListener("message", (event) => {
    const message = event.data as {
        type?: string;
        workspacePath?: string;
        currentFile?: string;
        code?: string;
        path?: string;
    } | undefined;

    if (!message) {
        return;
    }

    if (message.type === "init") {
        workspacePath.value = message.workspacePath ?? "";
        currentFile.value = message.currentFile ?? "";
        if (!generatedPath.value) {
            generatedPath.value = defaultTargetPath.value;
        }
        return;
    }

    if (message.type === "suggestion") {
        generatedCode.value = message.code ?? "";
        generatedPath.value = message.path ?? defaultTargetPath.value;
        appendMessage("assistant", `建议代码：\n\n${generatedCode.value}`);
        status.value = "建议已返回，可点击应用";
    }
});
</script>

<template>
    <div class="app-shell">
        <header class="topbar">
            <div class="brand">
                <div class="brand-dot" />
                <span>Frontend AI</span>
            </div>
        </header>

        <main class="chat-panel">
            <div class="messages" aria-live="polite">
                <div
                    v-for="(message, index) in messages"
                    :key="`${message.role}-${index}`"
                    :class="['message', message.role]"
                >
                    {{ message.text }}
                </div>
            </div>

            <div v-if="canApplyCode" class="suggestion-box">
                <div class="suggestion-header">
                    <span>建议代码</span>
                    <button class="secondary small" @click="applyCode">应用到当前文件</button>
                </div>
                <pre>{{ generatedCode }}</pre>
            </div>

            <div class="composer">
                <label for="prompt-input" class="sr-only">输入你的需求</label>
                <textarea
                    id="prompt-input"
                    v-model="prompt"
                    placeholder="例如：帮我优化代码，顺便让它更符合当前 Vue 3 风格"
                    @keydown="submitOnEnter"
                />
                <div class="toolbar">
                    <button :disabled="!canSubmit" @click="submit">
                        {{ sending ? "生成中..." : "发送" }}
                    </button>
                    <button v-if="canApplyCode" class="secondary" @click="applyCode">
                        写入当前文件
                    </button>
                    <span class="status">{{ status }}</span>
                </div>
            </div>
        </main>
    </div>
</template>
