import fs from "node:fs/promises";
import path from "node:path";
import type { FrameworkType, ProjectContext, StyleSystem } from "@frontend-ai/common";

export async function getProjectContext(workspacePath: string): Promise<ProjectContext> {
  const safeWorkspacePath = workspacePath || process.cwd();
  const packageJsonPath = path.join(safeWorkspacePath, "package.json");

  let framework: FrameworkType = "react";
  let styleSystem: StyleSystem | undefined;
  const existingPatterns: string[] = [
    "page layout",
    "component naming",
    "shared UI primitives",
  ];

  try {
    const packageJson = JSON.parse(
      await fs.readFile(packageJsonPath, "utf-8"),
    ) as {
      name?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const deps = {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {}),
    };

    if (deps.react || deps["next"]) {
      framework = "react";
    }
    if (deps.vue) {
      framework = "vue";
    }
    if (deps["@angular/core"]) {
      framework = "angular";
    }

    if (deps.tailwindcss || deps["@tailwindcss/vite"]) {
      styleSystem = "tailwind";
    } else if (deps["styled-components"]) {
      styleSystem = "styled-components";
    } else if (deps["@mui/material"]) {
      styleSystem = "mui";
    }

    existingPatterns.push(
      packageJson.name ? `project name: ${packageJson.name}` : "project name: unknown",
    );

    return {
      framework,
      styleSystem,
      packageInfo: {
        name: packageJson.name,
        dependencies: Object.keys(deps),
      },
      existingPatterns,
    };
  } catch {
    return {
      framework,
      styleSystem,
      existingPatterns,
    };
  }
}
