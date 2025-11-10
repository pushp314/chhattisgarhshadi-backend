import { z } from "zod";

const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string(),
  }),
});

export const authValidation = {
  googleLoginSchema,
};
