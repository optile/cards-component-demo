import { useRef } from "react";
import { useExpressCheckout } from "@/features/expressCheckout/hooks/useExpressCheckout";
import { useExpressConfigStore } from "@/features/expressCheckout/store/expressConfigStore";

export default function ExpressSlot() {
  const slotRef = useRef<HTMLDivElement | null>(null);
  const { status, error, available } = useExpressCheckout(slotRef);
  const clientId = useExpressConfigStore((s) => s.clientId);

  return (
    <div className="w-full">
      <div ref={slotRef} className="express-slot" data-available={available ? "true" : "false"} />
      {status === "error" && (
        <p className="text-sm" style={{ color: "#8e3b5c" }}>
          {error}
        </p>
      )}
      {status === "ready" && !available && (
        <p className="text-[13px] leading-snug" style={{ color: "var(--ink-faint)" }}>
          {clientId
            ? "Wallets appear here on a supported device. They need HTTPS; Apple Pay also needs a registered domain — see the README."
            : "Set a clientId in the config sheet to load express checkout."}
        </p>
      )}
    </div>
  );
}
