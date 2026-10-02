const { z } = require("zod");

const { PHONE_PATTERN } = require("./teacher.schema");

const contactRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters so the teacher knows what you need")
    .max(1000, "Message is too long (max 1000 characters)"),
  phone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, "Enter a valid phone number, e.g. +91 98765 43210")
    .nullable()
    .optional(),
});

module.exports = { contactRequestSchema };
