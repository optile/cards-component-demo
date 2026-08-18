import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useExpressConfigStore } from "@/features/expressCheckout/store/expressConfigStore";
import {
  WALLET_MODES,
  WALLET_VISIBILITY,
  EXPRESS_OPERATION_TYPES,
  type WalletVisibility,
} from "@/features/expressCheckout/types/express";

const ENVS = ["checkout.integration", "sandbox"] as const;

export default function ConfigSheet() {
  const [open, setOpen] = useState(false);
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const config = useExpressConfigStore();

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
        className="fixed bottom-4 right-4 z-[55] rounded-full w-14 h-14 shadow-lg text-white text-xl"
        style={{ background: "var(--accent)" }}
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
              <Field label="clientId">
                <input
                  className="w-full border rounded px-2 py-1 text-sm" style={{ borderColor: "var(--line)" }}
                  value={config.clientId} onChange={(e) => config.setConfig({ clientId: e.target.value })}
                  placeholder="v1.opt-div-app…"
                />
              </Field>
              <Field label="Country">
                <input
                  className="w-full border rounded px-2 py-1 text-sm" style={{ borderColor: "var(--line)" }}
                  value={config.country} onChange={(e) => config.setConfig({ country: e.target.value.toUpperCase() })}
                />
              </Field>
              <Field label="Locale">
                <input
                  className="w-full border rounded px-2 py-1 text-sm" style={{ borderColor: "var(--line)" }}
                  value={config.locale} onChange={(e) => config.setConfig({ locale: e.target.value })}
                />
              </Field>
              <Field label="walletMode">
                <Select value={config.walletMode} options={WALLET_MODES} onChange={(v) => config.setConfig({ walletMode: v })} />
              </Field>
              <Field label="Apple Pay">
                <Select
                  value={config.expressWallets.applePay} options={WALLET_VISIBILITY}
                  onChange={(v) => config.setConfig({ expressWallets: { ...config.expressWallets, applePay: v as WalletVisibility } })}
                />
              </Field>
              <Field label="Google Pay">
                <Select
                  value={config.expressWallets.googlePay} options={WALLET_VISIBILITY}
                  onChange={(v) => config.setConfig({ expressWallets: { ...config.expressWallets, googlePay: v as WalletVisibility } })}
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
            </div>
          </div>,
          document.body
        )}
    </>
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
      value={value} onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}
