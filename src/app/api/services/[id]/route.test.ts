import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";
import { createMockClient } from "@/test/mockMongo";

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: getSessionMock }));
vi.mock("@/lib/auth/audit", () => ({ logAudit: vi.fn(), getClientIp: () => "test-ip" }));

let client: ReturnType<typeof createMockClient>;
vi.mock("@/lib/mongodb", () => {
  const c = createMockClient();
  return { default: Promise.resolve(c) };
});

import clientPromise from "@/lib/mongodb";
import { __resetIndexCacheForTests } from "@/lib/db/indexes";
import { PATCH, DELETE } from "./route";

function makeRequest(body: unknown = null) {
  return { json: async () => body } as unknown as import("next/server").NextRequest;
}

let serviceId: ObjectId;

beforeEach(async () => {
  client = (await clientPromise) as unknown as ReturnType<typeof createMockClient>;
  for (const key of Object.keys(client.collections)) delete client.collections[key];
  __resetIndexCacheForTests();
  getSessionMock.mockReset();
  getSessionMock.mockResolvedValue({ userId: "u1", name: "Admin", email: "admin@clinic.com", role: "ADMIN" });

  serviceId = new ObjectId();
  await client.db().collection("services").insertOne({
    _id: serviceId,
    title: "General Consultation",
    department: "General Medicine",
    duration: 20,
    price: 30,
    isActive: true,
  });
});

describe("PATCH /api/services/[id]", () => {
  const params = () => Promise.resolve({ id: serviceId.toString() });

  it("rejects a malformed id", async () => {
    const res = await PATCH(makeRequest({ price: 40 }), { params: Promise.resolve({ id: "bad-id" }) });
    expect(res.status).toBe(400);
  });

  it("rejects an unauthenticated request", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await PATCH(makeRequest({ price: 40 }), { params: params() });
    expect(res.status).toBe(401);
  });

  it("rejects a non-admin request", async () => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Staff", email: "staff@clinic.com", role: "STAFF" });
    const res = await PATCH(makeRequest({ price: 40 }), { params: params() });
    expect(res.status).toBe(403);
  });

  it("returns 404 for a well-formed id that doesn't exist", async () => {
    const res = await PATCH(makeRequest({ price: 40 }), { params: Promise.resolve({ id: new ObjectId().toString() }) });
    expect(res.status).toBe(404);
  });

  it("rejects an empty update body", async () => {
    const res = await PATCH(makeRequest({}), { params: params() });
    expect(res.status).toBe(400);
  });

  it("rejects a negative price", async () => {
    const res = await PATCH(makeRequest({ price: -1 }), { params: params() });
    expect(res.status).toBe(400);
  });

  it("updates a valid field", async () => {
    const res = await PATCH(makeRequest({ price: 45 }), { params: params() });
    expect(res.status).toBe(200);
  });

  it("rejects renaming into a title that already exists (409)", async () => {
    await client.db().collection("services").insertOne({ title: "Existing Title", isActive: true });
    const res = await PATCH(makeRequest({ title: "Existing Title" }), { params: params() });
    expect(res.status).toBe(409);
  });
});

describe("DELETE /api/services/[id] (soft-deactivate)", () => {
  const params = () => Promise.resolve({ id: serviceId.toString() });

  it("rejects a malformed id", async () => {
    const res = await DELETE(makeRequest(), { params: Promise.resolve({ id: "bad-id" }) });
    expect(res.status).toBe(400);
  });

  it("rejects a non-admin request", async () => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Doc", email: "doc@clinic.com", role: "DOCTOR" });
    const res = await DELETE(makeRequest(), { params: params() });
    expect(res.status).toBe(403);
  });

  it("deactivates rather than deletes the document", async () => {
    const res = await DELETE(makeRequest(), { params: params() });
    expect(res.status).toBe(200);

    const doc = await client.db().collection("services").findOne({ _id: serviceId });
    expect(doc).not.toBeNull();
    expect(doc?.isActive).toBe(false);
  });

  it("returns 404 for a non-existent service", async () => {
    const res = await DELETE(makeRequest(), { params: Promise.resolve({ id: new ObjectId().toString() }) });
    expect(res.status).toBe(404);
  });
});
