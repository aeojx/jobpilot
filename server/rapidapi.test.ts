import { describe, expect, it } from "vitest";

/**
 * Validates that the RAPIDAPI_KEY environment variable is set.
 * We do not make a live API call in tests to avoid consuming quota —
 * the key format and presence is sufficient for CI validation.
 */
describe("RAPIDAPI_KEY environment variable", () => {
  it("is set and non-empty", () => {
    const key = process.env.RAPIDAPI_KEY;
    expect(key).toBeDefined();
    expect(typeof key).toBe("string");
    expect((key as string).length).toBeGreaterThan(10);
  });
});
