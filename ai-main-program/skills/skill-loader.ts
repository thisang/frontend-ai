import fs from "node:fs/promises";
import path from "node:path";

export type SkillDefinition = {
  name: string;
  path: string;
  kind: "markdown" | "json";
  content: string;
};

export class SkillLoader {
  private readonly skills = new Map<string, SkillDefinition>();

  constructor(private readonly rootPath: string) {}

  getSkill(name: string): SkillDefinition | undefined {
    return this.skills.get(name);
  }

  listSkills(): string[] {
    return [...this.skills.keys()].sort();
  }

  async loadAll(): Promise<SkillDefinition[]> {
    const resolvedRoot = path.resolve(this.rootPath);
    await fs.mkdir(resolvedRoot, { recursive: true });

    const entries = await fs.readdir(resolvedRoot, { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile())
      .filter((entry) => /\.(md|json)$/i.test(entry.name))
      .map((entry) => entry.name)
      .sort();

    this.skills.clear();

    for (const fileName of files) {
      const fullPath = path.join(resolvedRoot, fileName);
      const content = await fs.readFile(fullPath, "utf-8");
      const name = fileName.replace(/\.(md|json)$/i, "");
      const kind = fileName.toLowerCase().endsWith(".json") ? "json" : "markdown";
      const definition: SkillDefinition = { name, path: fullPath, kind, content };
      this.skills.set(name, definition);
    }

    return [...this.skills.values()];
  }
}
