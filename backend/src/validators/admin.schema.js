const { z } = require("zod");

const { text, optionalInt } = require("./search.schema");

// The admin UI sends "" for "All"; treat that the same as not filtering.
const enumOrBlank = (values) =>
  z.preprocess((value) => (value === "" ? undefined : value), z.enum(values).optional());

const pagination = {
  page: optionalInt(1, 10_000).transform((value) => value ?? 1),
  pageSize: optionalInt(1, 100).transform((value) => value ?? 20),
};

const userListSchema = z.object({
  q: text,
  role: enumOrBlank(["USER", "TEACHER", "ADMIN"]),
  status: enumOrBlank(["ACTIVE", "SUSPENDED"]),
  ...pagination,
});

const teacherListSchema = z.object({
  q: text,
  visibility: enumOrBlank(["published", "draft", "hidden"]),
  ...pagination,
});

const userStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

const teacherModerationSchema = z
  .object({
    isHiddenByAdmin: z.boolean().optional(),
    isVerified: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide isHiddenByAdmin and/or isVerified",
  });

const lookupName = z.string().trim().min(1, "Name is required").max(100);

const lookupCreateSchema = z.object({
  name: lookupName,
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});

const lookupUpdateSchema = z
  .object({
    name: lookupName.optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(10_000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

module.exports = {
  userListSchema,
  teacherListSchema,
  userStatusSchema,
  teacherModerationSchema,
  lookupCreateSchema,
  lookupUpdateSchema,
};
