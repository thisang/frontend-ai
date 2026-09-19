import fs from "node:fs/promises";
import path from "node:path";

export type ProjectKnowledgeDocument = {
  name: string;
  path: string;
  content: string;
};

export type ProjectKnowledge = {
  projectName: string;
  rootPath: string;
  documents: ProjectKnowledgeDocument[];
};

export class KnowledgeService {
  constructor(private readonly options: Record<string, string>) {}

  async initialize(): Promise<void> {
    const rootFolder = path.resolve(this.options.curatedPath ?? "./.data/knowledge/projects");
    await fs.mkdir(rootFolder, { recursive: true });
  }

  async listProjects(): Promise<string[]> {
    const rootFolder = path.resolve(this.options.curatedPath ?? "./.data/knowledge/projects");

    try {
      const entries = await fs.readdir(rootFolder, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
    } catch {
      return [];
    }
  }

  async loadProject(projectName: string): Promise<ProjectKnowledge | null> {
    const rootFolder = path.resolve(this.options.curatedPath ?? "./.data/knowledge/projects");
    const projectPath = path.join(rootFolder, projectName);

    try {
      const entries = await fs.readdir(projectPath, { withFileTypes: true });
      const markdownFiles = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
        .map((entry) => entry.name)
        .sort();

      const documents = await Promise.all(
        markdownFiles.map(async (fileName) => {
          const filePath = path.join(projectPath, fileName);
          const content = await fs.readFile(filePath, "utf-8");
          return {
            name: fileName,
            path: filePath,
            content,
          } satisfies ProjectKnowledgeDocument;
        }),
      );

      return {
        projectName,
        rootPath: projectPath,
        documents,
      };
    } catch {
      return null;
    }
  }

  async loadProjectContextForPrompt(projectName: string, taskType: string): Promise<string> {
    const project = await this.loadProject(projectName);
    if (!project) {
      return "";
    }

    const priorityMap: Record<string, string[]> = {
      page: ["README.md", "architecture.md", "component-conventions.md", "style-guide.md", "examples.md"],
      component: ["README.md", "component-conventions.md", "style-guide.md", "examples.md"],
      form: ["README.md", "component-conventions.md", "style-guide.md", "examples.md"],
      list: ["README.md", "architecture.md", "component-conventions.md", "examples.md"],
      default: ["README.md", "architecture.md", "component-conventions.md", "style-guide.md", "examples.md"],
    };

    const priorities = priorityMap[taskType] ?? priorityMap.default;
    const filesByName = new Map(project.documents.map((doc) => [doc.name, doc]));

    const selected = priorities
      .filter((fileName) => filesByName.has(fileName))
      .map((fileName) => filesByName.get(fileName)!)
      .concat(project.documents.filter((doc) => !priorities.includes(doc.name)));

    if (selected.length === 0) {
      return "";
    }

    return selected
      .map((doc) => `## ${doc.name}\n${doc.content.trim()}`)
      .join("\n\n");
  }
}
