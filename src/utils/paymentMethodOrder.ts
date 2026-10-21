// Payment methods whose Payment Element tab order can be overridden, keyed by the lowercased
// method name.
const ALLOWED_ORDER_CODES: Readonly<Record<string, readonly string[]>> = {
    'card': ['card', 'apple_pay', 'google_pay'],
};

/**
 * Resolves the integrator-provided `payment-method-order` attribute (comma-separated codes).
 * Returns `undefined` (Stripe's own ordering) when nothing is provided, the method does not support
 * ordering, or any code is not allowed - an invalid list is rejected as a whole.
 */
export function resolvePaymentMethodOrder(methodKey: string, raw?: string): string[] | undefined {
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

    const invalid = codes.filter((code) => !allowed.includes(code));
    if (invalid.length) {
        console.warn(`Invalid paymentMethodOrder codes [${invalid.join(', ')}], ignoring. Allowed: ${allowed.join(', ')}`);
        return undefined;
    }

    return codes;
}
