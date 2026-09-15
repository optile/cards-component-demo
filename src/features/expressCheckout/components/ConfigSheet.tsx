import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useExpressConfigStore } from "@/features/expressCheckout/store/expressConfigStore";
import {
  parseAllowedShippingCountries,
  RESOLVER_DELAY_RANGE,
  GATE_DELAY_RANGE,
} from "@/features/expressCheckout/constants/express";
import { useDebouncedValue } from "@/features/expressCheckout/hooks/useDebouncedValue";
import { resolveLocalMode } from "@/features/expressCheckout/utils/expressSdk";
import type { LocalModeConfig } from "@/features/embeddedCheckout/constants/checkout";
import {
  ENVS,
  WALLET_MODES,
  WALLET_VISIBILITY,
  EXPRESS_OPERATION_TYPES,
  EXPRESS_BEFORE_SUBMIT_OUTCOMES,
  LOCALES,
} from "@/features/expressCheckout/types/express";

// The demo offers a fixed pair of shipping destinations (matching the default allowlist). Kept as a
// checkbox pair rather than free text so QA can't type a malformed code; the underlying config stays a
// comma-separated ISO-alpha-2 string (the shape `buildExpressShipping` + `reinitSignatureOf` expect).
const SHIPPING_COUNTRY_OPTIONS = ["US", "CA"] as const;

