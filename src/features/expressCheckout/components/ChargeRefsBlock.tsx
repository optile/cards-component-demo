import {
  CHARGE_REF_DISPLAY,
  type ExpressChargeRefs,
} from "@/features/expressCheckout/utils/chargeRefs";

export default function ChargeRefsBlock({ refs }: Readonly<{ refs: ExpressChargeRefs }>) {
  return (
    <div className="receipt-charge-refs" data-testid="charge-refs">
      <div className="receipt-charge-refs-title">Payment details</div>
      {CHARGE_REF_DISPLAY.map(({ key, label }) => {
        const value = refs[key];
        if (!value) return null;
        return (
          <div key={key} className="receipt-charge-ref">
            <span>{label}</span>
            <code data-charge-ref={key}>{value}</code>
          </div>
        );
      })}
    </div>
  );
}
