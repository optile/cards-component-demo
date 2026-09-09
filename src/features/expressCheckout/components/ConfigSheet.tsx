import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useExpressConfigStore } from "@/features/expressCheckout/store/expressConfigStore";
import { parseAllowedShippingCountries } from "@/features/expressCheckout/constants/express";
import { useDebouncedValue } from "@/features/expressCheckout/hooks/useDebouncedValue";
import { resolveLocalMode } from "@/features/expressCheckout/utils/expressSdk";
import type { LocalModeConfig } from "@/features/embeddedCheckout/constants/checkout";
import {
  ENVS,
  WALLET_MODES,
  WALLET_VISIBILITY,
  EXPRESS_OPERATION_TYPES,
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

  useEffect(() => {
    if (!open) return;
    const fab = fabRef.current;
    const focusables = () =>
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
            <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setOpen(false)} />
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="Express checkout settings"
              tabIndex={-1}
              className="fixed top-0 right-0 bottom-0 z-[70] w-[360px] max-w-[90vw] p-5 overflow-y-auto shadow-2xl"
              style={{ background: "var(--card)", color: "var(--ink)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg" style={{ fontFamily: "var(--font-serif)" }}>Demo settings</h2>
                <button onClick={() => setOpen(false)} className="text-sm underline" style={{ color: "var(--ink-soft)" }}>
                  Close
                </button>
              </div>
              <p className="text-[12px] mb-4" style={{ color: "var(--ink-faint)" }}>
                Changing any setting remounts the express element.
              </p>

              <Field label="Environment">
                <Select value={config.env} options={ENVS} onChange={(v) => config.setConfig({ env: v })} />
              </Field>
              <Field label="Locale">
                <select
                  className="w-full border rounded px-2 py-1 text-sm bg-white" style={{ borderColor: "var(--line)" }}
                  value={config.locale}
                  onChange={(e) => config.setConfig({ locale: e.target.value })}
                >
                  {LOCALES.map((l) => (
                    <option key={l.value} value={l.value}>{`${l.label} (${l.value})`}</option>
                  ))}
                </select>
              </Field>
              <Field label="walletMode">
                <Select value={config.walletMode} options={WALLET_MODES} onChange={(v) => config.setConfig({ walletMode: v })} />
              </Field>
              <Field label="Apple Pay">
                <Select
                  value={config.expressWallets.applePay} options={WALLET_VISIBILITY}
                  onChange={(v) => config.setConfig({ expressWallets: { ...config.expressWallets, applePay: v } })}
                />
              </Field>
              <Field label="Google Pay">
                <Select
                  value={config.expressWallets.googlePay} options={WALLET_VISIBILITY}
                  onChange={(v) => config.setConfig({ expressWallets: { ...config.expressWallets, googlePay: v } })}
                />
              </Field>
              <Field label="operationType">
                <Select value={config.expressOperationType} options={EXPRESS_OPERATION_TYPES} onChange={(v) => config.setConfig({ expressOperationType: v })} />
              </Field>
              <label className="flex items-center gap-2 mt-4 text-sm">
                <input
                  type="checkbox" checked={config.allowRealRedirect}
                  onChange={(e) => config.setConfig({ allowRealRedirect: e.target.checked })}
                />
                Allow real redirect on success
              </label>

              <label className="flex items-center gap-2 mt-4 text-sm">
                <input
                  type="checkbox" checked={config.shippingAddressRequired}
                  onChange={(e) => config.setConfig({ shippingAddressRequired: e.target.checked })}
                />
                Collect shipping address (ECE rates)
              </label>
              {config.shippingAddressRequired && (
                <Field label="Allowed shipping countries">
                  <div className="flex gap-4">
                    {(() => {
                      const selected = parseAllowedShippingCountries(config.allowedShippingCountries);
                      return SHIPPING_COUNTRY_OPTIONS.map((code) => (
                        <label key={code} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selected.includes(code)}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...selected, code]
                                : selected.filter((c) => c !== code);
                              // Re-derive from the fixed option order so the string is stable + deduped.
                              const ordered = SHIPPING_COUNTRY_OPTIONS.filter((c) => next.includes(c));
                              config.setConfig({ allowedShippingCountries: ordered.join(",") });
                            }}
                          />
                          {code}
                        </label>
                      ));
                    })()}
                  </div>
                  <span className="block text-[11px] mt-1" style={{ color: "var(--ink-soft)" }}>
                    None selected = all countries allowed
                  </span>
                </Field>
              )}
              {config.shippingAddressRequired && (
                <>
                  <label className="flex items-center gap-2 mt-4 text-sm">
                    <input
                      type="checkbox"
                      checked={config.dynamicRates}
                      onChange={(e) => config.setConfig({ dynamicRates: e.target.checked })}
                    />
                    Dynamic rates from address (onShippingAddressChange)
                  </label>
                  {config.dynamicRates && (
                    <Field label="Resolver delay (ms)">
                      <input
                        type="number"
                        min={0}
                        max={10000}
                        step={100}
                        value={delayInput}
                        onChange={(e) =>
                          setDelayInput(Math.max(0, Number(e.target.value) || 0))
                        }
                        className="w-full border rounded px-2 py-1 text-sm bg-white"
                        style={{ borderColor: "var(--line)" }}
                      />
                      <span className="block text-[11px] mt-1" style={{ color: "var(--ink-soft)" }}>
                        Artificial latency to exercise the timeout → static-rate fallback (10s SDK cap)
                      </span>
                    </Field>
                  )}
                  {config.dynamicRates && (
                    <label className="flex items-center gap-2 mt-4 text-sm">
                      <input
                        type="checkbox"
                        checked={config.dynamicOnlyOmitRates}
                        onChange={(e) => config.setConfig({ dynamicOnlyOmitRates: e.target.checked })}
                      />
                      Dynamic-only (omit static rates — resolver failure/empty rejects the address)
                    </label>
                  )}
                </>
              )}

              <label className="flex items-center gap-2 mt-4 text-sm">
                <input
                  type="checkbox" checked={config.sendProducts}
                  onChange={(e) => config.setConfig({ sendProducts: e.target.checked })}
                />
                Send cart products (charge body)
              </label>

              <LocalDevFooter />
            </div>
          </div>,
          document.body
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
      <LocalServerRow label="checkout-web" port={8700} on={mode.checkoutWebAvailable} />
      <LocalServerRow label="checkout-web-stripe" port={8991} on={mode.checkoutWebStripeAvailable} />
      <div className="mt-1" style={{ color: "var(--ink-faint)" }}>
        Detected at page load. Reload to re-detect if you start a server afterward.
      </div>
    </div>
  );
}

function LocalServerRow({ label, port, on }: Readonly<{ label: string; port: number; on: boolean }>) {
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-[12px] mb-1" style={{ color: "var(--ink-soft)" }}>{label}</span>
      {children}
    </label>
  );
}

function Select<T extends string>({ value, options, onChange }: { value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <select
      className="w-full border rounded px-2 py-1 text-sm bg-white" style={{ borderColor: "var(--line)" }}
      value={value}
      onChange={(e) => {
        // The <select> only surfaces `options`, but guard anyway so we narrow a real DOM string into
        // the union instead of blind-casting it.
        const next = e.target.value;
        if ((options as readonly string[]).includes(next)) onChange(next as T);
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}
