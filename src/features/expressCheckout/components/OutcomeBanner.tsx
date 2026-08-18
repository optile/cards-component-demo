import { useExpressCheckoutStore } from "@/features/expressCheckout/store/expressCheckoutStore";

export default function OutcomeBanner() {
  const outcome = useExpressCheckoutStore((s) => s.lastOutcome);
  const clear = useExpressCheckoutStore((s) => s.setOutcome);
  if (!outcome) return null;

  const isSuccess = outcome.kind === "success";
  return (
    <div
      role="status"
      className="rounded-lg p-4 mb-4 flex items-start justify-between gap-3"
      style={{ background: isSuccess ? "rgba(110,127,91,0.12)" : "rgba(142,59,92,0.10)", color: "var(--ink)" }}
    >
      <span className="text-sm">
        {isSuccess ? "Order confirmed — you're all set. Happy reading." : "Payment declined. Your cart is still saved; give it another try."}
      </span>
      <button onClick={() => clear(null)} className="text-xs underline" style={{ color: "var(--ink-soft)" }}>
        Dismiss
      </button>
    </div>
  );
}
