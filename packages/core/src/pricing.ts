export interface PriceSnapshot {
  inputPerMillion: string;
  outputPerMillion: string;
  cacheReadPerMillion: string;
  cacheWritePerMillion: string;
  reasoningPerMillion: string;
  requestFee: string;
}

export interface UsageUnits {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  reasoningTokens?: number;
}

function decimal(value: string): bigint {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(`${whole}${fraction.padEnd(8, "0").slice(0, 8)}`);
}

export function calculateCustomerCharge(snapshot: PriceSnapshot, usage: UsageUnits): string {
  const total =
    decimal(snapshot.requestFee) * 1_000_000n +
    decimal(snapshot.inputPerMillion) * BigInt(usage.inputTokens) +
    decimal(snapshot.outputPerMillion) * BigInt(usage.outputTokens) +
    decimal(snapshot.cacheReadPerMillion) * BigInt(usage.cacheReadTokens ?? 0) +
    decimal(snapshot.cacheWritePerMillion) * BigInt(usage.cacheWriteTokens ?? 0) +
    decimal(snapshot.reasoningPerMillion) * BigInt(usage.reasoningTokens ?? 0);
  return formatMicros(total, 1_000_000n * 100_000_000n);
}

function formatMicros(value: bigint, divisor: bigint): string {
  const whole = value / divisor;
  const fraction = (value % divisor).toString().padStart(16, "0").slice(0, 8).replace(/0+$/, "");
  return fraction.length === 0 ? whole.toString() : `${whole}.${fraction}`;
}
