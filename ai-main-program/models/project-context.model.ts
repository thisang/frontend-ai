export type ProjectContext = {
  framework: string;
  styleSystem?: string;
  packageInfo?: {
    name?: string;
    dependencies?: string[];
  };
  existingPatterns: string[];
};
