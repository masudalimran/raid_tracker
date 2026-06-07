import z from "zod";

export const rslAccountSchema = z.object({
  name: z.string().min(1, { message: "Account name is required" }),
  plarium_id: z.string().min(1, { message: "Plarium ID is required" }),
});

export type RslAccountFormData = z.infer<typeof rslAccountSchema>;
