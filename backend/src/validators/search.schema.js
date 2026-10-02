const { z } = require("zod");

const MODES = ["online", "offline", "home", "visit", "group", "individual", "demo"];
const SORTS = ["newest", "experience_desc", "fee_asc", "fee_desc"];

// Blank values (e.g. "?city=") are treated as "not provided" rather than as a filter.
const text = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((value) => value || undefined);

// "Mathematics,Physics" -> ["Mathematics", "Physics"]; a teacher matches if they have any of them.
const nameList = z
  .string()
  .max(300)
  .optional()
  .transform((value) => {
    const items = (value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length > 0 ? items.slice(0, 10) : undefined;
  });

const optionalInt = (min, max) =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number(value) : undefined))
    .pipe(z.number().int().min(min).max(max).optional());

const searchSchema = z.object({
  subject: nameList,
  grade: nameList,
  board: nameList,
  language: nameList,
  city: text,
  mode: z.enum(MODES).optional(),
  feeMax: optionalInt(0, 1_000_000),
  experienceMin: optionalInt(0, 80),
  sort: z.enum(SORTS).default("newest"),
  page: optionalInt(1, 10_000).transform((value) => value ?? 1),
  pageSize: optionalInt(1, 50).transform((value) => value ?? 12),
});

module.exports = { searchSchema, text, optionalInt };
