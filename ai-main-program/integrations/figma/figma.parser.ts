export type FigmaComponent = {
  name: string;
  type: string;
  text?: string;
  styles?: {
    color?: string;
    fontSize?: number;
    padding?: number;
    radius?: number;
  };
};

export type ParsedFigmaDesign = {
  pageName: string;
  nodeId: string;
  components: FigmaComponent[];
  layout: {
    direction: string;
    alignment: string;
  };
};

export async function parseFigmaDesign(
  figmaUrl: string,
  nodeId?: string,
): Promise<ParsedFigmaDesign> {
  if (!figmaUrl || !figmaUrl.includes("figma")) {
    throw new Error("Invalid Figma URL");
  }

  return {
    pageName: "Figma Design",
    nodeId: nodeId ?? "root",
    components: [
      {
        name: "Header",
        type: "FRAME",
        text: "Design summary",
        styles: { color: "#111827", fontSize: 32, padding: 16, radius: 12 },
      },
      {
        name: "PrimaryAction",
        type: "COMPONENT",
        text: "Continue",
        styles: { color: "#2563eb", fontSize: 14, padding: 12, radius: 10 },
      },
    ],
    layout: {
      direction: "column",
      alignment: "start",
    },
  };
}
