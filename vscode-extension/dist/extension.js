"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const node_path_1 = require("node:path");
const API_BASE_URL = "http://localhost:3000";
class FrontendAiViewProvider {
    context;
    constructor(context) {
        this.context = context;
    }
    resolveWebviewView(webviewView) {
        const scriptUri = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "dist-webview", "index.js"));
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "dist-webview")],
        };
        webviewView.webview.html = `
      <!doctype html>
      <html lang="zh-CN">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta
            http-equiv="Content-Security-Policy"
            content="default-src 'none'; style-src 'unsafe-inline'; img-src ${webviewView.webview.cspSource} data:; script-src ${webviewView.webview.cspSource}; connect-src http://localhost:3000;"
          />
        </head>
        <body>
          <div id="app"></div>
          <script type="module" src="${scriptUri}"></script>
        </body>
      </html>
    `;
        webviewView.webview.postMessage({
            type: "init",
            workspacePath: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "",
            currentFile: vscode.window.activeTextEditor?.document.uri.fsPath ?? "",
        });
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.type === "apply-generated-code") {
                const content = String(message.content ?? "");
                const requestedPath = String(message.path ?? "").trim();
                try {
                    const activeUri = vscode.window.activeTextEditor?.document.uri;
                    const activePath = activeUri?.fsPath ?? "";
                    const activeIsVue = activePath.toLowerCase().endsWith(".vue");
                    let targetUri;
                    if (requestedPath) {
                        targetUri = vscode.Uri.file(requestedPath);
                    }
                    else if (activeIsVue && activeUri) {
                        targetUri = activeUri;
                    }
                    else {
                        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
                        const candidate = vscode.Uri.joinPath(workspaceRoot, "GeneratedComponent.vue");
                        targetUri = candidate;
                    }
                    if (targetUri.fsPath) {
                        const folder = vscode.Uri.file((0, node_path_1.dirname)(targetUri.fsPath));
                        await vscode.workspace.fs.createDirectory(folder);
                    }
                    const uint8 = new TextEncoder().encode(content);
                    await vscode.workspace.fs.writeFile(targetUri, uint8);
                    const doc = await vscode.workspace.openTextDocument(targetUri);
                    await vscode.window.showTextDocument(doc, { preview: false, viewColumn: vscode.ViewColumn.One });
                }
                catch (error) {
                    vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error));
                }
                return;
            }
            if (message.type !== "chat") {
                return;
            }
            const prompt = String(message.prompt ?? "").trim();
            const workspacePath = String(message.workspacePath ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "").trim();
            const currentFile = String(message.currentFile ?? vscode.window.activeTextEditor?.document.uri.fsPath ?? "").trim();
            const editor = vscode.window.activeTextEditor;
            const currentFileContent = editor?.document.getText() ?? "";
            const selectedText = editor && !editor.selection.isEmpty ? editor.document.getText(editor.selection) : "";
            if (!prompt) {
                return;
            }
            try {
                const chatResponse = await callJson("/api/chat", {
                    message: prompt,
                    context: {
                        workspacePath,
                        currentFile,
                        currentFileContent,
                        selectedText,
                    },
                });
                const assistantReply = chatResponse?.data?.reply ?? "已收到你的需求。";
                webviewView.webview.postMessage({ type: "assistant", text: assistantReply });
                const suggestionCode = chatResponse?.data?.suggestedCode?.trim();
                if (suggestionCode) {
                    webviewView.webview.postMessage({
                        type: "suggestion",
                        code: suggestionCode,
                        path: chatResponse?.data?.targetPath ?? currentFile ?? undefined,
                    });
                    return;
                }
                if (chatResponse?.data?.suggestedAction === "generate-code") {
                    const projectContext = buildProjectContext();
                    const req = {
                        userPrompt: prompt,
                        workspacePath,
                        currentFile,
                        projectContext,
                    };
                    const generated = await callJson("/api/generate", req);
                    const file = generated?.data?.files?.[0];
                    const code = file?.content ?? generated?.data?.summary ?? "未生成代码内容。";
                    webviewView.webview.postMessage({
                        type: "assistant",
                        text: [generated?.data?.summary ?? "已生成代码。", "\n\n" + code].join(""),
                    });
                }
            }
            catch (error) {
                webviewView.webview.postMessage({
                    type: "error",
                    text: error instanceof Error ? error.message : String(error),
                });
            }
        });
    }
}
function buildProjectContext() {
    return {
        framework: "vue",
        styleSystem: "tailwind",
        packageInfo: {
            name: "frontend-ai",
            dependencies: ["vue", "typescript", "tailwindcss"],
        },
        existingPatterns: ["vue 3 component structure", "script setup", "composition api"],
    };
}
async function callJson(path, body) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Request failed (${response.status}): ${text || response.statusText}`);
    }
    return (await response.json());
}
function activate(context) {
    const provider = new FrontendAiViewProvider(context);
    const disposable = vscode.commands.registerCommand("frontend-ai.openChat", async () => {
        await vscode.commands.executeCommand("workbench.view.extension.frontend-ai");
    });
    context.subscriptions.push(disposable, vscode.window.registerWebviewViewProvider("frontend-ai.sidebar", provider));
}
function deactivate() { }
