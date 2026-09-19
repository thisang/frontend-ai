import type { ToolRegistry } from "./registry.js";
import type { FigmaClient } from "../integrations/mcp/figma.client.js";

export function registerBuiltinTools(
  registry: ToolRegistry,
  figmaClient: FigmaClient,
): void {
  registry.register("figma", figmaClient);
}
