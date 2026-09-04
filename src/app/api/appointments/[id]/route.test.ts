import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));

vi.mock("@/lib/auth/session", () => ({ getSession: getSessionMock }));
vi.mock("@/lib/auth/audit", () => ({ logAudit: vi.fn(), getClientIp: () => "test-ip" }));

const appointmentId = new ObjectId().toString();

vi.mock("@/lib/mongodb", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: (name: string) => ({
        findOne: async () => (name === "appointments" ? { _id: new ObjectId(appointmentId), status: "REQUESTED" } : null),
        updateOne: async () => ({ matchedCount: 1, modifiedCount: 1 }),
      }),
    }),
  }),
}));

import { PATCH } from "./route";

function makeRequest(body: unknown) {
  return {
    json: async () => body,
  } as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  getSessionMock.mockReset();
});

describe("PATCH /api/appointments/[id] authorization", () => {
  const params = Promise.resolve({ id: appointmentId });

  it("rejects an unauthenticated request", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await PATCH(makeRequest({ action: "update_notes", note: "x" }), { params });
    expect(res.status).toBe(401);
  });

  it("rejects a DOCTOR request - appointment mutation is ADMIN/STAFF only", async () => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Doc", email: "doc@clinic.com", role: "DOCTOR" });
    const res = await PATCH(makeRequest({ action: "update_notes", note: "x" }), { params });
    expect(res.status).toBe(403);
  });

  it("allows a STAFF request to update notes", async () => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Reception", email: "staff@clinic.com", role: "STAFF" });
    const res = await PATCH(makeRequest({ action: "update_notes", note: "patient called ahead" }), { params });
    expect(res.status).toBe(200);
  });
});
