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
  EXPRESS_DEFERRALS,
  EXPRESS_BEFORE_SUBMIT_OUTCOMES,
  CARD_DEFERRALS,
  DEFERRAL_LABELS,
  LOCALES,
} from "@/features/expressCheckout/types/express";

// The demo offers a fixed pair of shipping destinations (matching the default allowlist). Kept as a
// checkbox pair rather than free text so QA can't type a malformed code; the underlying config stays a
// comma-separated ISO-alpha-2 string (the shape `buildExpressShipping` + `reinitSignatureOf` expect).
const SHIPPING_COUNTRY_OPTIONS = ["US", "CA"] as const;

const SETTINGS_TABS = [
  { id: "card", label: "Card" },
  { id: "express", label: "Express" },
] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];

export default function ConfigSheet() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<SettingsTab>("express");
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const config = useExpressConfigStore();
  // Keys the debounced sliders, so a reset remounts them: a pending slider value is dropped instead of
  // being written over the defaults.
  const [resetCount, setResetCount] = useState(0);

  const resetToDefaults = () => {
    config.resetConfig();
    setResetCount((n) => n + 1);
  };

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
        aria-label="Open demo settings"
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
              aria-label="Demo settings"
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
                Most settings rebuild the checkout. Gate outcome and delay apply
                live. Settings are saved in this browser.{" "}
                <button
                  type="button"
                  onClick={resetToDefaults}
                  className="underline"
                  style={{ color: "var(--ink-soft)" }}
                >
                  Reset to defaults
                </button>
              </p>

              <Group
                title="Shared"
                description="Environment, buyer language, and where wallets appear. Applies to both the card and express elements."
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
                <Field label="walletMode">
                  <Select
                    value={config.walletMode}
                    options={WALLET_MODES}
                    onChange={(v) => config.setConfig({ walletMode: v })}
                  />
                </Field>
                {config.walletMode !== "both" && (
                  <span
                    className="block text-[11px] -mt-2"
                    style={{ color: WARN_COLOR }}
                  >
                    {config.walletMode === "express"
                      ? "⚠ express: the card form hides its Apple Pay and Google Pay tabs; wallets show only as the Express button."
                      : "⚠ inline: the SDK refuses the Express element, so there is no Express button; wallets show only in the card form."}
                  </span>
                )}
              </Group>

              <TabToggle value={tab} onChange={setTab} />

              {tab === "card" && <CardSettings />}

              {tab === "express" && (
                <>
                  <Group
                    title="Wallets & flow"
                    description="Which express wallets appear and what happens after a successful charge."
                  >
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
                    <Field label="Capture (expressDeferral)">
                      <Select
                        value={config.expressDeferral}
                        options={EXPRESS_DEFERRALS}
                        labels={DEFERRAL_LABELS}
                        onChange={(v) =>
                          config.setConfig({ expressDeferral: v })
                        }
                      />
                    </Field>
                    <span
                      className="block text-[11px] -mt-2"
                      style={{ color: "var(--ink-soft)" }}
                    >
                      Deferred authorizes now and leaves capture to the merchant.
                      It needs operationType preset; charge the preset with the
                      same deferral:{" "}
                      {`{"preselection":{"deferral":"DEFERRED"}}`}.
                    </span>
                    {config.expressOperationType === "charge" &&
                      config.expressDeferral === "DEFERRED" && (
                        <span
                          className="block text-[11px] mt-1"
                          style={{ color: WARN_COLOR }}
                        >
                          ⚠ charge + Deferred: the SDK refuses this combination,
                          so Express shows its error state and no button.
                        </span>
                      )}
                    <label className="flex items-center gap-2 mt-4 text-sm">
                      <input
                        type="checkbox"
                        checked={config.allowRealRedirect}
                        onChange={(e) =>
                          config.setConfig({
                            allowRealRedirect: e.target.checked,
                          })
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
                                        allowedShippingCountries:
                                          ordered.join(","),
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
                              config.setConfig({
                                dynamicRates: e.target.checked,
                              })
                            }
                          />
                          Dynamic rates from address (onShippingAddressChange)
                        </label>
                        {config.dynamicRates && (
                          <Nested>
                            <Field label="Resolver delay">
                              <DebouncedDelaySlider
                                key={resetCount}
                                field="dynamicRatesDelayMs"
                                range={RESOLVER_DELAY_RANGE}
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
                                Resolver returns its own <code>products</code>{" "}
                                (one per cart item) and an <code>amount</code>{" "}
                                summed from them. They drive both the wallet
                                breakdown and the charge cart, replacing the
                                mount cart for that destination. Turn off (with
                                Send products on) to see the mount-cart
                                breakdown instead.
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
                      powers the SDK&apos;s auto-derived wallet breakdown: one
                      line per product plus a reconciling <code>Shipping</code>{" "}
                      line, shown at sheet-open and refreshed on rate change
                      (dynamic, static, or no-shipping express).
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
                          <DebouncedDelaySlider
                            key={resetCount}
                            field="beforeSubmitDelayMs"
                            range={GATE_DELAY_RANGE}
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
                </>
              )}

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

// Switches the sheet between the card and express settings. The shared group above it stays visible.
function TabToggle({
  value,
  onChange,
}: Readonly<{ value: SettingsTab; onChange: (v: SettingsTab) => void }>) {
  return (
    <div
      role="group"
      aria-label="Component settings"
      className="mb-4 flex rounded-lg border p-1"
      style={{ background: "var(--card)", borderColor: "var(--line)" }}
    >
      {SETTINGS_TABS.map((t) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(t.id)}
            className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium"
            style={
              selected
                ? { background: "var(--ink)", color: "var(--paper)" }
                : { color: "var(--ink-soft)" }
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function CardSettings() {
  const cardDeferral = useExpressConfigStore((s) => s.cardDeferral);
  const setConfig = useExpressConfigStore((s) => s.setConfig);

  return (
    <Group
      title="Payment capture"
      description="When the card payment is captured. Sent as preselection.deferral on the card session created from the cart."
    >
      <Field label="Capture">
        <Select
          value={cardDeferral}
          options={CARD_DEFERRALS}
          labels={DEFERRAL_LABELS}
          onChange={(v) => setConfig({ cardDeferral: v })}
        />
      </Field>
      <span
        className="block text-[11px] -mt-2"
        style={{ color: "var(--ink-soft)" }}
      >
        Deferred authorizes now and leaves capture to the merchant. Express has
        its own capture setting.
      </span>
    </Group>
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

// A latency slider that stays responsive off local state and pushes only the debounced value to the
// store. The resolver delay feeds `reinitSignatureOf`, so committing every drag step would remount the
// ECE (fresh LIST + Stripe re-init) per step; the gate delay doesn't remount, but the sheet subscribes to
// the whole store and would re-render on every step.
function DebouncedDelaySlider({
  field,
  range,
  warnLabel,
}: Readonly<{
  field: "dynamicRatesDelayMs" | "beforeSubmitDelayMs";
  range: { min: number; max: number; step: number; warnFrom: number };
  warnLabel: string;
}>) {
  const [value, setValue] = useState(() => useExpressConfigStore.getState()[field]);
  const debounced = useDebouncedValue(value, 400);
  useEffect(() => {
    const state = useExpressConfigStore.getState();
    if (debounced !== state[field]) state.setConfig({ [field]: debounced });
  }, [debounced, field]);

  return (
    <MsSlider
      value={value}
      onChange={setValue}
      min={range.min}
      max={range.max}
      step={range.step}
      warnFrom={range.warnFrom}
      warnLabel={warnLabel}
    />
  );
}

// A bounded latency knob: range slider + a live seconds readout. Preferable to a number spinner for a
// capped, coarse-step value. Emits the numeric ms value; `DebouncedDelaySlider` debounces it before it
// reaches the store. When `warnFrom` is set, the upper
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
  labels,
  onChange,
}: {
  value: T;
  options: readonly T[];
  labels?: Readonly<Record<T, string>>;
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
          {labels?.[o] ?? o}
        </option>
      ))}
    </select>
  );
}
