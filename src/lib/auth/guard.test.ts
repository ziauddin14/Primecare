import { describe, it, expect, vi, beforeEach } from "vitest";

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));

vi.mock("./session", () => ({
  getSession: getSessionMock,
}));

import { requireAuth, requireRole, isAuthError } from "./guard";

const adminSession = { userId: "u1", name: "Admin", email: "admin@clinic.com", role: "ADMIN" as const };
const staffSession = { userId: "u2", name: "Staff", email: "staff@clinic.com", role: "STAFF" as const };

beforeEach(() => {
  getSessionMock.mockReset();
});

describe("requireAuth", () => {
  it("returns 401 when there is no session (unauthenticated request rejected)", async () => {
    getSessionMock.mockResolvedValue(null);
    const result = await requireAuth();
    expect(isAuthError(result)).toBe(true);
    if (isAuthError(result)) {
      expect(result.error.status).toBe(401);
    }
  });

  it("returns the session when authenticated", async () => {
    getSessionMock.mockResolvedValue(adminSession);
    const result = await requireAuth();
    expect(isAuthError(result)).toBe(false);
    if (!isAuthError(result)) {
      expect(result.session.userId).toBe("u1");
    }
  });
});

describe("requireRole", () => {
  it("returns 401 when unauthenticated, before checking role", async () => {
    getSessionMock.mockResolvedValue(null);
    const result = await requireRole(["ADMIN"]);
    expect(isAuthError(result)).toBe(true);
    if (isAuthError(result)) {
      expect(result.error.status).toBe(401);
    }
  });

  it("returns 403 when authenticated but role is not permitted", async () => {
    getSessionMock.mockResolvedValue(staffSession);
    const result = await requireRole(["ADMIN"]);
    expect(isAuthError(result)).toBe(true);
    if (isAuthError(result)) {
      expect(result.error.status).toBe(403);
    }
  });

  it("succeeds when the session role is in the allowed list", async () => {
    getSessionMock.mockResolvedValue(adminSession);
    const result = await requireRole(["ADMIN", "STAFF"]);
    expect(isAuthError(result)).toBe(false);
    if (!isAuthError(result)) {
      expect(result.session.role).toBe("ADMIN");
    }
  });

  it("a role not on the allow-list is always forbidden, regardless of how many roles are permitted", async () => {
    getSessionMock.mockResolvedValue({ ...staffSession, role: "DOCTOR" });
    const result = await requireRole(["ADMIN", "STAFF"]);
    expect(isAuthError(result)).toBe(true);
    if (isAuthError(result)) {
      expect(result.error.status).toBe(403);
    }
  });
});
