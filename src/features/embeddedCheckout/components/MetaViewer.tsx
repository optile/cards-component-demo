import React, { useMemo, useState } from "react";
import {
  createLoggerArgPreview,
  createLoggerArgTypeLabel,
  safeStringify,
} from "../utils/visualizationUtils";
import ObjectInspectorModal from "./ObjectInspectorModal";

type Props = {
  meta?: Record<string, unknown>;
};

const ArgRow: React.FC<{ arg: unknown; index: number }> = ({ arg, index }) => {
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const typeLabel = useMemo(() => createLoggerArgTypeLabel(arg), [arg]);

  const preview = useMemo(() => createLoggerArgPreview(arg), [arg]);

  return (
    <div className="flex items-start gap-3">
      <div className="text-xs text-gray-600">#{index + 1}</div>
      <div className="flex-1">
        <div className="text-sm">
          <strong className="mr-2">{typeLabel}</strong>
          <span className="text-xs text-gray-600">{preview}</span>

          <button
            onClick={() => setInspectorOpen(true)}
            className="ml-3 text-xs text-blue-600 underline"
          >
            Inspect
          </button>
        </div>
      </div>

      <ObjectInspectorModal
        open={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        data={arg}
        title={`Arg #${index + 1}`}
      />
    </div>
  );
};

const MetaViewer: React.FC<Props> = ({ meta }) => {
  const [expanded, setExpanded] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  if (!meta) return null;

  // If meta contains args, show arg-by-arg inspector
  const args = Array.isArray(meta.args) ? (meta.args as unknown[]) : null;

  return (
    <div>
      {args ? (
        <div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-600">
              {args
                .slice(0, 3)
                .map((a) => safeStringify(a, 0))
                .join(", ")}
              {args.length > 3 ? ` +${args.length - 3} more` : ""}
            </div>
            <button
              onClick={() => setExpanded((s) => !s)}
              className="text-xs text-blue-600 underline ml-2"
            >
              {expanded ? "Collapse" : "Inspect args"}
            </button>
          </div>

          {expanded && (
            <div className="mt-2 space-y-2 flex flex-col">
              {args.map((a, idx) => (
                <ArgRow key={idx} arg={a} index={idx} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-gray-600">
              {safeStringify(meta, 0)}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpanded((s) => !s)}
                className="text-xs text-blue-600 underline ml-2"
              >
                {expanded ? "Collapse" : "Details"}
              </button>
              <button
                onClick={() => setInspectorOpen(true)}
                className="text-xs text-blue-600 underline ml-2"
              >
                Inspect
              </button>
            </div>
          </div>

          {expanded && (
            <pre className="mt-2 max-h-48 overflow-auto text-xs bg-gray-50 p-2 rounded border">
              {safeStringify(meta, 3)}
            </pre>
          )}
        </div>
      )}

      <ObjectInspectorModal
        open={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        data={meta}
        title={`Meta`}
      />
    </div>
  );
};

export default MetaViewer;
