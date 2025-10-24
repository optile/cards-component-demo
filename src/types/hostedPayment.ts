export interface HostedPaymentFlowState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export interface HostedPaymentConfig {
  hostedVersion: string;
  language: string;
  baseUrl: string;
}

export interface ReviewSectionProps {
  className?: string;
}
