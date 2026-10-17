import { afterEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/lib/db";

describe("getDb", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("fails with a helpful message when MONGODB_URI is missing", async () => {
    vi.stubEnv("MONGODB_URI", "");
    await expect(getDb()).rejects.toThrow(/MONGODB_URI is not set/);
  });
});
