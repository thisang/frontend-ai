export class ToolRegistry {
  private readonly tools = new Map<string, unknown>();

  register(name: string, handler: unknown): void {
    this.tools.set(name, handler);
  }

  get(name: string): unknown {
    return this.tools.get(name);
  }

  list(): string[] {
    return [...this.tools.keys()].sort();
  }
}
