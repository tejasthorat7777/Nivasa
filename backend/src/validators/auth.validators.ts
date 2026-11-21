import { z } from "zod";

const emailSchema = z.string().email().trim().toLowerCase();
const passwordSchema = z.string().min(8);

export const signupSchema = z
  .object({
    name: z.string().min(1).trim(),
    email: emailSchema,
    phone: z.string().min(7).trim(),
    password: passwordSchema,
    pgName: z.string().min(2).trim().optional(),
    pgAddress: z.string().min(2).trim().optional(),
    city: z.string().min(2).trim().optional(),
    pgInvitationCode: z.string().min(1).trim().optional(),
    collegeName: z.string().trim().optional(),
  })
  .superRefine((data, context) => {
    if (data.pgInvitationCode) {
      return;
    }

    for (const field of ["pgName", "pgAddress", "city"] as const) {
      if (!data[field]) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: "Required when registering a landlord",
        });
      }
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email or mobile number is required"),
  password: z.string().min(1),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(50).optional(),
    email: emailSchema.optional(),
    phone: z.string().trim().min(7).max(15).optional(),
    address: z.string().trim().max(200).optional(),
  })
  .strict()
  .refine((profile) => Object.keys(profile).length > 0, {
    message: "At least one profile field must be provided",
  });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});
