export type LoggerEvent = {
  type?: string;
  phase?: string;
  meta?: Record<string, unknown>;
};
