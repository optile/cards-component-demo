import { useEffect, useRef } from "react";
import { useCheckoutStore } from "../store/checkoutStore";
import { useConfigurationStore } from "../store/configuration";
import type { CheckoutInstance, DropInComponent } from "../types/checkout";

export const useCheckoutUI = (checkout: CheckoutInstance | null) => {
  const componentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const {
    availableMethods,
    areComponentsMounted,
    isSubmitting,
    getActiveDropIn,
  } = useCheckoutStore();
  const { payButtonType } = useConfigurationStore();

  // Mount components when refs are ready
  useEffect(() => {
    if (!checkout || availableMethods.length === 0 || areComponentsMounted)
      return;
    const allRefsAreSet = availableMethods.every(
      (method) => componentRefs.current[method.name]
    );
    if (allRefsAreSet) {
      // Unmount previous
      useCheckoutStore.getState().dropIns.forEach((dropIn) => dropIn.unmount());
      const newDropIns: DropInComponent[] = [];
      availableMethods.forEach((method) => {
        const container = componentRefs.current[method.name];
        if (container) {
          const component = checkout
            .dropIn(method.name, { hidePaymentButton: false })
            .mount(container);
          newDropIns.push(component);
        }
      });
      useCheckoutStore.setState({
        dropIns: newDropIns,
        areComponentsMounted: true,
      });
    }
  }, [checkout, availableMethods, areComponentsMounted]);

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
