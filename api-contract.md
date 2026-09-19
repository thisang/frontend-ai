# API 契约草案：Figma-to-Code AI MVP

## 1. 目标

定义 VS Code 插件与 AI Main Program 之间的最小交互协议，支持：

- 用户在 VS Code 聊天窗口中输入自然语言需求
- 需求中可能附带 Figma 设计稿链接
- AI 主程序结合项目上下文与设计稿结构生成代码
- 插件将代码写回当前工作区

## 2. 基础约定

### 协议

- HTTP JSON API
- 统一使用 JSON body
- 响应统一结构
- 允许后续升级为流式输出

### 统一响应结构

```json
{
  "status": "success",
  "message": "string",
  "data": {},
  "error": null
}
```

## 3. 健康检查接口

### GET /health

响应：

```json
{
  "status": "success",
  "message": "ok",
  "data": {
    "service": "ai-main-program",
    "uptimeSeconds": 123,
    "version": "1.0.0"
  },
  "error": null
}
```

## 4. 生成代码接口

### POST /api/generate

#### 请求体

```json
{
  "userPrompt": "请实现这个设计稿的登录页，并保持当前项目风格",
  "figmaUrl": "https://www.figma.com/file/xxx",
  "workspacePath": "/workspace/my-project",
  "currentFile": "/workspace/my-project/src/pages/Login.tsx",
  "selectedText": "",
  "projectContext": {
    "framework": "react",
    "styleSystem": "tailwind",
    "packageInfo": {
      "name": "my-app",
      "dependencies": ["react", "tailwindcss"]
    },
    "existingPatterns": [
      "page layout",
      "component naming",
      "api hooks"
    ]
  },
  "outputTarget": {
    "path": "/workspace/my-project/src/pages/LoginPage.tsx",
    "mode": "create-or-update"
  }
}
```

#### 成功响应

```json
{
  "status": "success",
  "message": "code generated",
  "data": {
    "summary": "已根据 Figma 设计稿生成登录页组件，使用现有 project style 实现。",
    "files": [
      {
        "path": "/workspace/my-project/src/pages/LoginPage.tsx",
        "content": "export default function LoginPage() { return <div />; }",
        "diff": "+ import ...",
        "status": "generated"
      }
    ],
    "warnings": [
      "未检测到设计稿中的第三个输入框状态"
    ],
    "nextSuggestions": [
      "是否继续改成更接近现有组件库的写法？",
      "是否生成对应的样式文件？"
    ]
  },
  "error": null
}
```

#### 失败响应

```json
{
  "status": "error",
  "message": "failed to generate code",
  "data": null,
  "error": {
    "code": "FIGMA_PARSE_FAILED",
    "details": "Unable to access Figma design file"
  }
}
```

## 5. Figma 解析接口

### POST /api/figma/parse

#### 请求体

```json
{
  "figmaUrl": "https://www.figma.com/file/xxx",
  "nodeId": "1:5",
  "includeStyles": true,
  "includeLayout": true,
  "includeText": true
}
```

#### 响应

```json
{
  "status": "success",
  "message": "figma parsed",
  "data": {
    "pageName": "Login Page",
    "nodeId": "1:5",
    "components": [
      {
        "name": "Header",
        "type": "FRAME",
        "text": "Welcome back",
        "styles": {
          "color": "#111827",
          "fontSize": 32,
          "padding": 16,
          "radius": 12
        }
      }
    ],
    "layout": {
      "direction": "column",
      "alignment": "center"
    }
  },
  "error": null
}
```

## 6. 聊天接口（可选，但建议提前做）

### POST /api/chat

#### 请求体

```json
{
  "message": "请把这个页面改成更像当前项目的风格",
  "sessionId": "session-123",
  "context": {
    "workspacePath": "/workspace/my-project",
    "currentFile": "/workspace/my-project/src/pages/LoginPage.tsx"
  }
}
```

#### 响应

```json
{
  "status": "success",
  "message": "assistant reply",
  "data": {
    "reply": "我先检查当前项目的组件风格和现有布局，再给出适配后的代码方案。",
    "suggestedAction": "generate-code"
  },
  "error": null
}
```

## 7. 插件端交互协议

### 插件发送

- 发送消息时携带：
  - message
  - workspacePath
  - currentFile
  - selectedText
  - figmaUrl（可选）
  - projectMetadata（自动采集）

### 插件接收

- 返回结构：
  - 生成代码
  - summary
  - warnings
  - next suggestions

### 插件动作

- Accept: 写入到工作区
- Reject: 放弃此次生成
- Continue: 再次请求修正

## 8. 最小交互流程

```text
VS Code Plugin
  -> 用户输入 "请实现这个设计稿的：figmaUrl"
  -> 收集 workspace + current file + framework details
  -> POST /api/generate

AI Main Program
  -> 读取 project context
  -> 调用 Figma MCP
  -> 解析设计结构
  -> 组织 prompt
  -> LLM 生成代码
  -> 返回代码与 diff

VS Code Plugin
  -> 展示生成结果
  -> 用户确认
  -> 写回工作区
```

## 9. 重点约束

### 生成代码应遵循

- 当前 project framework
- 当前 style system
- 当前 naming conventions
- 当前 directory structure
- minimal output scope

### 不应发生

- 全量重写整个项目
- 无提示地直接覆盖关键文件
- 不经过 diff 预览直接落盘

## 10. 下一步实现事项

1. 定义 TypeScript type：GenerateRequest / GenerateResponse
2. 实现 Fastify 路由：/api/generate 和 /api/figma/parse
3. 实现 Figma adapter placeholder
4. 实现 project context scanner
5. 实现 codegen response schema
6. 在 VS Code 插件中调用这些 API
7. 在插件中实现写回到 workspace 的逻辑

## 11. 总结

这份契约覆盖了 MVP 的最关键闭环：

- 聊天输入
- 设计稿解析
- 项目上下文读取
- 代码生成
- 结果落盘

这是整个产品最核心的实现路径。