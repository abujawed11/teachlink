import { describe, expect, it } from "vitest";

import { computeProfileStrength, getStrengthMessage, validateStep } from "./validation";

function baseProfile(overrides = {}) {
  return {
    headline: null,
    bio: null,
    photoUrl: null,
    qualificationSummary: null,
    experienceYears: null,
    subjects: [],
    grades: [],
    city: null,
    area: null,
    feeMin: null,
    feeMax: null,
    onlineAvailable: false,
    offlineAvailable: false,
    homeTuitionAvailable: false,
    contactPreference: "PLATFORM_ONLY",
    contactNumber: null,
    ...overrides,
  };
}

describe("validateStep", () => {
  it("step 1 requires a headline", () => {
    expect(validateStep(1, baseProfile())).toHaveProperty("headline");
    expect(validateStep(1, baseProfile({ headline: "Math Tutor" }))).toEqual({});
  });

  it("step 1 rejects a whitespace-only headline", () => {
    expect(validateStep(1, baseProfile({ headline: "   " }))).toHaveProperty("headline");
  });

  it("step 3 requires at least one subject and one grade", () => {
    const errors = validateStep(3, baseProfile());
    expect(errors).toHaveProperty("subjects");
    expect(errors).toHaveProperty("grades");
  });

  it("step 3 passes once subjects and grades are both selected", () => {
    const errors = validateStep(
      3,
      baseProfile({ subjects: [{ id: 1, name: "Math" }], grades: [{ id: 1, name: "Class 10" }] })
    );
    expect(errors).toEqual({});
  });

  it("step 4 requires at least one teaching mode", () => {
    expect(validateStep(4, baseProfile())).toHaveProperty("teachingModes");
    expect(validateStep(4, baseProfile({ onlineAvailable: true }))).not.toHaveProperty(
      "teachingModes"
    );
  });

  it("step 4 rejects feeMin greater than feeMax", () => {
    const errors = validateStep(
      4,
      baseProfile({ onlineAvailable: true, feeMin: 2000, feeMax: 500 })
    );
    expect(errors).toHaveProperty("feeMin");
  });

  it("step 4 allows feeMin equal to feeMax", () => {
    const errors = validateStep(
      4,
      baseProfile({ onlineAvailable: true, feeMin: 500, feeMax: 500 })
    );
    expect(errors).not.toHaveProperty("feeMin");
  });

  it("step 4 requires a contact number when a non-platform preference is chosen", () => {
    const errors = validateStep(
      4,
      baseProfile({ onlineAvailable: true, contactPreference: "PHONE" })
    );
    expect(errors).toHaveProperty("contactNumber");
  });

  it("step 4 rejects a malformed contact number", () => {
    const errors = validateStep(
      4,
      baseProfile({ onlineAvailable: true, contactPreference: "PHONE", contactNumber: "abc" })
    );
    expect(errors).toHaveProperty("contactNumber");
  });

  it("step 4 accepts a valid contact number", () => {
    const errors = validateStep(
      4,
      baseProfile({
        onlineAvailable: true,
        contactPreference: "WHATSAPP",
        contactNumber: "+91 98765 43210",
      })
    );
    expect(errors).not.toHaveProperty("contactNumber");
  });

  it("step 4 does not require a contact number when preference is platform-only", () => {
    const errors = validateStep(4, baseProfile({ onlineAvailable: true }));
    expect(errors).not.toHaveProperty("contactNumber");
  });

  it("step 5 requires a city", () => {
    expect(validateStep(5, baseProfile())).toHaveProperty("city");
    expect(validateStep(5, baseProfile({ city: "Bokaro" }))).toEqual({});
  });

  it("steps with no rules (2, 6, 7) always pass", () => {
    expect(validateStep(2, baseProfile())).toEqual({});
    expect(validateStep(6, baseProfile())).toEqual({});
    expect(validateStep(7, baseProfile())).toEqual({});
  });
});

describe("computeProfileStrength", () => {
  it("returns 0 for a completely empty profile", () => {
    expect(computeProfileStrength(baseProfile())).toBe(0);
  });

  it("returns 100 when every check passes", () => {
    const full = baseProfile({
      headline: "Math Tutor",
      bio: "I teach math",
      photoUrl: "https://example.com/p.jpg",
      qualificationSummary: "B.Ed.",
      experienceYears: 5,
      subjects: [{ id: 1, name: "Math" }],
      grades: [{ id: 1, name: "Class 10" }],
      city: "Bokaro",
      area: "Sector 4",
      feeMin: 500,
      feeMax: 1000,
      onlineAvailable: true,
    });
    expect(computeProfileStrength(full)).toBe(100);
  });

  it("returns a value proportional to how many checks pass", () => {
    const half = baseProfile({
      headline: "Math Tutor",
      bio: "I teach math",
      photoUrl: "https://example.com/p.jpg",
      qualificationSummary: "B.Ed.",
      experienceYears: 5,
      onlineAvailable: true,
    });
    const strength = computeProfileStrength(half);
    expect(strength).toBeGreaterThan(0);
    expect(strength).toBeLessThan(100);
  });
});

describe("getStrengthMessage", () => {
  it("returns the right message for each band", () => {
    expect(getStrengthMessage(0)).toMatch(/build your profile/i);
    expect(getStrengthMessage(39)).toMatch(/build your profile/i);
    expect(getStrengthMessage(40)).toMatch(/good start/i);
    expect(getStrengthMessage(74)).toMatch(/good start/i);
    expect(getStrengthMessage(75)).toMatch(/almost there/i);
    expect(getStrengthMessage(99)).toMatch(/almost there/i);
    expect(getStrengthMessage(100)).toMatch(/shining/i);
  });
});
