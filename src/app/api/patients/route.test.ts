import { describe, it, expect, vi, beforeEach } from "vitest";

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));

vi.mock("@/lib/auth/session", () => ({ getSession: getSessionMock }));

vi.mock("@/lib/mongodb", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: () => ({
        aggregate: () => ({ toArray: async () => [] }),
      }),
    }),
  }),
}));

import { GET } from "./route";

beforeEach(() => {
  getSessionMock.mockReset();
});

describe("GET /api/patients authorization", () => {
  it("rejects an unauthenticated request (401) - patient PII is not publicly readable", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("rejects a DOCTOR session (403) - patients list is ADMIN/STAFF only", async () => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Doc", email: "doc@clinic.com", role: "DOCTOR" });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("allows a STAFF session", async () => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Reception", email: "staff@clinic.com", role: "STAFF" });
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("allows an ADMIN session", async () => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Admin", email: "admin@clinic.com", role: "ADMIN" });
    const res = await GET();
    expect(res.status).toBe(200);
  });
});
