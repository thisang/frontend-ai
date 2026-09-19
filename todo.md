# MVP 实施规划：Figma-to-Code AI VS Code 插件

## 目标

打造一个以 VS Code 插件为入口、AI 主程序为核心能力的最小可行产品：

- 用户在 VS Code 扩展里的 AI 对话窗口中输入自然语言需求
- 需求中包含 Figma 设计稿链接或设计稿信息
- AI 主程序读取 Figma 设计稿数据，并结合当前项目上下文
- 生成符合当前技术栈和代码风格的组件/页面代码
- 将代码写回当前工作区，并支持后续多轮调整

## 产品定位

- AI Main Program：核心智能服务
- VS Code 插件：用户交互入口，聊天 + 代码写回
- Desktop App：后续扩展为管理端/插件分发入口
- Chrome 插件：后续扩展为浏览器侧辅助能力

## MVP 范围

### 必做

1. AI Main Program 能启动并暴露基础 API
2. VS Code 插件能够打开 AI 对话窗口
3. 用户可以发送消息，例如：
   - “请实现这个设计稿的：https://figma.com/xxx”
   - “把这个登录页按当前项目风格实现出来”
4. AI 主程序能访问 Figma MCP，并提取设计稿结构
5. AI 主程序能读取当前项目上下文
6. AI 主程序能根据项目技术栈和代码风格生成组件代码
7. 代码能写回当前工作区
8. 生成结果支持用户继续追问并调整

### 不在 MVP 中

- 完整浏览器插件功能
- 多项目统一管理
- 全自动跨项目重构
- 完整桌面端功能
- 强制多轮复杂自动执行任务

## 架构设计

### 1. AI Main Program

职责：
- 接收插件发来的聊天任务和上下文
- 调用 Figma MCP
- 读取项目结构与代码风格
- 发起 LLM 编排
- 生成或调优代码
- 返回结果给插件

核心模块：
- app.ts
- bootstrap.ts
- config.ts
- routes.ts
- dependencies.ts
- shutdown.ts
- knowledge/
- skills/
- tools/
- llm/
- mcp/
- sema/

### 2. VS Code 插件

职责：
- 提供 AI 对话窗口
- 发送用户消息与上下文
- 展示生成结果
- 写入代码到工作区
- 发起继续修改请求

核心能力：
- 获取 workspace 目录
- 获取当前打开文件
- 获取当前选中目录/代码片段
- 发送请求到 AI Main Program
- 将返回的代码写回文件
- 预览 diff

### 3. Figma MCP

职责：
- 读取 Figma 设计稿节点信息
- 提取结构、样式和布局信息
- 返回组件信息、颜色、文字、spacing、尺寸等

重点：
- 不要只拿截图
- 要拿结构化设计数据

## 功能拆分

### Phase 1：基础对话 + Figma 读取

目标：
- 用户可以在插件里输入设计稿链接
- AI 能调取 Figma 数据
- 返回基本实现建议或代码草稿

任务：
- [ ] 完成 AI Main Program 的基础启动流程
- [ ] 补齐 config 和运行环境配置
- [ ] 完成 Fastify API 入口
- [ ] 完成 Figma MCP 接口适配
- [ ] 完成最小状态检查接口（/health, /status）
- [ ] 完成插件端任务发送接口调用

### Phase 2：项目上下文适配

目标：
- 让 AI 生成的代码符合当前项目风格

任务：
- [ ] 项目结构扫描器
- [ ] 代码风格识别（React / Next / Tailwind / CSS Module / MUI 等）
- [ ] 组件命名规范识别
- [ ] 当前工作区样式约定抽取
- [ ] 生成前先读取项目上下文并注入 prompt

### Phase 3：代码生成与落盘

目标：
- 生成代码并写回 VS Code 工作区

任务：
- [ ] 定义代码生成 schema
- [ ] 生成单文件组件代码
- [ ] 生成多文件页面代码
- [ ] 文件写回逻辑
- [ ] diff 预览和接受/拒绝机制
- [ ] 失败重试与安全检查

