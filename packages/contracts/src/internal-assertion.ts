import { z } from "zod";

export const regionSchema = z.enum(["US", "EU", "APAC"]);
export type Region = z.infer<typeof regionSchema>;

export const internalAssertionSchema = z.object({
  version: z.literal(1),
  requestId: z.string().uuid(),
  organizationId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  apiKeyId: z.string().uuid(),
  modelProductId: z.string().uuid(),
  modelAlias: z.string().min(1),
  priceVersionId: z.string().uuid(),
  allowedProviders: z.array(z.string().min(1)).min(1),
  allowedRegion: regionSchema,
  bodyDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  retentionMode: z.enum(["ZERO", "STANDARD"]),
  allowCrossRegionFallback: z.boolean()
});

export type InternalAssertion = z.infer<typeof internalAssertionSchema>;
