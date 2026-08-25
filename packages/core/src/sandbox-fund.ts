import { creditWalletFromPayment } from "./billing-repository.js";

const [organizationId, amountUsd, sourceEventId] = process.argv.slice(2);
if (!organizationId || !amountUsd || !sourceEventId) {
  console.error("usage: bun run packages/core/src/sandbox-fund.ts <organizationId> <amountUsd> <sourceEventId>");
  process.exit(2);
}
const result = await creditWalletFromPayment({
  organizationId,
  currency: "USD",
  amountUsd,
  sourceEventId,
  stripePaymentIntentId: sourceEventId,
  source: "SANDBOX"
});
console.log(JSON.stringify(result));
