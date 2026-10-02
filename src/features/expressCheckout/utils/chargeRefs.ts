import type { PlacedOrder } from "@/features/expressCheckout/store/expressCartStore";

/**
 * Charge identifiers surfaced on the express Success page for QA / e2e follow-up.
 * Sourced from the BE returnUrl query string (real redirect) or from onSubmitSuccess
 * `data.redirect.parameters` / identification fields (soft-nav).
 */
export interface ExpressChargeRefs {
  longId?: string;
  shortId?: string;
  transactionId?: string;
  reference?: string;
  amount?: string;
  currency?: string;
  interactionCode?: string;
  interactionReason?: string;
  resultCode?: string;
}

const CHARGE_REF_KEYS = [
  "longId",
  "shortId",
  "transactionId",
  "reference",
  "amount",
  "currency",
  "interactionCode",
  "interactionReason",
  "resultCode",
] as const satisfies ReadonlyArray<keyof ExpressChargeRefs>;

type ChargeRefKey = (typeof CHARGE_REF_KEYS)[number];

/** sessionStorage key for bridging a soft-nav receipt across a hard returnUrl reload. */
export const EXPRESS_SUCCESS_STASH_KEY = "pt-express-success";

export interface ExpressSuccessStash {
  order: PlacedOrder;
  chargeRefs: ExpressChargeRefs;
}

export function hasChargeRefs(refs: ExpressChargeRefs | null | undefined): boolean {
  if (!refs) return false;
  return Boolean(refs.longId?.trim() || refs.transactionId?.trim());
}

function pickTrimmed(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function fromRecord(record: Record<string, unknown>): ExpressChargeRefs {
  const out: ExpressChargeRefs = {};
  for (const key of CHARGE_REF_KEYS) {
    const value = pickTrimmed(record[key]);
    if (value) out[key] = value;
  }
  return out;
}

/** Parse returnUrl / location.search charge identifiers. */
export function parseChargeRefsFromSearch(
  search: string | URLSearchParams,
): ExpressChargeRefs {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const record: Record<string, unknown> = {};
  for (const key of CHARGE_REF_KEYS) {
    record[key] = params.get(key) ?? undefined;
  }
  return fromRecord(record);
}

function parametersToRecord(
  parameters: unknown,
): Record<string, unknown> | null {
  if (!Array.isArray(parameters)) return null;
  const record: Record<string, unknown> = {};
  for (const entry of parameters) {
    if (!entry || typeof entry !== "object") continue;
    const { name, value } = entry as { name?: unknown; value?: unknown };
    if (typeof name === "string" && name.length > 0) {
      record[name] = value;
    }
  }
  return record;
}

/**
 * Pull charge refs from an onSubmitSuccess payload.
 * Prefer `data.redirect.parameters` (same pairs that become the returnUrl query string);
 * fall back to `data.identification` when present.
 */
export function parseChargeRefsFromSubmitPayload(payload: unknown): ExpressChargeRefs {
  if (!payload || typeof payload !== "object") return {};
  const root = payload as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  const fromRedirect = parametersToRecord(
    data.redirect && typeof data.redirect === "object"
      ? (data.redirect as { parameters?: unknown }).parameters
      : undefined,
  );
  if (fromRedirect) {
    const refs = fromRecord(fromRedirect);
    if (hasChargeRefs(refs)) return refs;
  }

  const identification =
    data.identification && typeof data.identification === "object"
      ? (data.identification as Record<string, unknown>)
      : null;
  if (identification) {
    const refs = fromRecord(identification);
    if (hasChargeRefs(refs)) return refs;
  }

  return fromRecord(data);
}

/** Prefer non-empty fields from `primary`, fill gaps from `fallback`. */
export function mergeChargeRefs(
  primary: ExpressChargeRefs | null | undefined,
  fallback: ExpressChargeRefs | null | undefined,
): ExpressChargeRefs {
  const out: ExpressChargeRefs = fallback ? { ...fallback } : {};
  if (!primary) return out;
  for (const key of CHARGE_REF_KEYS) {
    const value = pickTrimmed(primary[key]);
    if (value) out[key] = value;
  }
  return out;
}

function isPlacedOrder(value: unknown): value is PlacedOrder {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.total === "number" &&
    Array.isArray(o.items)
  );
}

export function stashExpressSuccess(stash: ExpressSuccessStash): void {
  try {
    sessionStorage.setItem(EXPRESS_SUCCESS_STASH_KEY, JSON.stringify(stash));
  } catch {
    // Quota / private mode — soft-nav still has in-memory state; real redirect falls back to URL refs.
  }
}

export function takeExpressSuccessStash(): ExpressSuccessStash | null {
  try {
    const raw = sessionStorage.getItem(EXPRESS_SUCCESS_STASH_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(EXPRESS_SUCCESS_STASH_KEY);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const { order, chargeRefs } = parsed as {
      order?: unknown;
      chargeRefs?: unknown;
    };
    if (!isPlacedOrder(order)) return null;
    const refs =
      chargeRefs && typeof chargeRefs === "object"
        ? fromRecord(chargeRefs as Record<string, unknown>)
        : {};
    return { order, chargeRefs: refs };
  } catch {
    try {
      sessionStorage.removeItem(EXPRESS_SUCCESS_STASH_KEY);
    } catch {
      // ignore
    }
    return null;
  }
}

/** Stable label order for the receipt — IDs QA actually searches for first. */
export const CHARGE_REF_DISPLAY: ReadonlyArray<{ key: ChargeRefKey; label: string }> = [
  { key: "transactionId", label: "Transaction ID" },
  { key: "longId", label: "Long ID" },
  { key: "shortId", label: "Short ID" },
  { key: "reference", label: "Reference" },
  { key: "resultCode", label: "Result code" },
  { key: "interactionCode", label: "Interaction" },
  { key: "interactionReason", label: "Reason" },
];
