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
        createIndex: async () => "mock_index",
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

describe("PATCH /api/appointments/[id] validation", () => {
  const params = Promise.resolve({ id: appointmentId });

  beforeEach(() => {
    getSessionMock.mockResolvedValue({ userId: "u1", name: "Admin", email: "admin@clinic.com", role: "ADMIN" });
  });

  it("rejects a malformed appointment id before ever querying the database", async () => {
    const res = await PATCH(makeRequest({ action: "update_notes", note: "x" }), { params: Promise.resolve({ id: "not-an-id" }) });
    expect(res.status).toBe(400);
  });

  it("rejects an unknown action", async () => {
    const res = await PATCH(makeRequest({ action: "do_something_weird" }), { params });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid status value", async () => {
    const res = await PATCH(makeRequest({ status: "NOT_A_REAL_STATUS" }), { params });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid payment status value", async () => {
    const res = await PATCH(makeRequest({ action: "update_payment", paymentStatus: "MAYBE" }), { params });
    expect(res.status).toBe(400);
  });

  it("accepts a valid payment status value", async () => {
    const res = await PATCH(makeRequest({ action: "update_payment", paymentStatus: "PAID" }), { params });
    expect(res.status).toBe(200);
  });

  it("rejects an invalid reschedule date format", async () => {
    const res = await PATCH(makeRequest({ action: "reschedule", date: "14-12-2026", time: "10:00" }), { params });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid reschedule doctorId", async () => {
    const res = await PATCH(makeRequest({ action: "reschedule", date: "2026-12-14", time: "10:00", doctorId: "bad-id" }), { params });
    expect(res.status).toBe(400);
  });

  it("rejects malformed request bodies (non-JSON-object)", async () => {
    const res = await PATCH(makeRequest(null), { params });
    expect(res.status).toBe(400);
  });

  it("accepts a valid status transition (REQUESTED -> CONFIRMED)", async () => {
    const res = await PATCH(makeRequest({ status: "CONFIRMED" }), { params });
    expect(res.status).toBe(200);
  });

  it("rejects an invalid status transition (REQUESTED -> COMPLETED)", async () => {
    const res = await PATCH(makeRequest({ status: "COMPLETED" }), { params });
    expect(res.status).toBe(400);
  });
});
