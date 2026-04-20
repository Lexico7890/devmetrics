import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock global fetch if needed, or rely on individual test mocks
// For now, we'll ensure we clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
