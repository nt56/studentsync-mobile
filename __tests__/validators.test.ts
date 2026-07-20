import { changePasswordSchema, signUpSchema } from "@/lib/validators";

const valid = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@college.edu",
  password: "Passw0rdd",
  confirmPassword: "Passw0rdd",
  gender: "female" as const,
  dateOfBirth: "2000-01-15",
  phone: "9876543210",
  collegeId: "",
};

const field = (result: { error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.error?.issues.map((i) => i.path[0]);

describe("signUpSchema — phone", () => {
  /**
   * The server strips non-digits and THEN counts:
   *     value.replace(/\D/g, "").length >= 10 && <= 15
   *
   * The mobile guide used /^\d{10,15}$/, which rejects every formatted number the
   * server would happily accept. These cases are the regression guard.
   */
  it("accepts a formatted number with a country code, spaces and dashes", () => {
    for (const phone of [
      "+91 98765 43210",
      "+1 (555) 010-9999",
      "020-7946-0958",
      "9876543210",
    ]) {
      const result = signUpSchema.safeParse({ ...valid, phone });
      expect(result.success).toBe(true);
    }
  });

  it("rejects fewer than 10 digits", () => {
    const result = signUpSchema.safeParse({ ...valid, phone: "12345" });
    expect(result.success).toBe(false);
    expect(field(result)).toContain("phone");
  });

  it("rejects more than 15 digits", () => {
    const result = signUpSchema.safeParse({
      ...valid,
      phone: "1234567890123456",
    });
    expect(result.success).toBe(false);
  });

  it("requires a phone number", () => {
    const result = signUpSchema.safeParse({ ...valid, phone: "" });
    expect(result.success).toBe(false);
  });
});

describe("signUpSchema — password", () => {
  it("accepts 8+ chars with upper, lower and a digit", () => {
    expect(
      signUpSchema.safeParse({
        ...valid,
        password: "Passw0rdd",
        confirmPassword: "Passw0rdd",
      }).success,
    ).toBe(true);
  });

  it("does NOT require a symbol (the server doesn't)", () => {
    expect(
      signUpSchema.safeParse({
        ...valid,
        password: "Abcdefg1",
        confirmPassword: "Abcdefg1",
      }).success,
    ).toBe(true);
  });

  it.each([
    ["too short", "Ab1cdef"],
    ["no uppercase", "passw0rdd"],
    ["no lowercase", "PASSW0RDD"],
    ["no digit", "Passworddd"],
  ])("rejects a password with %s", (_label, password) => {
    const result = signUpSchema.safeParse({
      ...valid,
      password,
      confirmPassword: password,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a mismatched confirmation, flagged on confirmPassword", () => {
    const result = signUpSchema.safeParse({
      ...valid,
      confirmPassword: "Different1",
    });
    expect(result.success).toBe(false);
    expect(field(result)).toContain("confirmPassword");
  });
});

describe("signUpSchema — age", () => {
  const yearsAgo = (n: number) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - n);
    return d.toISOString().slice(0, 10);
  };

  it("accepts someone at least 16", () => {
    expect(
      signUpSchema.safeParse({ ...valid, dateOfBirth: yearsAgo(16) }).success,
    ).toBe(true);
  });

  it("rejects someone under 16 (the server does too)", () => {
    const result = signUpSchema.safeParse({
      ...valid,
      dateOfBirth: yearsAgo(15),
    });
    expect(result.success).toBe(false);
    expect(field(result)).toContain("dateOfBirth");
  });
});

describe("changePasswordSchema", () => {
  it("rejects reusing the current password (the server does too)", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "Passw0rdd",
      newPassword: "Passw0rdd",
      confirmPassword: "Passw0rdd",
    });
    expect(result.success).toBe(false);
    expect(field(result)).toContain("newPassword");
  });

  it("accepts a genuinely new password", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "Passw0rdd",
        newPassword: "Newpass1word",
        confirmPassword: "Newpass1word",
      }).success,
    ).toBe(true);
  });
});
