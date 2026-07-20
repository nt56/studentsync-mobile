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

/**
 * GET /api/registrations nests an event subset carrying the STORED status and no
 * registrationDeadline. Without the deadline you can't distinguish closed from
 * upcoming, so we only correct the case that actually goes stale in the UI: a
 * past event still claiming to be upcoming.
 */
describe("reconcileStoredStatus", () => {
  it("overrides a stale 'upcoming' on an event that has already happened", () => {
    expect(
      reconcileStoredStatus({ date: daysFromNow(-2), status: "upcoming" }),
    ).toBe("completed");
  });

  it("overrides a stale 'closed' on an event that has already happened", () => {
    expect(
      reconcileStoredStatus({ date: daysFromNow(-2), status: "closed" }),
    ).toBe("completed");
  });

  it("trusts the stored status for an event still in the future", () => {
    expect(
      reconcileStoredStatus({ date: daysFromNow(2), status: "closed" }),
    ).toBe("closed");
    expect(
      reconcileStoredStatus({ date: daysFromNow(2), status: "upcoming" }),
    ).toBe("upcoming");
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
