export const HOSTED_PAYMENT_CONFIG = {
  hostedVersion: "v6",
  language: "en",
  resourcesDomain: "resources",
  paymentPagePath: "paymentpage/v6/responsive.html",
} as const;

export const getHostedPaymentPageUrl = (
  env: string,
  listId: string,
  language: string = HOSTED_PAYMENT_CONFIG.language
): string => {
  return `https://${HOSTED_PAYMENT_CONFIG.resourcesDomain}.${env}.oscato.com/${HOSTED_PAYMENT_CONFIG.paymentPagePath}?listId=${listId}&lang=${language}`;
};

export const getCallbackUrls = (baseUrl: string) => ({
  returnUrl: `${baseUrl}/hosted/success`,
  cancelUrl: `${baseUrl}/hosted/cancel`,
  notificationUrl: `${baseUrl}/api/notifications`,
  summaryUrl: `${baseUrl}/hosted/summary`,
});
