import { query } from "@gateway/database";

export interface PlanPriceConfigInput {
  planId: string;
  stripePriceId?: string;
  unitAmountCents?: number;
  active?: boolean;
}

export async function setPlanConfig(input: PlanPriceConfigInput): Promise<{ id: string; stripe_price_id: string | null; unit_amount: number; active: boolean }> {
  const result = await query<{ id: string; stripe_price_id: string | null; unit_amount: number; active: boolean }>(
    `UPDATE billing_plans SET
       stripe_price_id = COALESCE($2, stripe_price_id),
       unit_amount = COALESCE($3, unit_amount),
       active = COALESCE($4, active)
     WHERE id=$1 RETURNING id, stripe_price_id, unit_amount::int, active`,
    [input.planId, input.stripePriceId ?? null, input.unitAmountCents ?? null, input.active ?? null]
  );
  const row = result.rows[0];
  if (!row) throw new Error("Plan not found");
  return row;
}

export async function listPlans(): Promise<{ id: string; name: string; currency: string; unit_amount: number; billing_interval: string; stripe_price_id: string | null; active: boolean; description: string | null }[]> {
  const result = await query(`SELECT id, name, currency, unit_amount::int, billing_interval, stripe_price_id, active, description FROM billing_plans ORDER BY unit_amount`, []);
  return result.rows as { id: string; name: string; currency: string; unit_amount: number; billing_interval: string; stripe_price_id: string | null; active: boolean; description: string | null }[];
}