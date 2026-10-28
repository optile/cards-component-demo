import { useEffect, useRef } from "react";
import { useCheckoutStore } from "@/features/embeddedCheckout/store/checkoutStore";
import { useConfigurationStore } from "@/features/embeddedCheckout/store/configurationStore";
import { resolvePaymentMethodOrder } from "@/utils/paymentMethodOrder";
import type {
  CheckoutInstance,
  DropInComponent,
} from "@/features/embeddedCheckout/types/checkout";

export const useCheckoutUI = (checkout: CheckoutInstance | null) => {
  const componentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { availableMethods, isSubmitting, componentListDiff, getActiveDropIn } =
    useCheckoutStore();
  const { payButtonType, paymentMethodOrder } = useConfigurationStore();

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
          const dropInOptions: any = { hideSubmitButton: false };

          // Add paymentMethodOrder for stripe:card if configured
          if (methodName === 'cards') {
            const resolvedOrder = resolvePaymentMethodOrder('card', paymentMethodOrder);
            if (resolvedOrder) {
              dropInOptions.paymentMethodOrder = resolvedOrder;
            }
          }

          const component = checkout.dropIn(method.name, dropInOptions);
          if (component) newDropIns.push(component.mount(container));
        }
      });
      useCheckoutStore.setState({
        dropIns: [...currentDropIns, ...newDropIns],
      });
    }
  }, [componentListDiff, checkout, availableMethods, paymentMethodOrder]);

  // Remount cards component when payment method order changes (if it was previously mounted)
  useEffect(() => {
    if (!checkout) return;

    const currentDropIns = useCheckoutStore.getState().dropIns;
    const cardsDropIn = currentDropIns.find((di) => di.element.constructor.name === 'CardComponent');

    // Only remount if cards component is already mounted and payment method order changed
    if (cardsDropIn && componentRefs.current['cards']) {
      cardsDropIn.unmount();
      const updatedDropIns = currentDropIns.filter((di) => di !== cardsDropIn);
      useCheckoutStore.setState({ dropIns: updatedDropIns });

      // Re-mount with potentially new payment method order
      const dropInOptions: any = { hideSubmitButton: false };
      const resolvedOrder = resolvePaymentMethodOrder('card', paymentMethodOrder);
      if (resolvedOrder) {
        dropInOptions.paymentMethodOrder = resolvedOrder;
      }

      const component = checkout.dropIn('cards', dropInOptions);
      if (component) {
        const mounted = component.mount(componentRefs.current['cards']);
        useCheckoutStore.setState({
          dropIns: [...updatedDropIns, mounted],
        });
      }
    }
  }, [paymentMethodOrder, checkout]);

  // Update pay button visibility
  useEffect(() => {
    updatePayButton(payButtonType);
  }, [payButtonType]);

  const handlePayment = async () => {
    if (isSubmitting || !checkout) return;
    useCheckoutStore.setState({ isSubmitting: true });
    const activeDropIn = getActiveDropIn();
    if (activeDropIn) {
      await activeDropIn.submit();
    }
    useCheckoutStore.setState({ isSubmitting: false });
  };

  const updatePayButton = (payButtonType: string) => {
    const isPayButtonHidden = payButtonType === "custom";
    useCheckoutStore.getState().dropIns.forEach((component) => {
      component.element.hideSubmitButton(isPayButtonHidden);
    });
  };

  return { componentRefs, handlePayment, updatePayButton };
};
