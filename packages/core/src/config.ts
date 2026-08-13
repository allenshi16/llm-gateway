import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default("redis://localhost:16379"),
  API_KEY_PEPPER: z.string().min(32),
  CONTROL_PLANE_ADMIN_TOKEN: z.string().min(32),
  INTERNAL_ASSERTION_SECRET: z.string().min(32),
  INTERNAL_ASSERTION_ISSUER: z.string().min(1).default("gateway-edge"),
  INTERNAL_ASSERTION_AUDIENCE: z.string().min(1).default("litellm-us"),
  LITELLM_URL: z.string().url().default("http://localhost:4302"),
  LITELLM_MASTER_KEY: z.string().min(1),
  EDGE_ENABLE_DISPATCH: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  EDGE_PROVIDER_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
  CONTROL_PLANE_PORT: z.coerce.number().int().positive().default(4100),
  EDGE_PORT: z.coerce.number().int().positive().default(4000),
  WORKER_POLL_MS: z.coerce.number().int().positive().default(1000),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_METER_EVENT_NAME: z.string().min(1).default("llm_usage")
});

export type GatewayConfig = z.infer<typeof environmentSchema>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): GatewayConfig {
  const result = environmentSchema.safeParse(environment);
  if (!result.success) {
    throw new Error(`Invalid gateway configuration: ${result.error.message}`);
  }
  return result.data;
}
