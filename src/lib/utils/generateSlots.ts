import { DoctorSchedule } from "../models/Doctor";

/**
 * Generates available time slots for a doctor on a specific date.
 * Excludes slots during break time and ensures slots fit within startTime and endTime.
 */
export function generateSlots(schedule: DoctorSchedule): string[] {
  const slots: string[] = [];
  const { startTime, endTime, breakStart, breakEnd, slotDuration } = schedule;

  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  let current = parseTime(startTime);
  const end = parseTime(endTime);
  const breakS = breakStart ? parseTime(breakStart) : null;
  const breakE = breakEnd ? parseTime(breakEnd) : null;

  while (current + slotDuration <= end) {
    const slotStart = current;
    const slotEnd = current + slotDuration;

    // Check if slot overlaps with break
    const isDuringBreak =
      breakS !== null &&
      breakE !== null &&
      ((slotStart >= breakS && slotStart < breakE) || (slotEnd > breakS && slotEnd <= breakE));

    if (!isDuringBreak) {
      slots.push(formatTime(slotStart));
    }

    current += slotDuration;
  }

  return slots;
}
