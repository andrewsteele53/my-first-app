export const COMMISSION_PER_ACTIVE_SUBSCRIBER = 2;
export const MONTHLY_SUBSCRIPTION_AMOUNT = 14.99;

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function isActivePaidSubscription(status?: string | null) {
  return status === "active";
}
