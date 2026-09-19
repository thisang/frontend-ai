export type GeneratedFile = {
  path: string;
  content: string;
  diff?: string;
  status?: "generated" | "updated" | "skipped";
};
