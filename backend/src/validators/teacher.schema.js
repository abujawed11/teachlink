const { z } = require("zod");

const GENDERS = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"];
const CONTACT_PREFERENCES = ["PLATFORM_ONLY", "PHONE", "WHATSAPP"];
const PHONE_PATTERN = /^\+?[\d\s-]{7,20}$/;

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
    contactNumber: z
      .string()
      .trim()
      .regex(PHONE_PATTERN, "Enter a valid number (7-15 digits, optional + country code)")
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      data.contactPreference == null ||
      data.contactPreference === "PLATFORM_ONLY" ||
      data.contactNumber !== null,
    { message: "A contact number is required to show your phone or WhatsApp", path: ["contactNumber"] }
  )
  .refine(
    (data) =>
      data.feeMin == null || data.feeMax == null || data.feeMin <= data.feeMax,
    { message: "feeMin cannot be greater than feeMax", path: ["feeMin"] }
  );

const DAYS_OF_WEEK = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const QUALIFICATION_TYPES = ["DEGREE", "CERTIFICATION", "OTHER"];

const idListSchema = z.object({
  ids: z.array(z.number().int().positive()).max(50),
});

const qualificationSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  institution: z.string().max(150).nullable().optional(),
  yearCompleted: z.number().int().min(1950).max(2100).nullable().optional(),
  type: z.enum(QUALIFICATION_TYPES).optional(),
});

const experienceSchema = z.object({
  institutionName: z.string().min(1, "Institution name is required").max(150),
  role: z.string().max(150).nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
});

const availabilitySchema = z.object({
  dayOfWeek: z.enum(DAYS_OF_WEEK),
  startTime: z.string().min(1).max(10),
  endTime: z.string().min(1).max(10),
});

module.exports = {
  updateProfileSchema,
  idListSchema,
  qualificationSchema,
  experienceSchema,
  availabilitySchema,
};
