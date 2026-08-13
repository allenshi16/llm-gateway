import { database, query } from "@gateway/database";
import { setPlanConfig } from "@gateway/core";
import { createStripeClient } from "@gateway/core";

async function run(): Promise<void> {
  const args = new Map<string, string>();
  for (const arg of process.argv.slice(2)) {
    const [key, ...rest] = arg.split("=");
    if (key) args.set(key, rest.join("="));
  }
  const command = args.get("command") ?? "list";
  const planId = args.get("plan-id");
  const priceId = args.get("price-id");
  const amountCents = args.get("amount-cents");
  const active = args.get("active");

  if (command === "list") {
    const result = await query(`SELECT id, name, currency, unit_amount::int, billing_interval, stripe_price_id, active FROM billing_plans ORDER BY unit_amount`, []);
    for (const row of result.rows) {
      console.log(`${row.id}\t${row.name}\t${(row.unit_amount as number) / 100} ${row.currency}/${row.billing_interval}\tstripe_price_id=${row.stripe_price_id ?? "(unset)"}\tactive=${row.active}`);
    }
    return;
  }

  if (command === "set" && planId) {
    await setPlanConfig({ planId, ...(priceId ? { stripePriceId: priceId } : {}), ...(amountCents ? { unitAmountCents: Number(amountCents) } : {}), ...(active ? { active: active === "true" } : {}) });
    console.log(`Updated plan ${planId}`);
    return;
  }

  if (command === "create-price" && planId && args.get("amount") && args.get("interval")) {
    const secretKey = process.env["STRIPE_SECRET_KEY"];
    if (!secretKey) throw new Error("STRIPE_SECRET_KEY is required to create a Stripe Price");
    const plan = await query<{ name: string; currency: string }>(`SELECT name, currency FROM billing_plans WHERE id=$1`, [planId]);
    if (!plan.rows[0]) throw new Error("Plan not found");
    const stripe = createStripeClient({ secretKey });
    const price = await stripe.prices.create({ currency: plan.rows[0].currency, unit_amount: Number(args.get("amount")), recurring: { interval: args.get("interval") as "month" | "year" | "week" | "day" }, product_data: { name: plan.rows[0].name } });
    await setPlanConfig({ planId, stripePriceId: price.id });
    console.log(`Created price ${price.id} for plan ${planId}`);
    return;
  }

  console.log("Usage:");
  console.log("  bun run plans:list");
  console.log("  bun run plans:config -- command=set plan-id=<id> price-id=<price_...>");
  console.log("  bun run plans:config -- command=create-price plan-id=<id> amount=<cents> interval=month");
}

await run();
await database.end();