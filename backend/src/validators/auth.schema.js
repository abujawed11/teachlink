const { z } = require("zod");

const usernameField = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores"
  );

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    username: usernameField,
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters").max(100),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

module.exports = { registerSchema, loginSchema };
