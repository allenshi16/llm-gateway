import { z } from "zod";
import { regionSchema } from "./internal-assertion.js";

const decimalStringSchema = z.string().regex(/^\d+(\.\d+)?$/);

export const usageEventSchema = z.object({
  version: z.literal(1),
  source: z.literal("litellm"),
  sourceEventId: z.string().min(1),
  requestId: z.string().uuid(),
  attemptId: z.string().uuid(),
  status: z.enum(["SUCCEEDED", "FAILED", "CANCELLED", "AMBIGUOUS"]),
  provider: z.string().min(1),
  providerModel: z.string().min(1),
  region: regionSchema,
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  cacheReadTokens: z.number().int().nonnegative().default(0),
  cacheWriteTokens: z.number().int().nonnegative().default(0),
  reasoningTokens: z.number().int().nonnegative().default(0),
  providerCostUsd: decimalStringSchema,
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  responseDelivered: z.boolean(),
  errorCode: z.string().nullable().default(null)
});

export type UsageEvent = z.infer<typeof usageEventSchema>;
