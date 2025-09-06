/**
 * Test setup file for Vitest
 * Configures global test environment
 */

// Mock DOM APIs that might not be available in test environment
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock URL.createObjectURL for CSV download tests
Object.defineProperty(window.URL, 'createObjectURL', {
  value: vi.fn(() => 'mock-url'),
  writable: true,
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: vi.fn(),
  writable: true,
});