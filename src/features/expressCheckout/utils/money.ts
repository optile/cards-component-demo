/** USD-only demo: major units ↔ integer cents. */
export function toCents(major: number): number {
  return Math.round(major * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}
