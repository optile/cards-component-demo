import type { RefObject } from "react";

// Mirrors the SDK's own card skeleton (brand chips row, card number, expiry/CVC) so the handoff
// from our placeholder to the drop-in's loading state is seamless.
function CardFormSkeleton() {
  return (
    <div className="card-skeleton" aria-hidden="true">
      <div className="card-skeleton__chips">
        <div className="skeleton-bar skeleton-bar--chip" />
        <div className="skeleton-bar skeleton-bar--chip" />
        <div className="skeleton-bar skeleton-bar--chip" />
        <div className="skeleton-bar skeleton-bar--chip" />
      </div>
      <div className="skeleton-bar skeleton-bar--input" />
      <div className="card-skeleton__row">
        <div className="skeleton-bar skeleton-bar--input" />
        <div className="skeleton-bar skeleton-bar--input" />
      </div>
    </div>
  );
}

interface CardSlotProps {
  slotRef: RefObject<HTMLDivElement | null>;
  status: "loading" | "ready" | "error";
  error?: string;
}

/**
 * Presentational shell for the real Payoneer card drop-in. The single `useCheckout` hook (in
 * CheckoutView) owns the CheckoutWeb instance and mounts the `cards` component into `slotRef`.
 */
export default function CardSlot({ slotRef, status, error }: Readonly<CardSlotProps>) {
  return (
    <div className="w-full">
      {/* Box reserves the settled card height so the skeleton→form handoff doesn't shift. While loading
          we also clip (`is-loading`) the Stripe iframe's transient taller-than-final reflow; once ready
          the clip is released so nothing (validation errors, taller localized layouts) is cut off. */}
      <div className={`card-slot-wrap${status === "loading" ? " is-loading" : ""}`}>
        <div ref={slotRef} className="card-slot" />
        {status === "loading" && <CardFormSkeleton />}
      </div>
      {status === "error" && <p className="slot-error">{error}</p>}
    </div>
  );
}
