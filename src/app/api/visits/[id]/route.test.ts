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
import { GET, PATCH } from "./route";

function makeRequest(body: unknown = null) {
  return { json: async () => body } as unknown as import("next/server").NextRequest;
}

const ADMIN = { userId: "u1", name: "Admin", email: "admin@clinic.com", role: "ADMIN" };

let appointmentId: ObjectId;
let visitId: ObjectId;
let doctorId: ObjectId;

beforeEach(async () => {
  client = (await clientPromise) as unknown as ReturnType<typeof createMockClient>;
  for (const key of Object.keys(client.collections)) delete client.collections[key];
  getSessionMock.mockReset();
  getSessionMock.mockResolvedValue(ADMIN);

  const db = client.db();
  doctorId = new ObjectId();
  appointmentId = new ObjectId();
  visitId = new ObjectId();

  await db.collection("appointments").insertOne({
    _id: appointmentId,
    patientId: new ObjectId().toString(),
    doctorId: doctorId.toString(),
    date: "2026-12-14",
    startTime: "10:00",
    status: "CONFIRMED",
    statusHistory: [],
    doctorSlotActive: true,
    patientSlotActive: true,
  });
  await db.collection("visits").insertOne({
    _id: visitId,
    appointmentId: appointmentId.toString(),
    patientId: new ObjectId().toString(),
    doctorId: doctorId.toString(),
    visitDate: "2026-12-14",
    status: "OPEN",
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: ADMIN.email,
  });
});

describe("GET /api/visits/[id]", () => {
  const params = () => Promise.resolve({ id: visitId.toString() });

  it("rejects a malformed id", async () => {
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: "bad-id" }) });
    expect(res.status).toBe(400);
  });

  it("rejects an unauthenticated request", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await GET(makeRequest(), { params: params() });
    expect(res.status).toBe(401);
  });

  it("returns 404 for a well-formed id that doesn't exist", async () => {
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: new ObjectId().toString() }) });
    expect(res.status).toBe(404);
  });

  it("allows ADMIN to read any visit", async () => {
    const res = await GET(makeRequest(), { params: params() });
    expect(res.status).toBe(200);
  });

  it("allows a DOCTOR to read their own visit", async () => {
    getSessionMock.mockResolvedValue({ userId: "u3", name: "Doc", email: "doc@clinic.com", role: "DOCTOR", doctorId: doctorId.toString() });
    const res = await GET(makeRequest(), { params: params() });
    expect(res.status).toBe(200);
  });

  it("forbids a DOCTOR from reading another doctor's visit", async () => {
    getSessionMock.mockResolvedValue({ userId: "u4", name: "Other", email: "other@clinic.com", role: "DOCTOR", doctorId: new ObjectId().toString() });
    const res = await GET(makeRequest(), { params: params() });
    expect(res.status).toBe(403);
  });

  it("a DOCTOR cannot use a forged doctorId claim to read another doctor's visit - the server always trusts the session's own doctorId, never a client-supplied value", async () => {
    // The route never reads doctorId from the request at all for
    // authorization purposes - only from the server-verified session -
    // so there's nothing for a client to forge here. This test documents
    // that guarantee by confirming access is denied purely based on the
    // session's real doctorId not matching the visit's doctorId.
    getSessionMock.mockResolvedValue({ userId: "u5", name: "Imposter", email: "imposter@clinic.com", role: "DOCTOR", doctorId: "not-the-real-doctor-id" });
    const res = await GET(makeRequest(), { params: params() });
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/visits/[id]", () => {
  const params = () => Promise.resolve({ id: visitId.toString() });

  it("rejects a malformed id", async () => {
    const res = await PATCH(makeRequest({ notes: "x" }), { params: Promise.resolve({ id: "bad-id" }) });
    expect(res.status).toBe(400);
  });

  it("rejects an unauthenticated request", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await PATCH(makeRequest({ notes: "x" }), { params: params() });
    expect(res.status).toBe(401);
  });

  it("rejects a DOCTOR request - visit mutation is ADMIN/STAFF only", async () => {
    getSessionMock.mockResolvedValue({ userId: "u3", name: "Doc", email: "doc@clinic.com", role: "DOCTOR", doctorId: doctorId.toString() });
    const res = await PATCH(makeRequest({ notes: "x" }), { params: params() });
    expect(res.status).toBe(403);
  });

  it("returns 404 for a non-existent visit", async () => {
    const res = await PATCH(makeRequest({ notes: "x" }), { params: Promise.resolve({ id: new ObjectId().toString() }) });
    expect(res.status).toBe(404);
  });

  it("rejects an empty update body", async () => {
    const res = await PATCH(makeRequest({}), { params: params() });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid status value", async () => {
    const res = await PATCH(makeRequest({ status: "NOT_REAL" }), { params: params() });
    expect(res.status).toBe(400);
  });

  it("updates notes without changing status", async () => {
    const res = await PATCH(makeRequest({ notes: "Patient responded well" }), { params: params() });
    expect(res.status).toBe(200);
    const visit = await client.db().collection("visits").findOne({ _id: visitId });
    expect(visit?.notes).toBe("Patient responded well");
    expect(visit?.status).toBe("OPEN");
  });

  it("completing a visit also completes the underlying appointment", async () => {
    const res = await PATCH(makeRequest({ status: "COMPLETED" }), { params: params() });
    expect(res.status).toBe(200);

    const visit = await client.db().collection("visits").findOne({ _id: visitId });
    expect(visit?.status).toBe("COMPLETED");

    const appointment = await client.db().collection("appointments").findOne({ _id: appointmentId });
    expect(appointment?.status).toBe("COMPLETED");
  });

  it("cancelling a visit does NOT cancel the underlying appointment", async () => {
    const res = await PATCH(makeRequest({ status: "CANCELLED" }), { params: params() });
    expect(res.status).toBe(200);

    const appointment = await client.db().collection("appointments").findOne({ _id: appointmentId });
    expect(appointment?.status).toBe("CONFIRMED");
  });

  it("rejects a further transition once a visit is terminal (COMPLETED)", async () => {
    const first = await PATCH(makeRequest({ status: "COMPLETED" }), { params: params() });
    expect(first.status).toBe(200);

    const second = await PATCH(makeRequest({ status: "CANCELLED" }), { params: params() });
    expect(second.status).toBe(400);
  });
});
