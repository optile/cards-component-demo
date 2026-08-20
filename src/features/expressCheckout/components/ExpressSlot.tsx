import type { RefObject } from "react";

// Stands in for the wallet button during the brief pre-mount phase (session + SDK load), so there's
// no empty flash before the Express Checkout Element attaches.
function ExpressSkeleton() {
  return (
    <div className="express-skeleton" aria-hidden="true">
      <div className="skeleton-bar skeleton-bar--wallet" />
    </div>
  );
}

interface ExpressSlotProps {
  slotRef: RefObject<HTMLDivElement | null>;
  status: "loading" | "ready" | "error";
  error?: string;
}

/**
 * Presentational shell for the real Express Checkout Element. The single `useCheckout` hook (in
 * CheckoutView) owns the CheckoutWeb instance and mounts the element into `slotRef`; here we only
 * render the mount node, a pre-mount skeleton, and any error. We display the element as soon as it
 * mounts and let the SDK / Stripe manage wallet detection and the element's own visibility.
 */
export default function ExpressSlot({ slotRef, status, error }: Readonly<ExpressSlotProps>) {
  return (
    <div className="express-wrap">
      {status === "loading" && <ExpressSkeleton />}
      <div ref={slotRef} className="express-slot" />
      {status === "error" && <p className="slot-error">{error}</p>}
    </div>
  );
}
