import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";

// Repository-wide regression guard: fails the suite if the removed demo
// password, the removed ADMIN_USER/ADMIN_PASS fallback, or a MongoDB
// connection string with embedded credentials is ever reintroduced.
const ROOT = path.resolve(__dirname, "../../..");
const IGNORED_DIRS = new Set(["node_modules", ".git", ".next", "out", "build", "coverage"]);
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".md"]);

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

// Test files legitimately reference these strings as negative-test fixtures
// (e.g. asserting a hash of "primecare123" doesn't contain the plaintext).
const scannableFiles = walk(ROOT).filter(
  (f) => TEXT_EXTENSIONS.has(path.extname(f)) && !f.endsWith(".test.ts")
);

describe("repository secret scan", () => {
  it("contains no reference to the removed demo password", () => {
    const offenders = scannableFiles.filter((f) => readFileSync(f, "utf8").toLowerCase().includes("primecare123"));
    expect(offenders).toEqual([]);
  });

  it("contains no reference to the removed ADMIN_USER/ADMIN_PASS env fallback", () => {
    const pattern = /\bADMIN_PASS\b|\bADMIN_USER\b/;
    const offenders = scannableFiles.filter((f) => pattern.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("contains no MongoDB connection string with embedded credentials", () => {
    const pattern = /mongodb\+srv:\/\/[a-zA-Z0-9_.+-]+:[^@\s"']+@/;
    const offenders = scannableFiles.filter((f) => pattern.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
