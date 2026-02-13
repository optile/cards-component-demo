import { useState } from "react";
import { useVisualizationStore } from "../store/visualizationStore";
import MetaViewer from "./MetaViewer";
import { getLoggerEventStatus } from "../utils/visualizationUtils";

const badgeClass = (status: string) => {
  switch (status) {
    case "running":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "stopped":
      return "bg-red-100 text-red-800";
    case "notified":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const ChargeFlowEventLogger = () => {
  const { events, enabled } = useVisualizationStore();
  const [expanded, setExpanded] = useState(false);

  const containerHeightClass = expanded ? "h-[50vh]" : "h-10";

  if (!enabled) return null;

  return (
    <div
      className={`${containerHeightClass} overflow-y-auto bg-white border rounded m-4 p-2 z-40 sticky bottom-4 transition-all duration-300`}
    >
      {/* control bar */}
      <div className="flex items-center justify-between mb-2">
        <h1>Charge Flow Event Logger</h1>
        <button
          className="text-xs px-2 py-1 bg-gray-100 rounded"
          onClick={() => setExpanded((s) => !s)}
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {events.length === 0 && (
        <div className="text-sm text-gray-500">No events yet</div>
      )}

      <div className="space-y-3">
        {events.map((ev) => {
          const status = getLoggerEventStatus(ev);
          const e = ev as {
            id: string;
            type: string;
            name?: string;
            timestamp: number;
            meta?: Record<string, unknown>;
            phase?: string;
          };
          return (
            <div key={e.id} className="flex flex-col border rounded p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`px-2 py-1 rounded text-xs font-semibold ${badgeClass(
                      status
                    )}`}
                  >
                    {e.type === "callback" ? "CALLBACK" : e.type.toUpperCase()}
                  </div>
                  <div className="text-sm font-medium">
                    {e.name}
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="text-xs">
                  {status === "running" && (
                    <span className="text-yellow-700">Running…</span>
                  )}
                  {status === "completed" && (
                    <span className="text-green-700">Done</span>
                  )}
                  {status === "stopped" && (
                    <span className="text-red-700">Stopped</span>
                  )}
                  {status === "notified" && (
                    <span className="text-blue-700">Notified</span>
                  )}
                </div>
              </div>

              <div className="mt-2 text-xs text-gray-600">
                <MetaViewer meta={e.meta} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChargeFlowEventLogger;
