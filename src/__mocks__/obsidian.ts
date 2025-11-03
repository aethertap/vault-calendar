// Mock implementation of Obsidian API for testing
export class MarkdownRenderChild {
  containerEl: HTMLElement;
  constructor(containerEl: HTMLElement) {
    this.containerEl = containerEl;
  }
  onload() {}
  onunload() {}
}

export class MarkdownRenderer {
  static render(app: any, markdown: string, el: HTMLElement, sourcePath: string, component: any) {
    el.innerHTML = markdown;
    return Promise.resolve();
  }
}

export class Plugin {
  app: any;
  manifest: any;
  loadData() { return Promise.resolve({}); }
  saveData(data: any) { return Promise.resolve(); }
  addCommand(command: any) {}
  registerMarkdownCodeBlockProcessor(language: string, handler: any) {}
}

export class TFile {
  path: string = '';
  name: string = '';
}

export class Notice {
  constructor(message: string) {
    console.log('Notice:', message);
  }
}
