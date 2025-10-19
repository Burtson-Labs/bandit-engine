import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock global fetch if not available
Object.defineProperty(globalThis, 'fetch', {
  value: vi.fn(),
  writable: true
});

// Mock global Request and Response
Object.defineProperty(globalThis, 'Request', {
  value: class MockRequest {
    constructor(public url: string, public init?: RequestInit) {}
  },
  writable: true
});

Object.defineProperty(globalThis, 'Response', {
  value: class MockResponse {
    constructor(public body: unknown, public init?: ResponseInit) {}
    ok = true;
    status = 200;
    statusText = 'OK';
    json(): Promise<unknown> { return Promise.resolve(this.body); }
  },
  writable: true
});

// Mock IndexedDB service
vi.mock('../services/indexedDB/indexedDBService', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    deleteItem: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve())
  }
}));

// Mock auth service
vi.mock('../services/auth/authenticationService', () => ({
  authenticationService: {
    getToken: vi.fn(() => null)
  }
}));

// Mock debug logger
vi.mock('../services/logging/debugLogger', () => ({
  debugLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));
