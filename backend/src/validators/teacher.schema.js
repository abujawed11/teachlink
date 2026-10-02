const { z } = require("zod");

const GENDERS = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"];
const CONTACT_PREFERENCES = ["PLATFORM_ONLY", "PHONE", "WHATSAPP"];

const updateProfileSchema = z
  .object({
    headline: z.string().max(150).nullable().optional(),
    bio: z.string().max(3000).nullable().optional(),
    photoUrl: z.url().nullable().optional(),
    gender: z.enum(GENDERS).nullable().optional(),
    experienceYears: z.number().int().min(0).max(80).nullable().optional(),
    qualificationSummary: z.string().max(255).nullable().optional(),

    country: z.string().max(100).nullable().optional(),
    state: z.string().max(100).nullable().optional(),
    city: z.string().max(100).nullable().optional(),
    area: z.string().max(100).nullable().optional(),
    pincode: z.string().max(20).nullable().optional(),

    onlineAvailable: z.boolean().optional(),
    offlineAvailable: z.boolean().optional(),
    homeTuitionAvailable: z.boolean().optional(),
    studentCanVisit: z.boolean().optional(),
    groupTuitionAvailable: z.boolean().optional(),
    individualTuitionAvailable: z.boolean().optional(),
    demoClassAvailable: z.boolean().optional(),
    teachingRadiusKm: z.number().int().min(0).max(500).nullable().optional(),

    feeMin: z.number().int().min(0).nullable().optional(),
    feeMax: z.number().int().min(0).nullable().optional(),

    contactPreference: z.enum(CONTACT_PREFERENCES).optional(),
  })
  .refine(
    (data) =>
      data.feeMin == null || data.feeMax == null || data.feeMin <= data.feeMax,
    { message: "feeMin cannot be greater than feeMax", path: ["feeMin"] }
  );

module.exports = { updateProfileSchema };
