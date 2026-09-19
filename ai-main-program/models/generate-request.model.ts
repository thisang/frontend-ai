export type GenerateRequest = {
  userPrompt: string;
  figmaUrl?: string;
  workspacePath?: string;
  currentFile?: string;
  selectedText?: string;
  projectContext?: {
    framework: string;
    styleSystem?: string;
    packageInfo?: {
      name?: string;
      dependencies?: string[];
    };
    existingPatterns?: string[];
  };
  outputTarget?: {
    path?: string;
    mode?: string;
  };
};
