import {
  canRegister,
  computeEventStatus,
  reconcileStoredStatus,
} from "@/lib/event-status";

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY).toISOString();

/** Mirrors the backend's computeEventStatus (student-sync/types/event.ts). */
describe("computeEventStatus", () => {
  it("is upcoming while both the date and the deadline are ahead", () => {
    expect(
      computeEventStatus({
        date: daysFromNow(10),
        registrationDeadline: daysFromNow(5),
      }),
    ).toBe("upcoming");
  });

  it("is closed once the deadline has passed but the event hasn't happened", () => {
    expect(
      computeEventStatus({
        date: daysFromNow(3),
        registrationDeadline: daysFromNow(-1),
      }),
    ).toBe("closed");
  });

  it("is completed once the date has passed", () => {
    expect(
      computeEventStatus({
        date: daysFromNow(-1),
        registrationDeadline: daysFromNow(-5),
      }),
    ).toBe("completed");
  });
});

describe("reconcileStoredStatus", () => {
  it("trusts server status when the registration summary omits the end time", () => {
    expect(
      reconcileStoredStatus({ date: daysFromNow(-2), status: "closed" }),
    ).toBe("closed");
    expect(
      reconcileStoredStatus({ date: daysFromNow(-2), status: "completed" }),
    ).toBe("completed");
  });
  it("keeps an ongoing multi-day event closed until its actual end", () => {
    expect(
      reconcileStoredStatus({
        date: daysFromNow(-2),
        endDate: daysFromNow(1),
        status: "upcoming",
      }),
    ).toBe("closed");
  });
  it("uses the end time when full event details are available", () => {
    expect(
      reconcileStoredStatus({
        date: daysFromNow(-3),
        endDate: daysFromNow(-1),
        status: "upcoming",
      }),
    ).toBe("completed");
  });
});

/** Mirrors the guards in POST /api/registrations. */
describe("canRegister", () => {
  const base = {
    status: "upcoming" as const,
    registrationDeadline: daysFromNow(5),
    capacity: 10,
    registrationCount: 3,
  };

  it("allows joining an upcoming event with room and an open deadline", () => {
    expect(canRegister(base)).toBe(true);
  });

  it("blocks a full event", () => {
    expect(canRegister({ ...base, registrationCount: 10 })).toBe(false);
    expect(canRegister({ ...base, registrationCount: 11 })).toBe(false);
  });

  it("blocks once the deadline has passed", () => {
    expect(
      canRegister({ ...base, registrationDeadline: daysFromNow(-1) }),
    ).toBe(false);
  });

  it("blocks anything that isn't upcoming", () => {
    expect(canRegister({ ...base, status: "closed" })).toBe(false);
    expect(canRegister({ ...base, status: "completed" })).toBe(false);
  });

  it("treats a missing registrationCount as zero", () => {
    expect(canRegister({ ...base, registrationCount: undefined })).toBe(true);
  });
});
