type RateType = "NOMINAL" | "PERCENTAGE";
type SeasonRate = { type: RateType; value: number };

export function applySeasonRates(base: number, rates: SeasonRate[]): number {
  let price = base;
  for (const r of rates) {
    const val = Number(r.value);
    if (r.type === "NOMINAL") price = price + val;
    else price = price + price * (val / 100);
  }
  return Math.max(0, Math.round(price));
}
