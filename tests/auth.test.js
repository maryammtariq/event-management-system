import { beforeEach, describe, it, expect, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { authenticate, loadSession } from "../src/services/auth";
import { KEYS, readJSON, loadRegistrations } from "../src/utils/storage";
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("crypto", webcrypto);
});
describe("browser account simulation", () => {
  it("validates fields and rejects duplicate emails", async () => {
    await expect(
      authenticate({ name: "A", email: "bad", password: "123" }, true),
    ).rejects.toThrow("email");
    await expect(
      authenticate(
        { name: "A", email: "valid@example.com", password: "12345678" },
        true,
      ),
    ).rejects.toThrow("name");
    await expect(
      authenticate(
        { name: "Alice", email: "a@example.com", password: "short" },
        true,
      ),
    ).rejects.toThrow("8 characters");
    await authenticate(
      { name: "Alice", email: "a@example.com", password: "demo12345" },
      true,
    );
    await expect(
      authenticate(
        { name: "Other", email: " A@EXAMPLE.COM ", password: "demo12345" },
        true,
      ),
    ).rejects.toThrow("already exists");
  });
  it("hashes the password, restores sessions and rejects incorrect login", async () => {
    const user = await authenticate(
      { name: "Alice", email: " Alice@Example.com ", password: "demo12345" },
      true,
    );
    expect(user.email).toBe("alice@example.com");
    expect(loadSession()).toEqual(user);
    const stored = localStorage.getItem(KEYS.users);
    expect(stored).not.toContain("demo12345");
    expect(JSON.parse(stored)[0].hash).toHaveLength(64);
    await expect(
      authenticate({ email: "alice@example.com", password: "wrong" }, false),
    ).rejects.toThrow("incorrect");
    expect(
      await authenticate(
        { email: "alice@example.com", password: "demo12345" },
        false,
      ),
    ).toEqual(user);
  });
  it("recovers from malformed saved state", () => {
    localStorage.setItem(KEYS.users, "broken");
    localStorage.setItem(KEYS.session, "{}");
    localStorage.setItem(KEYS.registrations, "null");
    expect(loadSession()).toBeNull();
    expect(loadRegistrations()).toEqual({});
    expect(readJSON("missing", [])).toEqual([]);
  });
  it("reports storage failure instead of claiming an account was saved", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    await expect(
      authenticate(
        { name: "Alice", email: "a@example.com", password: "demo12345" },
        true,
      ),
    ).rejects.toThrow("could not save");
  });
});
