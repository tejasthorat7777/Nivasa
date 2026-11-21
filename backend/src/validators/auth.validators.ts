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
    totalRooms: z.coerce.number().int().min(1).optional(),
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
    if (!data.totalRooms) {
      context.addIssue({
        code: "custom",
        path: ["totalRooms"],
        message: "Required when registering a landlord",
      });
    }
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});
