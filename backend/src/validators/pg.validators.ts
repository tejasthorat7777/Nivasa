import { z } from "zod";

export const createPGSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  address: z.string().min(2).max(200).trim(),
  city: z.string().min(2).max(50).trim(),
  totalRooms: z.number().int().min(1).max(100),
  facilities: z.array(z.string()).optional(),
});

export type CreatePGData = z.infer<typeof createPGSchema>;