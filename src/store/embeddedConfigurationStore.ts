import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useCheckoutStore } from "./checkoutStore";
import { useConfigurationStore } from "./configurationStore";

interface EmbeddedConfigurationState {
  urlSharingEnabled: boolean;
  setUrlSharingEnabled: (enabled: boolean) => void;
  clearUrlConfiguration: () => void;
}

export const useEmbeddedConfigurationStore =
  create<EmbeddedConfigurationState>()(
    persist(
      (set, get) => ({
        urlSharingEnabled: false,

        setUrlSharingEnabled: (enabled: boolean) => {
          set({ urlSharingEnabled: enabled });

          if (enabled) {
            // Force both stores to re-persist by triggering setState with shallow copies
            // This causes Zustand to detect changes and persist current state to URL
            try {
              const currentCheckoutState = useCheckoutStore.getState();
              const currentConfigState = useConfigurationStore.getState();

              // Trigger persistence by setting state with shallow copies
              // This forces Zustand to detect changes and save to storage
              useCheckoutStore.setState({
                env: currentCheckoutState.env,
                refetchListBeforeCharge:
                  currentCheckoutState.refetchListBeforeCharge,
              });

              useConfigurationStore.setState({
                merchantCart: { ...currentConfigState.merchantCart },
                billingAddress: { ...currentConfigState.billingAddress },
                shippingAddress: { ...currentConfigState.shippingAddress },
                sameAddress: currentConfigState.sameAddress,
              });
            } catch {
              // Silently handle any sync errors
            }
          } else {
            // If disabling, immediately clear URL
            get().clearUrlConfiguration();
          }
        },

        clearUrlConfiguration: () => {
          // Clear all URL hash parameters
          const searchParams = new URLSearchParams(location.hash.slice(1));
          searchParams.delete("checkout-storage");
          searchParams.delete("configuration-storage");
          location.hash = searchParams.toString();
        },
      }),
      {
        name: "embedded-configuration",
        storage: createJSONStorage(() => sessionStorage),
      }
    )
  );
