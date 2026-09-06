import { describe, it, expect, vi } from "vitest";
import { createMockClient } from "@/test/mockMongo";

vi.mock("@/lib/mongodb", () => {
  const client = createMockClient();
  return { default: Promise.resolve(client) };
});

import clientPromise from "@/lib/mongodb";
import { ensureAppIndexes } from "./indexes";

describe("ensureAppIndexes", () => {
  it("creates the two partial unique indexes appointment double-booking protection depends on", async () => {
    await ensureAppIndexes();

    const client = (await clientPromise) as unknown as { db: () => { collection: (n: string) => { _all: () => unknown[] } } };
    const appointments = client.db().collection("appointments");

    // Exercise the constraint indirectly: two "active" docs for the same
    // doctor+date+time must conflict; two docs where only one is active
    // must not.
    const insertOneRaw = (client.db().collection("appointments") as unknown as { insertOne: (d: Record<string, unknown>) => Promise<unknown> }).insertOne;
    await insertOneRaw({ doctorId: "d1", date: "2026-01-01", startTime: "09:00", doctorSlotActive: true });

    await expect(
      insertOneRaw({ doctorId: "d1", date: "2026-01-01", startTime: "09:00", doctorSlotActive: true })
    ).rejects.toMatchObject({ code: 11000 });

    // A cancelled (non-active) appointment at the same slot must NOT
    // conflict, since it doesn't carry doctorSlotActive.
    await expect(
      insertOneRaw({ doctorId: "d1", date: "2026-01-01", startTime: "09:00" })
    ).resolves.toBeDefined();

    expect(appointments._all().length).toBe(2);
  });

  it("is idempotent - calling it twice does not throw or duplicate index creation errors", async () => {
    await ensureAppIndexes();
    await expect(ensureAppIndexes()).resolves.toBeUndefined();
  });
});
