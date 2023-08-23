import { z } from "zod";
import {
  forgotPasswordBodySchema,
  refreshTokenResponseSchema,
  refreshTokenSchema,
  registerResponseSchema,
} from "../../pg-engine/schema";

export type AuthHeaders = { authorization?: string };

export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;

export type RegisterResponse = z.infer<typeof registerResponseSchema>;

export type RefreshTokenRequestBody = z.infer<typeof refreshTokenSchema>;

export type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>;
