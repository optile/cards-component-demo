import type { CardsPaymentMethodCode } from "@/features/embeddedCheckout/types/checkout";

// Payment methods whose Payment Element tab order can be overridden, keyed by the lowercased
// method name.
const ALLOWED_ORDER_CODES: Readonly<Record<string, readonly CardsPaymentMethodCode[]>> = {
    'card': ['card', 'apple_pay', 'google_pay'],
};

/**
 * Resolves the integrator-provided `payment-method-order` attribute (comma-separated codes).
 * Returns `undefined` (Stripe's own ordering) when nothing is provided, the method does not support
 * ordering, or any code is not allowed - an invalid list is rejected as a whole.
 */
export function resolvePaymentMethodOrder(methodKey: string, raw?: string): CardsPaymentMethodCode[] | undefined {
    if (!raw) {
        return undefined;
    }

    const allowed = ALLOWED_ORDER_CODES[methodKey.toLowerCase()];
    if (!allowed) {
        console.warn(`paymentMethodOrder is not supported for ${methodKey}, ignoring`);
        return undefined;
    }

    const codes = [...new Set(raw.split(',').map((code) => code.trim()).filter(Boolean))];
    if (!codes.length) {
        return undefined;
    }

    const allowedCodes: readonly string[] = allowed;
    const isAllowed = (code: string): code is CardsPaymentMethodCode => allowedCodes.includes(code);
    if (!codes.every(isAllowed)) {
        const invalid = codes.filter((code) => !isAllowed(code));
        console.warn(`Invalid paymentMethodOrder codes [${invalid.join(', ')}], ignoring. Allowed: ${allowed.join(', ')}`);
        return undefined;
    }

    return codes;
}
