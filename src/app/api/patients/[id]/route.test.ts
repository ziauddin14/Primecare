import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: getSessionMock }));

const patientId = new ObjectId().toString();

vi.mock("@/lib/mongodb", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: (name: string) => ({
        findOne: async (filter: { _id?: { toString(): string } }) =>
          name === "patients" && filter?._id?.toString() === patientId
            ? { _id: new ObjectId(patientId), fullName: "Test Patient" }
            : null,
        aggregate: () => ({ toArray: async () => [] }),
      }),
    }),
  }),
}));

import { GET } from "./route";

function makeRequest() {
  return {} as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  getSessionMock.mockResolvedValue({ userId: "u1", name: "Admin", email: "admin@clinic.com", role: "ADMIN" });
});

describe("GET /api/patients/[id]", () => {
  it("rejects a malformed id with 400 instead of a raw database error", async () => {
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: "not-an-id" }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).not.toMatch(/mongo|bson/i);
  });

  it("returns 404 for a well-formed id that doesn't exist", async () => {
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: new ObjectId().toString() }) });
    expect(res.status).toBe(404);
  });

  it("returns the patient for a valid, existing id", async () => {
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: patientId }) });
    expect(res.status).toBe(200);
  });

  it("requires authentication", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: patientId }) });
    expect(res.status).toBe(401);
  });
});
