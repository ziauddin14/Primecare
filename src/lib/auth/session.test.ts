import { describe, it, expect, beforeEach, vi } from "vitest";
import { ObjectId } from "mongodb";
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
import { createSession, resolveSessionToken, getSession, destroySession } from "./session";

async function seedUser(overrides: Record<string, unknown> = {}) {
  const client = (await clientPromise) as unknown as FakeClient;
  const db = client.db();
  const _id = new ObjectId();
  await db.collection("users").insertOne({
    _id,
    name: "Dr. Test",
    email: "test@clinic.com",
    role: "ADMIN",
    isActive: true,
    passwordHash: "x",
    ...overrides,
  });
  return _id;
}

beforeEach(async () => {
  cookieJar = new Map();
  const client = (await clientPromise) as unknown as { collections: Record<string, unknown> };
  for (const key of Object.keys(client.collections)) {
    delete client.collections[key];
  }
});

describe("session lifecycle", () => {
  it("creates a session and resolves it back to the issuing user", async () => {
    const userId = await seedUser();
    const token = await createSession({ id: userId.toString(), name: "Dr. Test", email: "test@clinic.com", role: "ADMIN" });
    const resolved = await resolveSessionToken(token);
    expect(resolved?.userId).toBe(userId.toString());
    expect(resolved?.role).toBe("ADMIN");
  });

  it("getSession reads the session set by the preceding login (valid session recognized)", async () => {
    const userId = await seedUser();
    await createSession({ id: userId.toString(), name: "Dr. Test", email: "test@clinic.com", role: "ADMIN" });
    const session = await getSession();
    expect(session?.userId).toBe(userId.toString());
  });

  it("rejects a forged/unknown token", async () => {
    const resolved = await resolveSessionToken("not-a-real-token");
    expect(resolved).toBeNull();
  });

  it("rejects a session once it has expired", async () => {
    const userId = await seedUser();
    const token = await createSession({ id: userId.toString(), name: "Dr. Test", email: "test@clinic.com", role: "ADMIN" });

    const client = (await clientPromise) as unknown as FakeClient;
    const sessionsDocs = client.db().collection("sessions")._all();
    sessionsDocs[0].expiresAt = new Date(Date.now() - 1000);

    expect(await resolveSessionToken(token)).toBeNull();
  });

  it("rejects a session for a user deactivated after the session was issued", async () => {
    const userId = await seedUser({ isActive: true });
    const token = await createSession({ id: userId.toString(), name: "Dr. Test", email: "test@clinic.com", role: "ADMIN" });

    const client = (await clientPromise) as unknown as FakeClient;
    await client.db().collection("users").updateOne({ _id: userId }, { $set: { isActive: false } });

    expect(await resolveSessionToken(token)).toBeNull();
  });

  it("logout invalidates the session immediately", async () => {
    const userId = await seedUser();
    const token = await createSession({ id: userId.toString(), name: "Dr. Test", email: "test@clinic.com", role: "ADMIN" });
    expect(await resolveSessionToken(token)).not.toBeNull();

    await destroySession();

    expect(await resolveSessionToken(token)).toBeNull();
  });

  it("a forged client-readable role cookie does not change the resolved role - it always comes from the DB user record", async () => {
    const userId = await seedUser({ role: "STAFF" });
    const token = await createSession({ id: userId.toString(), name: "Real Staff", email: "test@clinic.com", role: "STAFF" });

    // Simulate an attacker editing document.cookie in devtools.
    cookieJar.set("user_role", { value: "ADMIN" });

    const resolved = await resolveSessionToken(token);
    expect(resolved?.role).toBe("STAFF");
  });
});
