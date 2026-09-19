export type FrameworkType = "react" | "vue" | "nextjs" | "angular";
export type StyleSystem = "tailwind" | "mui" | "styled-components" | "default";

export type ProjectContext = {
  framework: FrameworkType;
  styleSystem?: StyleSystem;
  packageInfo?: {
    name?: string;
    dependencies?: string[];
  };
  existingPatterns?: string[];
};

export type ChatSuggestionAction = "generate-code" | "collect-more-context";

export type ChatRequest = {
  message: string;
  sessionId?: string;
  context?: {
    workspacePath?: string;
    currentFile?: string;
    currentFileContent?: string;
    selectedText?: string;
  };
};

export type ChatResponse = {
  reply: string;
  suggestedAction?: ChatSuggestionAction;
  followUpQuestions?: string[];
  suggestedCode?: string;
  targetPath?: string;
};

export type FigmaParseRequest = {
  figmaUrl: string;
  nodeId?: string;
  includeStyles?: boolean;
  includeLayout?: boolean;
  includeText?: boolean;
};

export type GenerateRequest = {
  userPrompt: string;
  figmaUrl?: string;
  workspacePath?: string;
  currentFile?: string;
  selectedText?: string;
  projectContext?: ProjectContext;
  outputTarget?: {
    path?: string;
    mode?: "create" | "create-or-update" | "update";
  };
};

export type GeneratedFile = {
  path: string;
  content: string;
  diff: string;
  status: "generated";
};

export type GeneratedCodeApplyMessage = {
  type: "apply-generated-code";
  content: string;
  path?: string;
};

export type ApiResponse<T> = {
  status: "success" | "error";
  message: string;
  data: T | null;
  error: null | {
    code: string;
    details: string;
  };
};
