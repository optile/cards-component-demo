import React, { useMemo, useState } from "react";
import { isDomLike, isObject, toSafeJson } from "../utils/visualizationUtils";

type Props = {
  open: boolean;
  onClose: () => void;
  data: unknown;
  title?: string;
};

// InspectorNode now receives a shared WeakSet to avoid infinite recursion on circular objects
const InspectorNode: React.FC<{
  data: unknown;
  path?: string[];
  depth?: number;
  seen?: WeakSet<object>;
}> = ({ data, path = [], depth = 0, seen }) => {
  const [expanded, setExpanded] = useState(depth < 1);
  const visited = seen || new WeakSet<object>();

  if (data === null) return <div className="text-xs text-gray-600">null</div>;
  if (typeof data === "string") return <div className="text-xs">"{data}"</div>;
  if (typeof data === "number" || typeof data === "boolean")
    return <div className="text-xs">{String(data)}</div>;
  if (typeof data === "function")
    return (
      <div className="text-xs">
        [Function: {(data as { name?: string }).name || "anonymous"}]
      </div>
    );
  if (Array.isArray(data)) {
    return (
      <div className="text-xs">
        <div className="flex items-center gap-2">
          <button
            className="text-xs text-blue-600 underline"
            onClick={() => setExpanded((s) => !s)}
          >
            {expanded ? "-" : "+"}
          </button>
          <div>Array[{data.length}]</div>
        </div>
        {expanded && (
          <div className="ml-4 space-y-1">
            {(data as unknown[]).map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="text-xs text-gray-500">[{i}]</div>
                <div className="flex-1">
                  <InspectorNode
                    data={item}
                    path={[...path, String(i)]}
                    depth={depth + 1}
                    seen={visited}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isObject(data)) {
    // protect against circular refs
    if (visited.has(data as object)) return null; // previously rendered "[Circular]" here; return nothing to avoid clutter
    visited.add(data as object);

    const keys = Object.keys(data as Record<string, unknown>);
    return (
      <div className="text-xs">
        <div className="flex items-center gap-2">
          <button
            className="text-xs text-blue-600 underline"
            onClick={() => setExpanded((s) => !s)}
          >
            {expanded ? "-" : "+"}
          </button>
          <div>
            Object{" "}
            {keys.length > 0
              ? "{" +
                keys.slice(0, 3).join(", ") +
                (keys.length > 3 ? ", ..." : "") +
                "}"
              : "{}"}
          </div>
        </div>
        {expanded && (
          <div className="ml-4 space-y-1">
            {keys.map((k) => (
              <div key={k} className="flex items-start gap-2">
                <div className="text-xs text-gray-500">{k}:</div>
                <div className="flex-1">
                  <InspectorNode
                    data={(data as Record<string, unknown>)[k]}
                    path={[...path, k]}
                    depth={depth + 1}
                    seen={visited}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // DOM element fallback
  if (
    isDomLike(data) &&
    typeof (data as { tagName?: unknown }).tagName === "string"
  ) {
    return (
      <div className="text-xs">
        &lt;{String((data as { tagName?: string }).tagName).toLowerCase()}&gt;
      </div>
    );
  }

  return <div className="text-xs">{String(data)}</div>;
};

const ObjectInspectorModal: React.FC<Props> = ({
  open,
  onClose,
  data,
  title,
}) => {
  const json = useMemo(() => toSafeJson(data), [data]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="relative bg-white w-11/12 max-w-3xl max-h-[80vh] overflow-auto p-4 rounded shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">{title || "Inspector"}</div>
          <div className="flex items-center gap-2">
            <button
              className="text-xs px-2 py-1 bg-gray-100 rounded"
              onClick={handleCopy}
            >
              Copy JSON
            </button>
            <button
              className="text-xs px-2 py-1 bg-gray-100 rounded"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-800">
          <InspectorNode data={data} seen={new WeakSet<object>()} />
        </div>

        <div className="mt-4">
          <div className="text-xs text-gray-500">Raw (safe) JSON:</div>
          <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto whitespace-pre-wrap break-words">
            {json}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ObjectInspectorModal;
