import type { PlacedOrder } from "@/features/expressCheckout/store/expressCartStore";

/**
 * Charge or preset identifiers surfaced on the express Success page for QA / e2e follow-up.
 * Sourced from the BE returnUrl query string (real redirect) or from onSubmitSuccess
 * `data.redirect.parameters` / identification fields / `data.links.self` (soft-nav). `operationType`
 * and `presetId` only come from the payload: a returnUrl must not be able to relabel a receipt.
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
  /** `CHARGE` | `PRESET` from the onSubmitSuccess payload; `PRESET` means no money moved yet. */
  operationType?: string;
  /** Last path segment of the preset's `data.links.self`; the merchant server completes the preset by it. */
  presetId?: string;
}

const URL_REF_KEYS = [
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

const CHARGE_REF_KEYS = [
  ...URL_REF_KEYS,
  "operationType",
  "presetId",
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

const ID_KEYS = ["longId", "transactionId"] as const satisfies ReadonlyArray<ChargeRefKey>;

/**
 * False when the stash and the returnUrl both carry an id and they differ, i.e. the stash belongs
 * to another attempt and must not decorate this receipt.
 */
export function stashMatchesUrlRefs(
  stashRefs: ExpressChargeRefs,
  urlRefs: ExpressChargeRefs,
): boolean {
  return ID_KEYS.every(
    (key) => !urlRefs[key] || !stashRefs[key] || stashRefs[key] === urlRefs[key],
  );
}

/** True when the SDK will navigate away for this payload if the callback allows it (a `GET` `redirect.url`). */
export function hasFollowableRedirect(payload: unknown): boolean {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  const data =
    root?.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root;
  const redirect =
    data?.redirect && typeof data.redirect === "object"
      ? (data.redirect as { url?: unknown; method?: unknown })
      : null;
  return Boolean(pickTrimmed(redirect?.url)) && redirect?.method === "GET";
}

function lastPathSegment(value: unknown): string | undefined {
  const link = pickTrimmed(value);
  if (!link) return undefined;
  try {
    return pickTrimmed(new URL(link, "https://placeholder.invalid").pathname.split("/").pop());
  } catch {
    return undefined;
  }
}

function pickTrimmed(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function fromRecord(
  record: Record<string, unknown>,
  keys: ReadonlyArray<ChargeRefKey> = CHARGE_REF_KEYS,
): ExpressChargeRefs {
  const out: ExpressChargeRefs = {};
  for (const key of keys) {
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
  for (const key of URL_REF_KEYS) {
    record[key] = params.get(key) ?? undefined;
  }
  return fromRecord(record, URL_REF_KEYS);
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
  const refs = parseChargeRefsFromSubmitData(data);
  const operationType = pickTrimmed(root.operationType);
  const presetId =
    operationType === "PRESET" && data.links && typeof data.links === "object"
      ? lastPathSegment((data.links as { self?: unknown }).self)
      : undefined;
  return {
    ...refs,
    ...(operationType ? { operationType } : {}),
    ...(presetId ? { presetId } : {}),
  };
}

function parseChargeRefsFromSubmitData(data: Record<string, unknown>): ExpressChargeRefs {
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

/** A stash older than this belongs to a redirect that never happened and must not decorate a receipt. */
const STASH_MAX_AGE_MS = 5 * 60 * 1000;

export function stashExpressSuccess(stash: ExpressSuccessStash): void {
  try {
    sessionStorage.setItem(
      EXPRESS_SUCCESS_STASH_KEY,
      JSON.stringify({ ...stash, savedAt: Date.now() }),
    );
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
    const { order, chargeRefs, savedAt } = parsed as {
      order?: unknown;
      chargeRefs?: unknown;
      savedAt?: unknown;
    };
    if (typeof savedAt !== "number" || Date.now() - savedAt > STASH_MAX_AGE_MS) return null;
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
  { key: "operationType", label: "Operation" },
  { key: "presetId", label: "Preset ID" },
];

export function hasDisplayableChargeRefs(refs: ExpressChargeRefs): boolean {
  return CHARGE_REF_DISPLAY.some(({ key }) => Boolean(refs[key]));
}
