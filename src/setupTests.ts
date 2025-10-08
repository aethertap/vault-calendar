// Jest setup file for additional configuration
// Add any global test setup here

// Extend global interface for testing
declare global {
  var app: any;
}

// Mock Obsidian API for testing
(global as any).app = {};

// Mock console methods if needed
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
// };
