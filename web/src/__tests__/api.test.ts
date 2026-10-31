import { describe, it, expect, beforeEach } from "vitest";
import {
  setStoredTokens,
  getStoredToken,
  clearStoredTokens,
} from "../api/client";

// In-memory mock for Node test environment
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
  },
};
(globalThis as any).localStorage = mockLocalStorage as any;

describe("API Client Token Storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and retrieves access and refresh tokens", () => {
    expect(getStoredToken()).toBeNull();

    setStoredTokens("access-token-xyz-123", "refresh-token-abc-789");
    expect(getStoredToken()).toBe("access-token-xyz-123");
    expect(localStorage.getItem("scamroad_refresh_token")).toBe("refresh-token-abc-789");
  });

  it("clears tokens on logout", () => {
    setStoredTokens("test-access", "test-refresh");
    expect(getStoredToken()).toBe("test-access");

    clearStoredTokens();
    expect(getStoredToken()).toBeNull();
    expect(localStorage.getItem("scamroad_refresh_token")).toBeNull();
  });
});
