// Mock implementation of Obsidian DataView API for testing
export function getAPI(app?: any) {
  return {
    query: async (source: string) => ({
      successful: true,
      value: { values: [] }
    }),
    pages: async (source: string) => ({
      file: {
        tasks: {
          where: () => ({ forEach: () => {} })
        }
      }
    }),
  };
}
