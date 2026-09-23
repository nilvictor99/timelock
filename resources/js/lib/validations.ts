import { z } from 'zod';

export const emailSchema = z.string().trim().min(1).email();

export const passwordSchema = z.string().min(12);

export const dateRangeSchema = z.object({
    from: z.string().date(),
    to: z.string().date(),
});