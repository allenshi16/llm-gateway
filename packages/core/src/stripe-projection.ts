import Stripe from "stripe";

export interface StripeProjectionConfig {
  secretKey: string;
  apiVersion?: Stripe.LatestApiVersion;
}

export function createStripeClient(config: StripeProjectionConfig): Stripe {
  return config.apiVersion
    ? new Stripe(config.secretKey, { apiVersion: config.apiVersion })
    : new Stripe(config.secretKey);
}

export interface MeterExport {
  eventName: string;
  identifier: string;
  stripeCustomerId: string;
  value: string;
  timestamp: number;
}

export async function exportMeterEvent(stripe: Stripe, event: MeterExport): Promise<Stripe.Billing.MeterEvent> {
  return stripe.billing.meterEvents.create({
    event_name: event.eventName,
    identifier: event.identifier,
    payload: { stripe_customer_id: event.stripeCustomerId, value: event.value },
    timestamp: event.timestamp
  });
}
