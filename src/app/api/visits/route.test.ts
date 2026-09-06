import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";
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
import { POST, GET } from "./route";

function makeRequest(body: unknown, url = "http://localhost/api/visits") {
  return { url, json: async () => body } as unknown as import("next/server").NextRequest;
}

const ADMIN = { userId: "u1", name: "Admin", email: "admin@clinic.com", role: "ADMIN" };
const STAFF = { userId: "u2", name: "Staff", email: "staff@clinic.com", role: "STAFF" };

let confirmedAppointmentId: ObjectId;
let requestedAppointmentId: ObjectId;
let doctorId: ObjectId;

beforeEach(async () => {
  client = (await clientPromise) as unknown as ReturnType<typeof createMockClient>;
  for (const key of Object.keys(client.collections)) delete client.collections[key];
  __resetIndexCacheForTests();
  getSessionMock.mockReset();
  getSessionMock.mockResolvedValue(ADMIN);

  const db = client.db();
  doctorId = new ObjectId();
  confirmedAppointmentId = new ObjectId();
  requestedAppointmentId = new ObjectId();

  await db.collection("appointments").insertOne({
    _id: confirmedAppointmentId,
    patientId: new ObjectId().toString(),
    doctorId: doctorId.toString(),
    date: "2026-12-14",
    startTime: "10:00",
    status: "CONFIRMED",
  });
  await db.collection("appointments").insertOne({
    _id: requestedAppointmentId,
    patientId: new ObjectId().toString(),
    doctorId: doctorId.toString(),
    date: "2026-12-14",
    startTime: "11:00",
    status: "REQUESTED",
  });
});

describe("POST /api/visits", () => {
  it("rejects an unauthenticated request", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await POST(makeRequest({ appointmentId: confirmedAppointmentId.toString() }));
    expect(res.status).toBe(401);
  });

  it("rejects a DOCTOR request - visit creation is ADMIN/STAFF only", async () => {
    getSessionMock.mockResolvedValue({ userId: "u3", name: "Doc", email: "doc@clinic.com", role: "DOCTOR" });
    const res = await POST(makeRequest({ appointmentId: confirmedAppointmentId.toString() }));
    expect(res.status).toBe(403);
  });

  it("rejects a malformed appointmentId", async () => {
    const res = await POST(makeRequest({ appointmentId: "not-an-id" }));
    expect(res.status).toBe(400);
  });

  it("rejects a missing appointment", async () => {
    const res = await POST(makeRequest({ appointmentId: new ObjectId().toString() }));
    expect(res.status).toBe(404);
  });

  it("rejects creating a visit for a non-CONFIRMED appointment", async () => {
    const res = await POST(makeRequest({ appointmentId: requestedAppointmentId.toString() }));
    expect(res.status).toBe(409);
  });

  it("creates a visit for a CONFIRMED appointment as STAFF", async () => {
    getSessionMock.mockResolvedValue(STAFF);
    const res = await POST(makeRequest({ appointmentId: confirmedAppointmentId.toString() }));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.ok).toBe(true);
  });

  it("rejects a duplicate visit for the same appointment (409)", async () => {
    const first = await POST(makeRequest({ appointmentId: confirmedAppointmentId.toString() }));
    expect(first.status).toBe(201);

    const second = await POST(makeRequest({ appointmentId: confirmedAppointmentId.toString() }));
    expect(second.status).toBe(409);

    const visits = client.collections["visits"] as unknown as MockCollection;
    expect(visits._all().filter((v) => v.appointmentId === confirmedAppointmentId.toString())).toHaveLength(1);
  });

  it("snapshots patientId/doctorId/visitDate from the appointment and records the creating actor", async () => {
    const res = await POST(makeRequest({ appointmentId: confirmedAppointmentId.toString() }));
    expect(res.status).toBe(201);

    const visits = client.collections["visits"] as unknown as MockCollection;
    const visit = visits._all()[0];
    expect(visit.doctorId).toBe(doctorId.toString());
    expect(visit.visitDate).toBe("2026-12-14");
    expect(visit.status).toBe("OPEN");
    expect(visit.createdBy).toBe(ADMIN.email);
  });
});

describe("GET /api/visits", () => {
  it("rejects an unauthenticated request", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await GET(makeRequest(null));
    expect(res.status).toBe(401);
  });

  it("rejects a malformed appointmentId filter", async () => {
    const res = await GET(makeRequest(null, "http://localhost/api/visits?appointmentId=not-an-id"));
    expect(res.status).toBe(400);
  });

  it("returns an empty list for a DOCTOR session with no linked doctor record", async () => {
    getSessionMock.mockResolvedValue({ userId: "u3", name: "Doc", email: "doc@clinic.com", role: "DOCTOR" });
    await POST(makeRequest({ appointmentId: confirmedAppointmentId.toString() }));
    getSessionMock.mockResolvedValue({ userId: "u3", name: "Doc", email: "doc@clinic.com", role: "DOCTOR" });

    const res = await GET(makeRequest(null));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.visits).toEqual([]);
  });

  it("scopes a DOCTOR session to only their own doctorId's visits", async () => {
    await POST(makeRequest({ appointmentId: confirmedAppointmentId.toString() }));

    getSessionMock.mockResolvedValue({ userId: "u3", name: "Doc", email: "doc@clinic.com", role: "DOCTOR", doctorId: doctorId.toString() });
    const res = await GET(makeRequest(null));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.visits).toHaveLength(1);

    getSessionMock.mockResolvedValue({ userId: "u4", name: "Other Doc", email: "other@clinic.com", role: "DOCTOR", doctorId: new ObjectId().toString() });
    const res2 = await GET(makeRequest(null));
    const body2 = await res2.json();
    expect(body2.visits).toHaveLength(0);
  });

  it("allows ADMIN to list all visits", async () => {
    await POST(makeRequest({ appointmentId: confirmedAppointmentId.toString() }));
    const res = await GET(makeRequest(null));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.visits).toHaveLength(1);
  });
});
