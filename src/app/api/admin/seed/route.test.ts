import { describe, it, expect, vi, beforeEach } from "vitest";

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));

vi.mock("@/lib/auth/session", () => ({ getSession: getSessionMock }));
vi.mock("@/lib/auth/audit", () => ({ logAudit: vi.fn(), getClientIp: () => "test-ip" }));

const dbCalls: string[] = [];
vi.mock("@/lib/mongodb", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: (name: string) => ({
        deleteMany: async () => {
          dbCalls.push(`deleteMany:${name}`);
          return { deletedCount: 0 };
        },
        insertMany: async (docs: unknown[]) => {
          dbCalls.push(`insertMany:${name}`);
          return { insertedIds: Object.fromEntries(docs.map((_, i) => [i, `id_${i}`])), insertedCount: docs.length };
        },
        createIndex: async () => "mock_index",
      }),
    }),
  }),
}));

import { POST } from "./route";

function makeRequest() {
  return {} as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  getSessionMock.mockReset();
  dbCalls.length = 0;
});

describe("POST /api/admin/seed authorization", () => {
  it("rejects an unauthenticated request - this is a destructive endpoint", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
    expect(dbCalls).toHaveLength(0);
  });

  it("rejects a non-admin (STAFF) request", async () => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Reception", email: "staff@clinic.com", role: "STAFF" });
    const res = await POST(makeRequest());
    expect(res.status).toBe(403);
    expect(dbCalls).toHaveLength(0);
  });

  it("rejects a DOCTOR request", async () => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Doc", email: "doc@clinic.com", role: "DOCTOR" });
    const res = await POST(makeRequest());
    expect(res.status).toBe(403);
    expect(dbCalls).toHaveLength(0);
  });

  it("allows an ADMIN request and only then touches the database", async () => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Admin", email: "admin@clinic.com", role: "ADMIN" });
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(dbCalls.length).toBeGreaterThan(0);
  });
});