### Phase 4：多轮交互优化

目标：
- 让用户能继续修改结果而不是一次生成完

任务：
- [ ] 继续追问修正能力
- [ ] 局部代码调整
- [ ] 更改样式细节
- [ ] 组件抽离与重构
- [ ] 代码审查反馈

## 最关键的技术点

### 1. Figma 数据结构化处理

需要明确：
- 设计稿页面节点树
- 组件名称
- 文字内容
- 颜色 token
- 边距与圆角
- 布局规则
- 层级关系

目标：
- 将 Figma 内容转换为 AI 可理解的设计描述

### 2. 项目上下文理解

需要读取：
- package.json
- 技术栈
- 当前目录结构
- 组件库
- 样式方案
- 命名规则

目标：
- 生成和项目一致的代码

### 3. 代码生成接口设计

建议使用统一输入输出结构：

```ts
interface CodeGenerationRequest {
  userPrompt: string;
  figmaUrl?: string;
  workspacePath: string;
  currentFile?: string;
  selectedText?: string;
  projectContext?: {
    framework: string;
    styleSystem?: string;
    componentPatterns?: string[];
  };
}
```

```ts
interface CodeGenerationResponse {
  status: "success" | "error";
  files: Array<{
    path: string;
    content: string;
  }>;
  summary: string;
  warnings?: string[];
}
```

## 接口设计建议

### AI Main Program API

- POST /api/chat
- POST /api/figma/parse
- POST /api/generate/code
- GET /health
- GET /status

### VS Code 插件调用方式

- 插件内部调用远程 AI Main Program HTTP API
- 通过 WebSocket 也可以支持实时流式输出

推荐：
- 先用 HTTP API
- 后续再做流式输出

## MVP 用户示例

### 示例 1：生成登录页

用户输入：

> 请实现这个设计稿的：https://figma.com/xxx

系统行为：
- 获取设计稿内容
- 识别登录页结构
- 读取项目中已有登录组件风格
- 生成登录页代码
- 写入到当前工作区

### 示例 2：继续优化

用户输入：

> 把这个页面改成更像我们当前项目的风格，颜色更偏品牌蓝

系统行为：
- 读取前一次生成结果
- 读取现有项目风格
- 生成修正代码
- 替换对应文件内容

## 风险与注意事项

### 1. 代码生成稳定性

AI 生成代码可能不总是正确，建议：
- 先生成单文件/单组件
- 减少一次性全模块重构
- 强调 diff 预览

### 2. Figma 解析复杂度

Figma API 可能需要分页和节点遍历，建议：
- 先支持单页面节点解析
- 再扩展多层组件树

### 3. 项目风格适配

需要重要策略：
- 读取现有代码模式
- 优先使用现有组件和样式库
- 不强行引入不兼容库

## 推荐的实施顺序

1. 完成 AI Main Program 基础启动和 HTTP API
2. 完成 Figma MCP 适配
3. 完成项目上下文读取
4. 完成最小代码生成接口
5. 完成 VS Code 插件聊天窗口
6. 完成代码写回工作区
7. 完成多轮修正和 diff 预览
8. 后续扩展 Desktop App 与 Chrome 插件

## 成功标准

MVP 成功的标志：

- 用户在 VS Code 中输入 Figma 链接后，系统能生成可接受代码
- 代码能落到当前项目中
- 生成代码体现了当前项目风格
- 用户可以继续对话进行微调

## 结论

这个 MVP 是“Figma-to-Code AI 编码助手”，它具有明确的产品价值、清晰的落地路径，并且符合开发者工作流。它是整个平台最值得优先做的核心能力。

优先级：

1. AI Main Program
2. Figma MCP
3. VS Code 插件聊天入口
4. 代码生成与落盘
5. 项目风格适配
6. 后续桌面端和 Chrome 插件扩展
