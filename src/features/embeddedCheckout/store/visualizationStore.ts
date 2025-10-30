import { create } from "zustand";

export type VisualEvent = {
  id: string;
  type: "start" | "callback" | "end";
  name?: string;
  phase?: "start" | "end";
  timestamp: number;
  meta?: Record<string, unknown>;
};

export interface VisualizationState {
  enabled: boolean;
  delayMs: number;
  events: VisualEvent[];
  addEvent: (event: Omit<VisualEvent, "id" | "timestamp">) => void;
  clear: () => void;
  setEnabled: (enabled: boolean) => void;
  setDelayMs: (ms: number) => void;
}

export const useVisualizationStore = create<VisualizationState>((set) => ({
  enabled: false,
  delayMs: 500,
  events: [],
  addEvent: (event) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const full: VisualEvent = {
      ...event,
      id,
      timestamp: Date.now(),
    };

    set((state) => {
      // Dedupe: if last event is the same type/name/phase, update timestamp + merge meta instead of appending
      const last = state.events[state.events.length - 1];
      if (
        last &&
        last.type === full.type &&
        last.name === full.name &&
        last.phase === full.phase
      ) {
        const updated: VisualEvent = {
          ...last,
          timestamp: full.timestamp,
          meta: { ...(last.meta || {}), ...(full.meta || {}) },
        };
        const newEvents = state.events.slice();
        newEvents[newEvents.length - 1] = updated;
        return { events: newEvents };
      }

      // If this is a callback "end" event, try to update the matching previous "start" callback
      if (full.type === "callback" && full.phase === "end") {
        const corr = full.meta?.correlationId as string | undefined;
        if (corr) {
          for (let i = state.events.length - 1; i >= 0; i--) {
            const ev = state.events[i];
            if (
              ev.type === "callback" &&
              ev.phase === "start" &&
              ev.meta?.correlationId === corr
            ) {
              const updated: VisualEvent = {
                id: ev.id,
                type: ev.type,
                name: ev.name,
                phase: "end",
                timestamp: full.timestamp,
                meta: { ...(ev.meta || {}), ...(full.meta || {}) },
              };
              const newEvents = state.events.slice();
              newEvents[i] = updated;
              return { events: newEvents };
            }
          }
        }

        // Fallback: find by name and phase
        for (let i = state.events.length - 1; i >= 0; i--) {
          const ev = state.events[i];
          if (
            ev.type === "callback" &&
            ev.name === full.name &&
            ev.phase === "start"
          ) {
            const updated: VisualEvent = {
              id: ev.id,
              type: ev.type,
              name: ev.name,
              phase: "end",
              timestamp: full.timestamp,
              meta: { ...(ev.meta || {}), ...(full.meta || {}) },
            };
            const newEvents = state.events.slice();
            newEvents[i] = updated;
            return { events: newEvents };
          }
        }
        // If no matching start found, fall through to append
      }

      return { events: [...state.events, full] };
    });
  },
  clear: () => set({ events: [] }),
  setEnabled: (enabled: boolean) => set({ enabled }),
  setDelayMs: (ms: number) => set({ delayMs: ms }),
}));
