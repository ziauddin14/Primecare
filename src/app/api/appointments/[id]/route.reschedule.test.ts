import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";
import { createMockClient, type MockCollection } from "@/test/mockMongo";

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn().mockResolvedValue({ userId: "u1", name: "Admin", email: "admin@clinic.com", role: "ADMIN" }),
}));
vi.mock("@/lib/auth/audit", () => ({ logAudit: vi.fn(), getClientIp: () => "test-ip" }));
vi.mock("@/lib/notifications/NotificationManager", () => ({ NotificationManager: { trigger: vi.fn() } }));

let client: ReturnType<typeof createMockClient>;
vi.mock("@/lib/mongodb", () => {
  const c = createMockClient();
  return { default: Promise.resolve(c) };
});

import clientPromise from "@/lib/mongodb";
import { __resetIndexCacheForTests } from "@/lib/db/indexes";
import { PATCH } from "./route";

function makeRequest(body: unknown) {
  return { json: async () => body } as unknown as import("next/server").NextRequest;
}

const doctorId = new ObjectId().toString();
let appointmentAId: ObjectId;
let appointmentBId: ObjectId;

beforeEach(async () => {
  client = (await clientPromise) as unknown as ReturnType<typeof createMockClient>;
  for (const key of Object.keys(client.collections)) delete client.collections[key];
  __resetIndexCacheForTests();

  const db = client.db();
  await db.collection("doctors").insertOne({
    _id: new ObjectId(doctorId),
    name: "Dr. Test",
    schedule: { slotDuration: 30 },
  });

  appointmentAId = new ObjectId();
  appointmentBId = new ObjectId();

  await db.collection("patients").insertOne({ _id: new ObjectId(), fullName: "Patient A", phone: "0300" });

  await db.collection("appointments").insertOne({
    _id: appointmentAId,
    patientId: new ObjectId().toString(),
    doctorId,
    date: "2026-12-14",
    startTime: "10:00",
    status: "CONFIRMED",
    statusHistory: [],
    doctorSlotActive: true,
    patientSlotActive: true,
  });
  await db.collection("appointments").insertOne({
    _id: appointmentBId,
    patientId: new ObjectId().toString(),
    doctorId,
    date: "2026-12-14",
    startTime: "11:00",
    status: "CONFIRMED",
    statusHistory: [],
    doctorSlotActive: true,
    patientSlotActive: true,
  });
});

describe("PATCH reschedule - real double-booking protection via the unique index", () => {
  it("rejects rescheduling appointment B onto appointment A's occupied slot", async () => {
    const res = await PATCH(
      makeRequest({ action: "reschedule", date: "2026-12-14", time: "10:00", doctorId }),
      { params: Promise.resolve({ id: appointmentBId.toString() }) }
    );
    expect(res.status).toBe(409);

    // B must still be at its original time - the failed update must not
    // have partially applied.
    const appointments = client.db().collection("appointments") as unknown as MockCollection;
    const b = appointments._all().find((a) => String(a._id) === appointmentBId.toString());
    expect(b?.startTime).toBe("11:00");
  });

  it("allows rescheduling to a free slot, and frees the original slot for reuse", async () => {
    const res = await PATCH(
      makeRequest({ action: "reschedule", date: "2026-12-14", time: "12:00", doctorId }),
      { params: Promise.resolve({ id: appointmentBId.toString() }) }
    );
    expect(res.status).toBe(200);

    // The old 11:00 slot must now be free - rescheduling A onto it must succeed.
    const res2 = await PATCH(
      makeRequest({ action: "reschedule", date: "2026-12-14", time: "11:00", doctorId }),
      { params: Promise.resolve({ id: appointmentAId.toString() }) }
    );
    expect(res2.status).toBe(200);
  });
});
