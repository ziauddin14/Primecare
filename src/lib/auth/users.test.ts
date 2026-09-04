import { describe, it, expect, vi } from "vitest";
import { ObjectId } from "mongodb";

vi.mock("@/lib/mongodb", () => ({ default: Promise.resolve({}) }));

import { toSafeUser } from "./users";

describe("toSafeUser", () => {
  it("never includes the password hash in the client/session-facing shape", () => {
    const user = {
      _id: new ObjectId(),
      name: "Dr. Test",
      email: "test@clinic.com",
      passwordHash: "$2a$12$abcdefghijklmnopqrstuv",
      role: "ADMIN" as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const safe = toSafeUser(user);

    expect(safe).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(safe)).not.toContain("passwordHash");
    expect(JSON.stringify(safe)).not.toContain(user.passwordHash);
  });
});
