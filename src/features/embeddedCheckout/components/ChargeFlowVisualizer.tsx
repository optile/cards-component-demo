import React from "react";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import { useVisualizationStore } from "@/features/embeddedCheckout/store/visualizationStore";

const ChargeFlowVisualizer: React.FC = () => {
  const { enabled, delayMs, clear, setEnabled, setDelayMs } =
    useVisualizationStore();

  return (
    <CollapsibleSection title="Charge Flow Visualizer" defaultExpanded={false}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            label="Enable Visualizer"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Delay (ms)</label>
            <input
              type="range"
              min={0}
              max={2000}
              step={50}
              value={delayMs}
              onChange={(e) => setDelayMs(Number(e.target.value))}
            />
            <span className="text-sm text-gray-600">{delayMs}ms</span>
          </div>
          <Button onClick={() => clear()} variant="secondary">
            Clear
          </Button>
        </div>
      </div>
    </CollapsibleSection>
  );
};

export default ChargeFlowVisualizer;
