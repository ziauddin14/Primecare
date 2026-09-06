import { describe, it, expect } from "vitest";
import { ObjectId } from "mongodb";
import { isValidObjectId } from "./objectId";

describe("isValidObjectId", () => {
  it("accepts a real ObjectId's string form", () => {
    expect(isValidObjectId(new ObjectId().toString())).toBe(true);
  });

  it("rejects a short/garbage string", () => {
    expect(isValidObjectId("abc")).toBe(false);
  });

  it("rejects a 12-character non-hex string that ObjectId.isValid alone would accept", () => {
    // ObjectId.isValid("123456789012") is true (12 bytes), but it's not the
    // canonical 24-char hex form a client would ever send - must be rejected.
    expect(isValidObjectId("123456789012")).toBe(false);
  });

  it("rejects null/undefined/number/object", () => {
    expect(isValidObjectId(null)).toBe(false);
    expect(isValidObjectId(undefined)).toBe(false);
    expect(isValidObjectId(12345)).toBe(false);
    expect(isValidObjectId({})).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidObjectId("")).toBe(false);
  });

  it("rejects a hex string of the wrong length", () => {
    expect(isValidObjectId("abcdef0123456789abcdef")).toBe(false); // 22 chars
  });
});
