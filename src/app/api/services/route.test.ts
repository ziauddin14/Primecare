import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockClient, type MockCollection } from "@/test/mockMongo";

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
import { GET, POST } from "./route";

function makeRequest(body: unknown, url = "http://localhost/api/services") {
  return {
    url,
    json: async () => body,
    headers: { get: () => null },
  } as unknown as import("next/server").NextRequest;
}

const VALID_SERVICE = {
  title: "Follow-up Consultation",
  department: "General Medicine",
  duration: 20,
  price: 30,
};

beforeEach(async () => {
  client = (await clientPromise) as unknown as ReturnType<typeof createMockClient>;
  for (const key of Object.keys(client.collections)) delete client.collections[key];
  __resetIndexCacheForTests();
  getSessionMock.mockReset();
});

describe("GET /api/services", () => {
  it("is public and returns only active services by default", async () => {
    const db = client.db();
    await db.collection("services").insertOne({ title: "Active One", isActive: true });
    await db.collection("services").insertOne({ title: "Inactive One", isActive: false });

    const res = await GET(makeRequest(null));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.services).toHaveLength(1);
    expect(body.services[0].title).toBe("Active One");
  });

  it("requires ADMIN for ?all=true", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await GET(makeRequest(null, "http://localhost/api/services?all=true"));
    expect(res.status).toBe(401);
  });

  it("returns inactive services too when ADMIN requests ?all=true", async () => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Admin", email: "admin@clinic.com", role: "ADMIN" });
    const db = client.db();
    await db.collection("services").insertOne({ title: "Active One", isActive: true });
    await db.collection("services").insertOne({ title: "Inactive One", isActive: false });

    const res = await GET(makeRequest(null, "http://localhost/api/services?all=true"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.services).toHaveLength(2);
  });
});

describe("POST /api/services", () => {
  it("rejects an unauthenticated request", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await POST(makeRequest(VALID_SERVICE));
    expect(res.status).toBe(401);
  });

  it("rejects a non-admin (STAFF) request", async () => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Staff", email: "staff@clinic.com", role: "STAFF" });
    const res = await POST(makeRequest(VALID_SERVICE));
    expect(res.status).toBe(403);
  });

  it("rejects an empty title", async () => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Admin", email: "admin@clinic.com", role: "ADMIN" });
    const res = await POST(makeRequest({ ...VALID_SERVICE, title: "" }));
    expect(res.status).toBe(400);
  });

  it("rejects a negative duration", async () => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Admin", email: "admin@clinic.com", role: "ADMIN" });
    const res = await POST(makeRequest({ ...VALID_SERVICE, duration: -10 }));
    expect(res.status).toBe(400);
  });

  it("rejects a negative price", async () => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Admin", email: "admin@clinic.com", role: "ADMIN" });
    const res = await POST(makeRequest({ ...VALID_SERVICE, price: -5 }));
    expect(res.status).toBe(400);
  });

  it("rejects a malformed request body", async () => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Admin", email: "admin@clinic.com", role: "ADMIN" });
    const res = await POST(makeRequest(null));
    expect(res.status).toBe(400);
  });

  it("creates a valid service as ADMIN", async () => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Admin", email: "admin@clinic.com", role: "ADMIN" });
    const res = await POST(makeRequest(VALID_SERVICE));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.ok).toBe(true);
  });

  it("rejects creating a service with a duplicate title (409)", async () => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Admin", email: "admin@clinic.com", role: "ADMIN" });
    const first = await POST(makeRequest(VALID_SERVICE));
    expect(first.status).toBe(201);

    const second = await POST(makeRequest(VALID_SERVICE));
    expect(second.status).toBe(409);

    const services = client.collections["services"] as unknown as MockCollection;
    expect(services._all().filter((s) => s.title === VALID_SERVICE.title)).toHaveLength(1);
  });
});
