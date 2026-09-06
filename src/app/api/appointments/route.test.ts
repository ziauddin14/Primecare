import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";
import { createMockClient, type MockCollection } from "@/test/mockMongo";

vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn().mockResolvedValue(null) }));

vi.mock("@/lib/notifications/NotificationManager", () => ({
  NotificationManager: { trigger: vi.fn() },
}));

let client: ReturnType<typeof createMockClient>;
vi.mock("@/lib/mongodb", () => {
  const c = createMockClient();
  return { default: Promise.resolve(c) };
});

import clientPromise from "@/lib/mongodb";
import { __resetIndexCacheForTests } from "@/lib/db/indexes";
import { POST, GET } from "./route";

function makeRequest(body: unknown, ip = "9.9.9.9") {
  return {
    json: async () => body,
    headers: { get: (name: string) => (name === "x-forwarded-for" ? ip : null) },
  } as unknown as import("next/server").NextRequest;
}

const doctorId = new ObjectId().toString();
const serviceId = new ObjectId().toString();
const futureDate = "2026-12-14"; // a Monday

const VALID_BODY = {
  name: "Test Patient",
  phone: "03001234567",
  serviceId,
  doctorId,
  date: futureDate,
  time: "10:00",
};

async function seedDoctorAndService() {
  const c = (await clientPromise) as unknown as { db: () => { collection: (n: string) => MockCollection } };
  const db = c.db();
  await db.collection("services").insertOne({ _id: new ObjectId(serviceId), title: "Consult", department: "General" });
  await db.collection("doctors").insertOne({
    _id: new ObjectId(doctorId),
    name: "Dr. Test",
    department: "General",
    schedule: { days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], startTime: "09:00", endTime: "18:00", slotDuration: 30 },
  });
}

beforeEach(async () => {
  client = (await clientPromise) as unknown as ReturnType<typeof createMockClient>;
  for (const key of Object.keys(client.collections)) {
    delete client.collections[key];
  }
  __resetIndexCacheForTests();
  await seedDoctorAndService();
});

describe("POST /api/appointments validation", () => {
  it("rejects a malformed serviceId", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, serviceId: "not-an-id" }));
    expect(res.status).toBe(400);
  });

  it("rejects a malformed doctorId", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, doctorId: "not-an-id" }));
    expect(res.status).toBe(400);
  });

  it("rejects an invalid time format", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, time: "25:99" }));
    expect(res.status).toBe(400);
  });

  it("rejects an invalid phone number", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, phone: "not-a-phone" }));
    expect(res.status).toBe(400);
  });

  it("accepts a normal, valid booking", async () => {
    const res = await POST(makeRequest(VALID_BODY));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.ok).toBe(true);
  });
});

describe("POST /api/appointments double-booking", () => {
  it("rejects a second sequential booking for the same doctor+date+time (fast-fail pre-check)", async () => {
    const first = await POST(makeRequest(VALID_BODY, "1.1.1.1"));
    expect(first.status).toBe(201);

    const second = await POST(makeRequest({ ...VALID_BODY, phone: "03009999999" }, "1.1.1.2"));
    expect(second.status).toBe(409);

    const appts = client.collections["appointments"]?._all() ?? [];
    expect(appts.filter((a) => a.doctorId === doctorId && a.date === futureDate && a.startTime === "10:00").length).toBe(1);
  });

  it("allows two different doctors to book the exact same date+time", async () => {
    const doctorId2 = new ObjectId().toString();
    const db = client.db();
    await db.collection("doctors").insertOne({
      _id: new ObjectId(doctorId2),
      name: "Dr. Second",
      department: "General",
      schedule: { days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], startTime: "09:00", endTime: "18:00", slotDuration: 30 },
    });

    const a = await POST(makeRequest(VALID_BODY, "2.2.2.1"));
    const b = await POST(makeRequest({ ...VALID_BODY, doctorId: doctorId2, phone: "03009999999" }, "2.2.2.2"));

    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
  });

  it("allows the same doctor to be booked at a different time on the same day", async () => {
    const a = await POST(makeRequest(VALID_BODY, "3.3.3.1"));
    const b = await POST(makeRequest({ ...VALID_BODY, time: "11:00", phone: "03009999999" }, "3.3.3.2"));

    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
  });

  it(
    "CONCURRENCY: two simultaneous requests for the same doctor+date+time - exactly one succeeds, one is rejected, " +
    "and exactly one active appointment ends up occupying the slot. This drives both requests through the real " +
    "POST handler (real pre-check + real insertOne) concurrently against a mock collection that enforces the same " +
    "partial-unique-index contract as MongoDB, so it exercises the actual conflict path (E11000 -> 409), not a " +
    "second call to a conflict-check helper.",
    async () => {
      const reqA = makeRequest({ ...VALID_BODY, phone: "03001111111" }, "4.4.4.1");
      const reqB = makeRequest({ ...VALID_BODY, phone: "03002222222" }, "4.4.4.2");

      const [resA, resB] = await Promise.all([POST(reqA), POST(reqB)]);
      const statuses = [resA.status, resB.status].sort();

      expect(statuses).toEqual([201, 409]);

      const appts = client.collections["appointments"]?._all() ?? [];
      const occupying = appts.filter(
        (a) => a.doctorId === doctorId && a.date === futureDate && a.startTime === "10:00" && a.status !== "CANCELLED"
      );
      expect(occupying.length).toBe(1);
    }
  );
});

describe("GET /api/appointments authorization", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });
});
