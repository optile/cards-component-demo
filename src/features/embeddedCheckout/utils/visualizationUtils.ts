import type { LoggerEvent } from "../types/visualization";

const resolveEndStatus = (result: unknown): string => {
  if (result === "stop") return "stopped";
  if (result === "notified") return "notified";
  return "completed";
};

export const getLoggerEventStatus = (ev: LoggerEvent) => {
  if (ev.type === "start") return "completed";
  if (ev.type === "end") return resolveEndStatus(ev.meta?.result);
  if (ev.type === "callback") {
    if (ev.phase === "start") return "running";
    if (ev.phase === "end") return resolveEndStatus(ev.meta?.result);
  }
  return "unknown";
};

// Module-level helper to identify DOM-like elements
export const isElement = (v: unknown): v is Element => {
  return typeof v === "object" && v !== null && "tagName" in (v as object);
};

export // Safe inspect that avoids circular JSON issues and renders a small details view
const safeStringify = (obj: unknown, depth = 2): string => {
  const seen = new WeakSet<object>();

  const stringify = (value: unknown, currentDepth: number): string => {
    if (value === null) return "null";
    if (typeof value === "string") return `"${value}"`;
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    if (typeof value === "function")
      return `fn:${(value as { name?: unknown }).name || "anonymous"}`;
    if (typeof value === "object") {
      if (!value) return "null";
      if (seen.has(value as object)) return "[Circular]";
      if (isElement(value))
        return `<${String((value as Element).tagName).toLowerCase()}>`;
      if (currentDepth <= 0) return "Object";
      seen.add(value as object);
      const obj = value as Record<string, unknown>;
      const entries = Object.keys(obj)
        .slice(0, 20)
        .map((k) => `${k}: ${stringify(obj[k], currentDepth - 1)}`);
      return `{ ${entries.join(", ")} }`;
    }
    return String(value);
  };

  try {
    return stringify(obj, depth);
  } catch {
    return "[unserializable]";
  }
};

export const createLoggerArgPreview = (arg: unknown) => {
  if (arg === null) return "null";
  if (typeof arg === "string") return `"${arg}"`;
  if (typeof arg === "number" || typeof arg === "boolean") return String(arg);
  if (isElement(arg)) return `<${(arg as Element).tagName.toLowerCase()}>`;
  if (typeof arg === "object") return safeStringify(arg, 0);
  if (typeof arg === "function")
    return `fn:${(arg as { name?: unknown }).name || "anonymous"}`;
  return String(arg);
};

export const createLoggerArgTypeLabel = (arg: unknown) => {
  if (arg === null) return "null";
  if (Array.isArray(arg)) return `Array(${arg.length})`;
  if (isElement(arg))
    return `Element <${(arg as Element).tagName.toLowerCase()}>`;
  if (typeof arg === "function")
    return `Function ${(arg as { name?: unknown }).name || "anonymous"}`;
  if (typeof arg === "object") {
    const ctorName =
      (arg as object) && (arg as object).constructor
        ? (arg as object).constructor.name
        : "Object";
    return String(ctorName || "Object");
  }
  return typeof arg;
};

// Safe JSON serializer that handles circular refs and functions
export const toSafeJson = (data: unknown) => {
  const seen = new WeakSet();
  return JSON.stringify(
    data,
    (_key, value) => {
      // short-circuit DOM elements so we don't serialize massive element internals
      try {
        const isDom =
          typeof value === "object" &&
          value !== null &&
          (typeof (value as { tagName?: unknown }).tagName === "string" ||
            (typeof Element !== "undefined" && value instanceof Element) ||
            typeof (value as { nodeName?: unknown }).nodeName === "string");
        if (isDom) {
          // prefer tagName, fall back to nodeName
          const tag =
            (value as { tagName?: unknown }).tagName ||
            (value as { nodeName?: unknown }).nodeName ||
            "element";
          return `<${String(tag).toLowerCase()}>`;
        }
      } catch {
        // ignore access errors when probing DOM-like objects
      }

      if (typeof value === "function")
        return `[Function: ${
          (value as { name?: string }).name || "anonymous"
        }]`;
      if (typeof value === "object" && value !== null) {
        if (seen.has(value as object)) return "[Circular]";
        seen.add(value as object);
      }
      return value;
    },
    2
  );
};

export const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export const isDomLike = (v: unknown): v is { tagName?: unknown } =>
  typeof v === "object" && v !== null && "tagName" in v;
