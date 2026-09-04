import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("hashes a password to a value different from the plaintext", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toBe("correct horse battery staple");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifies the correct password against its hash", async () => {
    const hash = await hashPassword("s3cure-Pass!23");
    await expect(verifyPassword("s3cure-Pass!23", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("s3cure-Pass!23");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("produces a different hash each time (random salt)", async () => {
    const hashA = await hashPassword("same-input");
    const hashB = await hashPassword("same-input");
    expect(hashA).not.toBe(hashB);
  });

  it("never leaves the plaintext recoverable via the hash format", async () => {
    const hash = await hashPassword("primecare123");
    expect(hash).not.toContain("primecare123");
  });
});
