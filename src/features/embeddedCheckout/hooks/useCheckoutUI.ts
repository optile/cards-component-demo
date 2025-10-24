import { useEffect, useRef } from "react";
import { useCheckoutStore } from "@/features/embeddedCheckout/store/checkoutStore";
import { useConfigurationStore } from "@/features/embeddedCheckout/store/configurationStore";
import type {
  CheckoutInstance,
  DropInComponent,
} from "@/features/embeddedCheckout/types/checkout";

export const useCheckoutUI = (checkout: CheckoutInstance | null) => {
  const componentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { availableMethods, isSubmitting, componentListDiff, getActiveDropIn } =
    useCheckoutStore();
  const { payButtonType } = useConfigurationStore();

  // update componenets list based on the diff
  useEffect(() => {
    if (!checkout || !componentListDiff || availableMethods.length === 0)
      return;

    const { addedComponents, removedComponents } = componentListDiff;

    // Unmount removed components
    if (removedComponents.size > 0) {
      const currentDropIns = useCheckoutStore.getState().dropIns;
      const updatedDropIns = currentDropIns.filter((dropIn) => {
        if (removedComponents.has(dropIn.element.constructor.name)) {
          dropIn.unmount();
          return false;
        }
        return true;
      });
      useCheckoutStore.setState({ dropIns: updatedDropIns });
    }

    // Mount added components
    if (addedComponents.size > 0) {
      const currentDropIns = useCheckoutStore.getState().dropIns;
      const newDropIns: DropInComponent[] = [];
      addedComponents.forEach((methodName) => {
        const method = availableMethods.find((m) => m.name === methodName);
        const container = componentRefs.current[methodName];
        if (method && container) {
          const component = checkout
            .dropIn(method.name, { hidePaymentButton: false })
            .mount(container);
          newDropIns.push(component);
        }
      });
      useCheckoutStore.setState({
        dropIns: [...currentDropIns, ...newDropIns],
      });
    }
  }, [componentListDiff, checkout, availableMethods]);

  // Update pay button visibility
  useEffect(() => {
    updatePayButton(payButtonType);
  }, [payButtonType]);

  const handlePayment = async () => {
    if (isSubmitting || !checkout) return;
    useCheckoutStore.setState({ isSubmitting: true });
    const activeDropIn = getActiveDropIn();
    if (activeDropIn) {
      await activeDropIn.pay();
    }
    useCheckoutStore.setState({ isSubmitting: false });
  };

  const updatePayButton = (payButtonType: string) => {
    const isPayButtonHidden = payButtonType === "custom";
    useCheckoutStore.getState().dropIns.forEach((component) => {
      component.element.hidePaymentButton(isPayButtonHidden);
    });
  };

  return { componentRefs, handlePayment, updatePayButton };
};
