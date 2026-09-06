import { describe, it, expect } from "vitest";
import { isActiveStatus, computeSlotFlags, slotFlagUpdate } from "./slotFlags";

describe("isActiveStatus", () => {
  it("treats REQUESTED/CONFIRMED/COMPLETED as active", () => {
    expect(isActiveStatus("REQUESTED")).toBe(true);
    expect(isActiveStatus("CONFIRMED")).toBe(true);
    expect(isActiveStatus("COMPLETED")).toBe(true);
  });

  it("treats CANCELLED/NO_SHOW as inactive", () => {
    expect(isActiveStatus("CANCELLED")).toBe(false);
    expect(isActiveStatus("NO_SHOW")).toBe(false);
  });
});

describe("computeSlotFlags", () => {
  it("sets both flags when a doctor is assigned and status is active", () => {
    const flags = computeSlotFlags("doctor123", "CONFIRMED");
    expect(flags.doctorSlotActive).toBe(true);
    expect(flags.patientSlotActive).toBe(true);
  });

  it("only sets patientSlotActive when no doctor is assigned (any-specialist booking)", () => {
    const flags = computeSlotFlags(null, "REQUESTED");
    expect(flags.doctorSlotActive).toBeUndefined();
    expect(flags.patientSlotActive).toBe(true);
  });

  it("sets neither flag once cancelled, even with a doctor assigned", () => {
    const flags = computeSlotFlags("doctor123", "CANCELLED");
    expect(flags.doctorSlotActive).toBeUndefined();
    expect(flags.patientSlotActive).toBeUndefined();
  });

  it("sets neither flag for a no-show", () => {
    const flags = computeSlotFlags("doctor123", "NO_SHOW");
    expect(flags.doctorSlotActive).toBeUndefined();
    expect(flags.patientSlotActive).toBeUndefined();
  });
});

describe("slotFlagUpdate", () => {
  it("produces a $set for an active doctor-assigned appointment", () => {
    const { set, unset } = slotFlagUpdate("doctor123", "CONFIRMED");
    expect(set).toEqual({ doctorSlotActive: true, patientSlotActive: true });
    expect(unset).toEqual({});
  });

  it("produces an $unset for both flags once cancelled", () => {
    const { set, unset } = slotFlagUpdate("doctor123", "CANCELLED");
    expect(set).toEqual({});
    expect(unset).toEqual({ doctorSlotActive: "", patientSlotActive: "" });
  });

  it("only unsets doctorSlotActive when there's no doctor, even while active", () => {
    const { set, unset } = slotFlagUpdate(null, "REQUESTED");
    expect(set).toEqual({ patientSlotActive: true });
    expect(unset).toEqual({ doctorSlotActive: "" });
  });
});
