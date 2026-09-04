import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockClient, type MockCollection } from "@/test/mockMongo";

type FakeClient = { db: () => { collection: (n: string) => MockCollection }; collections: Record<string, MockCollection> };

vi.mock("@/lib/mongodb", () => {
  const client = createMockClient();
  return { default: Promise.resolve(client) };
});

let cookieJar: Map<string, { value: string }>;
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => cookieJar.get(name),
    set: (name: string, value: string) => {
      cookieJar.set(name, { value });
    },
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  }),
}));

import clientPromise from "@/lib/mongodb";
import { hashPassword } from "@/lib/auth/password";
import { POST } from "./route";

function makeRequest(body: unknown, ip = "10.0.0.1") {
  return {
    json: async () => body,
    headers: { get: (name: string) => (name === "x-forwarded-for" ? ip : null) },
  } as unknown as import("next/server").NextRequest;
}

async function seedActiveAdmin(password: string) {
  const client = (await clientPromise) as unknown as FakeClient;
  const passwordHash = await hashPassword(password);
  await client.db().collection("users").insertOne({
    name: "Clinic Owner",
    email: "owner@clinic.com",
    passwordHash,
    role: "ADMIN",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

beforeEach(async () => {
  cookieJar = new Map();
  const client = (await clientPromise) as unknown as { collections: Record<string, unknown> };
  for (const key of Object.keys(client.collections)) {
    delete client.collections[key];
  }
});

describe("POST /api/auth/login", () => {
  it("succeeds with correct email + password and never returns the password hash", async () => {
    await seedActiveAdmin("correct-horse-battery");

    const res = await POST(makeRequest({ email: "owner@clinic.com", password: "correct-horse-battery" }, "1.1.1.1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.user.role).toBe("ADMIN");
    expect(body).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(body)).not.toContain("passwordHash");
    expect(cookieJar.has("session")).toBe(true);
  });

  it("fails with an incorrect password", async () => {
    await seedActiveAdmin("correct-horse-battery");

    const res = await POST(makeRequest({ email: "owner@clinic.com", password: "wrong-password" }, "1.1.1.2"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(cookieJar.has("session")).toBe(false);
  });

  it("fails for an unknown email with the same generic message (no user enumeration)", async () => {
    await seedActiveAdmin("correct-horse-battery");

    const wrongPassword = await POST(makeRequest({ email: "owner@clinic.com", password: "wrong-password" }, "1.1.1.3"));
    const unknownUser = await POST(makeRequest({ email: "nobody@clinic.com", password: "wrong-password" }, "1.1.1.4"));

    expect(unknownUser.status).toBe(401);
    const wrongBody = await wrongPassword.json();
    const unknownBody = await unknownUser.json();
    expect(unknownBody.message).toBe(wrongBody.message);
  });

  it("fails for a deactivated (inactive) user even with the correct password", async () => {
    await seedActiveAdmin("correct-horse-battery");
    const client = (await clientPromise) as unknown as FakeClient;
    await client.db().collection("users").updateOne({ email: "owner@clinic.com" }, { $set: { isActive: false } });

    const res = await POST(makeRequest({ email: "owner@clinic.com", password: "correct-horse-battery" }, "1.1.1.5"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(cookieJar.has("session")).toBe(false);
  });

  it("rejects a malformed request body (missing password)", async () => {
    const res = await POST(makeRequest({ email: "owner@clinic.com" }, "1.1.1.6"));
    expect(res.status).toBe(400);
  });
});
