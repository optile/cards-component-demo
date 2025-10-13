import { useEffect, useRef } from "react";
import { useCheckoutStore } from "../store/checkoutStore";
import { useConfigurationStore } from "../store/configurationStore";
import type { CheckoutInstance, DropInComponent } from "../types/checkout";

export const useCheckoutUI = (checkout: CheckoutInstance | null) => {
  const componentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { availableMethods, isSubmitting, componentListDiff, getActiveDropIn } =
    useCheckoutStore();
  const { payButtonType } = useConfigurationStore();

  // Mount components when refs are ready
  // useEffect(() => {
  //   if (!checkout || availableMethods.length === 0 || areComponentsMounted)
  //     return;
  //   const allRefsAreSet = availableMethods.every(
  //     (method) => componentRefs.current[method.name]
  //   );
  //   if (allRefsAreSet) {
  //     // Unmount previous
  //     useCheckoutStore.getState().dropIns.forEach((dropIn) => dropIn.unmount());
  //     const newDropIns: DropInComponent[] = [];
  //     availableMethods.forEach((method) => {
  //       const container = componentRefs.current[method.name];
  //       if (container) {
  //         const component = checkout
  //           .dropIn(method.name, { hidePaymentButton: false })
  //           .mount(container);
  //         newDropIns.push(component);
  //       }
  //     });
  //     useCheckoutStore.setState({
  //       dropIns: newDropIns,
  //       areComponentsMounted: true,
  //     });
  //   }
  // }, [checkout, availableMethods, areComponentsMounted]);

  // update componenets list based on the diff
  useEffect(() => {
    if (!checkout || !componentListDiff || availableMethods.length === 0)
      return;

    console.log("Component list diff:", componentListDiff);

    const { addedComponents, removedComponents } = componentListDiff;

    // Unmount removed components
    if (removedComponents.size > 0) {
      console.log("Unmounting removed components:", removedComponents);
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