export default function ConfigSheet() {
  const [open, setOpen] = useState(false);
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const config = useExpressConfigStore();

  // The resolver delay feeds `reinitSignatureOf`, so committing it on every keystroke would remount the
  // ECE (fresh LIST + Stripe re-init) per digit. Keep the field responsive off local state and only push
  // the debounced value to the store (mirrors the qty selector's `useDebouncedValue`).
  const [delayInput, setDelayInput] = useState(config.dynamicRatesDelayMs);
  const debouncedDelay = useDebouncedValue(delayInput, 400);
  useEffect(() => {
    if (debouncedDelay !== config.dynamicRatesDelayMs) {
      config.setConfig({ dynamicRatesDelayMs: debouncedDelay });
    }
  }, [debouncedDelay, config]);

  // The gate delay doesn't remount the ECE (the gate reads live config at confirm time), but the sheet
  // subscribes to the whole store, so writing on every drag step would re-render it repeatedly. Keep the
  // slider responsive off local state and push the debounced value, mirroring the resolver delay above.
  const [gateDelayInput, setGateDelayInput] = useState(config.beforeSubmitDelayMs);
  const debouncedGateDelay = useDebouncedValue(gateDelayInput, 400);
  useEffect(() => {
    if (debouncedGateDelay !== config.beforeSubmitDelayMs) {
      config.setConfig({ beforeSubmitDelayMs: debouncedGateDelay });
    }
  }, [debouncedGateDelay, config]);

  useEffect(() => {
    if (!open) return;
    const fab = fabRef.current;
    const focusables = () =>
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
    // Move focus into the dialog on open (a11y: don't leave focus on the FAB behind the overlay).
    focusables()?.[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      // Minimal focus trap: wrap Tab within the dialog so focus can't reach the page behind it.
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items || items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = priorOverflow;
      fab?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open express checkout settings"
        className="fixed bottom-4 right-4 z-[55] rounded-full w-14 h-14 shadow-lg text-white text-xl bg-black"
      >
        ⚙
      </button>
      {open &&
        createPortal(
          <div data-flow="express">
            <div
              className="fixed inset-0 z-[60] bg-black/40"
              onClick={() => setOpen(false)}
            />
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="Express checkout settings"
              tabIndex={-1}
              className="fixed top-0 right-0 bottom-0 z-[70] w-[460px] max-w-[95vw] p-5 overflow-y-auto shadow-2xl"
              style={{ background: "var(--paper)", color: "var(--ink)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-lg"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  Demo settings
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  className="text-sm underline"
                  style={{ color: "var(--ink-soft)" }}
                >
                  Close
                </button>
              </div>
              <p
                className="text-[12px] mb-4"
                style={{ color: "var(--ink-faint)" }}
              >
                Most settings remount the express element. Gate outcome and
                delay apply live.
              </p>

              <Group
                title="Session"
                description="Environment and buyer language for the LIST session."
              >
                <Field label="Environment">
                  <Select
                    value={config.env}
                    options={ENVS}
                    onChange={(v) => config.setConfig({ env: v })}
                  />
                </Field>
                <Field label="Locale">
                  <select
                    className="w-full border rounded px-2 py-1 text-sm bg-white"
                    style={{ borderColor: "var(--line)" }}
                    value={config.locale}
                    onChange={(e) =>
                      config.setConfig({ locale: e.target.value })
                    }
                  >
                    {LOCALES.map((l) => (
                      <option
                        key={l.value}
                        value={l.value}
                      >{`${l.label} (${l.value})`}</option>
                    ))}
                  </select>
                </Field>
              </Group>

              <Group
                title="Wallets & flow"
                description="Which wallets appear, how they're sourced, and what happens after a successful charge."
              >
                <Field label="walletMode">
                  <Select
                    value={config.walletMode}
                    options={WALLET_MODES}
                    onChange={(v) => config.setConfig({ walletMode: v })}
                  />
                </Field>
                <Field label="Apple Pay">
                  <Select
                    value={config.expressWallets.applePay}
                    options={WALLET_VISIBILITY}
                    onChange={(v) =>
                      config.setConfig({
                        expressWallets: {
                          ...config.expressWallets,
                          applePay: v,
                        },
                      })
                    }
                  />
                </Field>
                <Field label="Google Pay">
                  <Select
                    value={config.expressWallets.googlePay}
                    options={WALLET_VISIBILITY}
                    onChange={(v) =>
                      config.setConfig({
                        expressWallets: {
                          ...config.expressWallets,
                          googlePay: v,
                        },
                      })
                    }
                  />
                </Field>
                <Field label="operationType">
                  <Select
                    value={config.expressOperationType}
                    options={EXPRESS_OPERATION_TYPES}
                    onChange={(v) =>
                      config.setConfig({ expressOperationType: v })
                    }
                  />
                </Field>
                <label className="flex items-center gap-2 mt-4 text-sm">
                  <input
                    type="checkbox"
                    checked={config.allowRealRedirect}
                    onChange={(e) =>
                      config.setConfig({ allowRealRedirect: e.target.checked })
                    }
                  />
                  Allow real redirect on success
                </label>
              </Group>

              <Group
                title="Shipping & rates"
                description="Collect a shipping address and pick how rates are produced: a dynamic onShippingAddressChange resolver, or the static preset."
              >
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={config.shippingAddressRequired}
                    onChange={(e) =>
                      config.setConfig({
                        shippingAddressRequired: e.target.checked,
                      })
                    }
                  />
                  Collect shipping address (ECE rates)
                </label>
                {config.shippingAddressRequired && (
                  <Nested>
                    <Field label="Allowed shipping countries">
                      <div className="flex gap-4">
                        {(() => {
                          const selected = parseAllowedShippingCountries(
                            config.allowedShippingCountries,
                          );
                          return SHIPPING_COUNTRY_OPTIONS.map((code) => (
                            <label
                              key={code}
                              className="flex items-center gap-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={selected.includes(code)}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...selected, code]
                                    : selected.filter((c) => c !== code);
                                  // Re-derive from the fixed option order so the string is stable + deduped.
                                  const ordered =
                                    SHIPPING_COUNTRY_OPTIONS.filter((c) =>
                                      next.includes(c),
                                    );
                                  config.setConfig({
                                    allowedShippingCountries: ordered.join(","),
                                  });
                                }}
                              />
                              {code}
                            </label>
                          ));
                        })()}
                      </div>
                      <span
                        className="block text-[11px] mt-1"
                        style={{ color: "var(--ink-soft)" }}
                      >
                        None selected = all countries allowed
                      </span>
                    </Field>
                    <label className="flex items-center gap-2 mt-4 text-sm">
                      <input
                        type="checkbox"
                        checked={config.dynamicRates}
                        onChange={(e) =>
                          config.setConfig({ dynamicRates: e.target.checked })
                        }
                      />
                      Dynamic rates from address (onShippingAddressChange)
                    </label>
                    {config.dynamicRates && (
                      <Nested>
                        <Field label="Resolver delay">
                          <MsSlider
                            value={delayInput}
                            onChange={setDelayInput}
                            min={RESOLVER_DELAY_RANGE.min}
                            max={RESOLVER_DELAY_RANGE.max}
                            step={RESOLVER_DELAY_RANGE.step}
                            warnFrom={RESOLVER_DELAY_RANGE.warnFrom}
                            warnLabel="the payment sheet may be invalidated for a resolver running this long"
                          />
                          <span
                            className="block text-[11px] mt-1"
                            style={{ color: "var(--ink-soft)" }}
                          >
                            Artificial latency to exercise the timeout and
                            static-rate fallback. Matches the SDK&apos;s
                            resolver-timeout range (1s to 20s).
                          </span>
                        </Field>
                        <label className="flex items-center gap-2 mt-4 text-sm">
                          <input
                            type="checkbox"
                            checked={config.dynamicOnlyOmitRates}
                            onChange={(e) =>
                              config.setConfig({
                                dynamicOnlyOmitRates: e.target.checked,
                              })
                            }
                          />
                          Dynamic-only (omit static rates; failure or empty
                          then rejects the address)
                        </label>
                        <div className="mt-4">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={config.dynamicResolverProducts}
                              onChange={(e) =>
                                config.setConfig({
                                  dynamicResolverProducts: e.target.checked,
                                })
                              }
                            />
                            Resolver returns its own products cart
                          </label>
                          <span
                            className="block text-[11px] mt-1"
                            style={{ color: "var(--ink-soft)" }}
                          >
                            Resolver returns its own <code>products</code> (one
                            per cart item, summing to the frozen goods
                            subtotal). They drive both the wallet breakdown and
                            the charge cart, replacing the mount cart for that
                            destination. Turn off (with Send products on) to see
                            the mount-cart breakdown instead.
                          </span>
                        </div>
                      </Nested>
                    )}
                  </Nested>
                )}
              </Group>

              <Group
                title="Cart products"
                description="Itemize the cart for the charge body and the wallet-sheet breakdown. A resolver products cart (Shipping & rates, above) replaces this per destination."
              >
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={config.sendProducts}
                    onChange={(e) =>
                      config.setConfig({ sendProducts: e.target.checked })
                    }
                  />
                  Send cart products (charge body)
                </label>
                <span
                  className="block text-[11px] mt-1"
                  style={{ color: "var(--ink-soft)" }}
                >
                  Charge-body cart (must sum to <code>amount</code>). Also
                  powers the SDK&apos;s auto-derived wallet breakdown: one line
                  per product plus a reconciling <code>Shipping</code> line,
                  shown at sheet-open and refreshed on rate change (dynamic,
                  static, or no-shipping express).
                </span>
              </Group>

              <Group
                title="Pre-charge gate"
                description="An onBeforeSubmit hook that runs before the charge to allow, decline, or fail it. Express only; outcome and delay apply live."
              >
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={config.beforeSubmit}
                    onChange={(e) =>
                      config.setConfig({ beforeSubmit: e.target.checked })
                    }
                  />
                  Pre-charge gate (onBeforeSubmit)
                </label>
                {config.beforeSubmit && (
                  <Nested>
                    <Field label="Gate outcome">
                      <Select
                        value={config.beforeSubmitOutcome}
                        options={EXPRESS_BEFORE_SUBMIT_OUTCOMES}
                        onChange={(v) =>
                          config.setConfig({ beforeSubmitOutcome: v })
                        }
                      />
                    </Field>
                    <Field label="Gate delay">
                      <MsSlider
                        value={gateDelayInput}
                        onChange={setGateDelayInput}
                        min={GATE_DELAY_RANGE.min}
                        max={GATE_DELAY_RANGE.max}
                        step={GATE_DELAY_RANGE.step}
                        warnFrom={GATE_DELAY_RANGE.warnFrom}
                        warnLabel="the wallet may invalidate the sheet before the gate resolves"
                      />
                      <span
                        className="block text-[11px] mt-1"
                        style={{ color: "var(--ink-soft)" }}
                      >
                        Express only, no remount. decline shows a generic
                        failure; throw surfaces your reason.
                      </span>
                    </Field>
                  </Nested>
                )}
              </Group>

              <LocalDevFooter />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

// Shows whether the express element is running against local dev SDKs and which ones. Reads the SAME
// memoized `resolveLocalMode` the SDK loader used, so it reflects what's actually loaded (detected once
// at page load) rather than a fresh probe. Renders only on localhost; a no-op elsewhere.
function LocalDevFooter() {
  const [mode, setMode] = useState<LocalModeConfig | null>(null);

  useEffect(() => {
    let alive = true;
    void resolveLocalMode().then((m) => {
      if (alive) setMode(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]");
  if (!isLocalhost || !mode) return null;

  const anyLocal = mode.checkoutWebAvailable || mode.checkoutWebStripeAvailable;
  return (
    <div
      className="mt-6 pt-3 border-t text-[11px]"
      style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: anyLocal ? "#22c55e" : "#9ca3af" }}
        />
        <span className="font-medium">
          {anyLocal ? "Local dev mode: ON" : "Local dev mode: OFF (using CDN)"}
        </span>
      </div>
      <LocalServerRow
        label="checkout-web"
        port={8700}
        on={mode.checkoutWebAvailable}
      />
      <LocalServerRow
        label="checkout-web-stripe"
        port={8991}
        on={mode.checkoutWebStripeAvailable}
      />
      <div className="mt-1" style={{ color: "var(--ink-faint)" }}>
        Detected at page load. Reload to re-detect if you start a server
        afterward.
      </div>
    </div>
  );
}

function LocalServerRow({
  label,
  port,
  on,
}: Readonly<{ label: string; port: number; on: boolean }>) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ background: on ? "#22c55e" : "#ef4444" }}
      />
      <span>
        {label} (:{port}) {on ? "local" : "CDN"}
      </span>
    </div>
  );
}

// A titled settings card: groups related controls under a short description so the relationship between
// them (and against other groups) is legible at a glance. Renders as a white panel on the paper drawer.
function Group({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
}>) {
  return (
    <section
      className="mb-4 rounded-lg border p-4 shadow-sm"
      style={{ background: "var(--card)", borderColor: "var(--line)" }}
    >
      <h3
        className="text-sm font-medium"
        style={{ color: "var(--ink)", fontFamily: "var(--font-serif)" }}
      >
        {title}
      </h3>
      <p
        className="text-[11px] mt-0.5 mb-3"
        style={{ color: "var(--ink-soft)" }}
      >
        {description}
      </p>
      {children}
    </section>
  );
}

// Indents controls that only apply while a parent toggle is on, with a left rule to signal the dependency
// (e.g. resolver options nested under "Dynamic rates", which is itself nested under "Collect shipping").
function Nested({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mt-3 pl-3 border-l" style={{ borderColor: "var(--line)" }}>
      {children}
    </div>
  );
}

// Formats a millisecond latency as a compact seconds label (2000 → "2s", 1500 → "1.5s").
function msToSecondsLabel(ms: number): string {
  return `${(ms / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}s`;
}

const WARN_COLOR = "var(--warn)"; // amber-700 latency-warning token

// A bounded latency knob: range slider + a live seconds readout. Preferable to a number spinner for a
// capped, coarse-step value. Emits the numeric ms value; callers decide whether to debounce (resolver
// delay) or write straight through (gate delay, which doesn't remount). When `warnFrom` is set, the upper
// part of the track is tinted amber and the readout flips amber past that threshold, flagging a range
// where a request this slow risks the wallet invalidating the open sheet (`warnLabel` explains why).
function MsSlider({
  value,
  onChange,
  min,
  max,
  step,
  warnFrom,
  warnLabel,
}: Readonly<{
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  warnFrom?: number;
  warnLabel?: string;
}>) {
  const inWarn = warnFrom !== undefined && value >= warnFrom;
  // Width (%) of the amber warning segment on the shared 0–100% scale, so it lines up under the upper range.
  const warnPct =
    warnFrom !== undefined ? ((max - warnFrom) / (max - min)) * 100 : 0;

  return (
    <div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-valuetext={`${msToSecondsLabel(value)}${inWarn ? `, warning: ${warnLabel ?? "high latency"}` : ""}`}
          className="flex-1 h-1.5 cursor-pointer"
          style={{ accentColor: inWarn ? WARN_COLOR : "var(--accent)" }}
        />
        <span
          className="text-xs font-medium tabular-nums whitespace-nowrap w-[52px] text-right"
          style={{ color: inWarn ? WARN_COLOR : "var(--ink)" }}
        >
          {inWarn ? "⚠ " : ""}
          {msToSecondsLabel(value)}
        </span>
      </div>
      {warnFrom !== undefined && (
        <>
          <div
            className="flex h-1 mt-1 overflow-hidden rounded-full"
            style={{ marginRight: "64px" }}
            aria-hidden
          >
            <div style={{ width: `${100 - warnPct}%`, background: "var(--line)" }} />
            <div style={{ width: `${warnPct}%`, background: "var(--warn-soft)" }} />
          </div>
          <span className="block text-[10px] mt-0.5" style={{ color: WARN_COLOR }}>
            ≥ {msToSecondsLabel(warnFrom)}: {warnLabel}
          </span>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-3">
      <span
        className="block text-[12px] mb-1"
        style={{ color: "var(--ink-soft)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function Select<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <select
      className="w-full border rounded px-2 py-1 text-sm bg-white"
      style={{ borderColor: "var(--line)" }}
      value={value}
      onChange={(e) => {
        // The <select> only surfaces `options`, but guard anyway so we narrow a real DOM string into
        // the union instead of blind-casting it.
        const next = e.target.value;
        if ((options as readonly string[]).includes(next)) onChange(next as T);
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
