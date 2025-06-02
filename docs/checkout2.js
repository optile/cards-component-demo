const env = "checkout.integration";
const defaultDivision = "45667";
let isDifferentShippingAddress = false;
const listRequest = {
  currency: "USD",
  amount: 100,
  country: "US",
  division: getDivision(),
  customer: {
    number: "777",
    firstName: "John",
    lastName: "Doe",
    birthday: "1977-09-13",
    email: "afterpay_visa_successful@payoneer.com",
    addresses: {
      shipping: {
        name: {
          firstName: "john",
          lastName: "doe",
        },
        street: "12",
        houseNumber: "12",
        zip: "83000",
        city: "NY",
        state: "NY",
        country: "US",
      },
      billing: {
        name: {
          firstName: "john",
          lastName: "doe",
        },
        street: "12",
        houseNumber: "12",
        zip: "83000",
        city: "NY",
        state: "NY",
        country: "US",
      },
    },
  },
};

/**
 * Show or hide payment components based on click on radio button
 */
function togglePaymentMethodSelection() {
  const form = document.getElementById("payment-methods");
  form.addEventListener("change", (e) => {
    if (e.target.name === "payment-option") {
      console.log("value is changes", {
        value: e.target.value,
        name: e.target.name,
      });

      const currentEl = form.querySelector(`#${e.target.value}-payment-method`);
      const otherElements = form.querySelectorAll(".payment-method");

      otherElements.forEach((element) => {
        if (element === currentEl) {
          console.log({ element, currentEl, isQueral: true });
          element.classList.add("active");
        } else {
          console.log("disable rest of elements", { isQueral: false });
          element.classList.remove("active");
        }
      });
    }
  });
}

// Handler for choosing the custom pay button option (store custom button is displayed)
function handleSelectCustomPayButton(event) {
  const params = new URLSearchParams(window.location.search);
  params.set("payButtonType", event.target.value);
  window.location.search = params.toString();
}

function updatePayButtonBackgroundColor(event) {
  const newColor = event.target.value;
  const cards = document.getElementById(
    `payoneer-${window?.isStripeProvider ? "stripe" : "cards"}-component`
  );
  cards.setStyles({
    primaryColor: newColor,
  });
}

// Update text color of default pay button
function updatePayButtonTextColor(event) {
  const newColor = event.target.value;
  const cards = document.getElementById(
    `payoneer-${window?.isStripeProvider ? "stripe" : "cards"}-component`
  );
  cards.setStyles({
    primaryTextColor: newColor,
  });
}

// Checks URL params to see if default or custom pay button was chosen
function getPayButtonType() {
  const params = new URLSearchParams(window.location.search);
  return params.has("payButtonType") ? params.get("payButtonType") : "default";
}

function getIE() {
  const searchParams = new URLSearchParams(location.search);

  if (searchParams.has("env")) {
    return searchParams.get("env");
  }

  return env;
}

function getDivision() {
  const params = new URLSearchParams(window.location.search);
  return params.has("division") ? params.get("division") : defaultDivision;
}

// Show or hide shipping fields
function toggleShippingFields() {
  const differentShippingAddress = document.getElementById("same-address");
  const shippingSection = document.getElementById("shipping-section");
  shippingSection.style.display = "none";
  differentShippingAddress.addEventListener("change", () => {
    if (differentShippingAddress.checked) {
      shippingSection.style.display = "block";
      isDifferentShippingAddress = true;
    } else {
      shippingSection.style.display = "none";
      isDifferentShippingAddress = false;
    }
  });

  if (differentShippingAddress.checked) {
    shippingSection.style.display = "none";
  }
}

function readCustomerDetailsForm(customerDetailsForm) {
  if (!customerDetailsForm) return {};
  const formData = new FormData(customerDetailsForm);
  const data = {};

  for (const [key, value] of formData.entries()) {
    const keys = key.split(".");
    let current = data;

    keys.forEach((part, index) => {
      if (index === keys.length - 1) {
        current[part] = value;
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    });
  }
  console.log("shipping error", { data });

  data.customer.addresses.shipping = {
    name: {
      firstName: "john",
      lastName: "doe",
    },
    street: "12",
    houseNumber: "12",
    zip: "83000",
    city: "NY",
    state: "NY",
    country: "UsS",
  };
  data.customer.addresses.billing = data.customer.addresses.shipping;
  return data;
}

/**
 * A callback function to handle checkout UI lifecycle from rendering to updating UI etc.
 * @param {*} checkout
 * @param {*} diff
 */
function onComponentListChange(checkout, diff) {
  const isStripeProvider = checkout?.providers.indexOf("STRIPE") > -1;
  window.isStripeProvider = isStripeProvider;
  const componentsInfo = checkout.availableDropInComponents();

  /**
   * Remove UI of unavailable components
   */
  diff.removedComponents.forEach((component) => {
    if (checkout.isDroppedIn(component)) {
      checkout.remove(component);
    }
  });

  /**
   * Container of payment methods list
   */
  const paymentMethodsContainer = document.getElementById(
    "payment-methods-container"
  );

  diff.availableComponents.forEach((component) => {
    const buttonType = getPayButtonType();
    if (
      diff.availableComponents.has(component) &&
      !checkout.isDroppedIn(component)
    ) {
      const parentElement = document.createElement("div");
      parentElement.classList = "payment-method-component-container";
      const componentInfo = componentsInfo.find(
        ({ name }) => name === component
      );
      const template = `
                <label
                  for="${component}-radio"
                  id="${component}-select-container"
                  class="payment-method-select-container"
                >
                  <span>
                    <input
                      id="${component}-radio"
                      type="radio"
                      name="payment-option"
                      value="${component}"
                    />
                    ${componentInfo ? componentInfo.label : component}
                  </span>
                  <span id="${component}-icons" class="payment-method-icon-container">
                    ${
                      componentInfo?.networkInformation
                        ?.map(
                          (info) =>
                            `<img src="${info.logoUrl}" alt="${componentInfo.label}" />`
                        )
                        .join("") || ""
                    }
                  </span>
                </label>
              `;

      const wrapper = document.createElement("div");
      wrapper.classList = "payment-method";
      wrapper.id = `${component}-payment-method`;

      wrapper.innerHTML = template;
      wrapper.appendChild(parentElement);

      paymentMethodsContainer.appendChild(wrapper);
      const methodName = isStripeProvider
        ? `stripe:${component === "cards" ? "card" : component}`
        : component;
      checkout
        .dropIn(methodName, {
          hidePaymentButton: buttonType === "custom",
        })
        .mount(parentElement);
    }
  });
}

async function initCheckout() {
  function createDummyCallHandler(methodName, returnValue) {
    return function () {
      console.log("\n\n " + methodName + " \n");
      console.log([...arguments]);
      console.log("\n " + methodName + " \n\n");

      return returnValue;
    };
  }

  const checkout = await Payoneer.CheckoutWeb({
    env,
    // longId: "683d24e78f22ef000169dc9ald6u4oh30rilu40ghid78dqmpu",
    onComponentListChange,
    onBeforeCharge: createDummyCallHandler("onBeforeCharge", true),
    onBeforeError: (checkout, componentName, data) => {
      const el = document.getElementById("global-error");
      el.innerText = data?.resultInfo || "Unexpected Error";
      el.style = "display: block";
      return false;
    },
    onListRefetch: createDummyCallHandler("onListRefetch", true),
    onPaymentSuccess: createDummyCallHandler("onPaymentSuccess", true),
    onValidationInfo: createDummyCallHandler("onValidationInfo"),
    onPaymentFailure: createDummyCallHandler("onPaymentFailure", true),
    onBeforeProviderRedirect: createDummyCallHandler(
      "onBeforeProviderRedirect",
      true
    ),
    refetchList: createDummyCallHandler("refetchList"),
    onPaymentDeclined: createDummyCallHandler("onPaymentDeclined", true),
  });

  if (checkout.state === "LOADING") {
    document.getElementById("loading-message").style = "display: block;";
  } else {
    document.getElementById("loading-message").style = "display: none;";
  }

  window.checkoutInstance = checkout;
}

function generateOrUpdateListSession(method = "POST", listData, longId) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(listData),
  };

  return new Promise((resolve, reject) => {
    const url =
      method === "POST"
        ? `https://api.${getIE()}.oscato.com/checkout/session`
        : `https://api.${getIE()}.oscato.com/checkout/session/${longId}`;
    fetch(url, options)
      .then((res) => res.json())
      .then((listResponse) => {
        resolve(listResponse);
      })
      .catch((err) => {
        console.log("POST ERROR is:", { err, status: Object.keys(err) });
        for (const key in err) {
          console.error(`key is errorrr ${key}:`, err[key]);
        }
        // reject(err);
      });
  });
}

initCheckout();

window.addEventListener("DOMContentLoaded", async () => {
  togglePaymentMethodSelection();
  toggleShippingFields();

  const buttonType = getPayButtonType();
  if (buttonType === "custom") {
    document.getElementById("custom-option").checked = true;
  } else {
    document.getElementById("default-option").checked = true;
  }

  // Pay button is displayed underneath store options and hidden in cards component
  document
    .getElementById("payment-button-choice-form")
    .addEventListener("change", (event) => {
      handleSelectCustomPayButton(event);
    });

  document
    .getElementById("button-color-picker")
    .addEventListener("input", updatePayButtonBackgroundColor);

  document
    .getElementById("button-text-color-picker")
    .addEventListener("input", updatePayButtonTextColor);

  generateOrUpdateListSession("POST", listRequest).then((response) => {
    console.log("response", { response, checkoutInstance });
    checkoutInstance.updateLongId(response.id);
    window.longId = response.id;
    window.transactionId = response.transactionId;
    window.checkoutInstance.updateLongId(response.id);
  });

  const customerDetailsForm = document.getElementById("customer-details-form");

  customerDetailsForm.addEventListener("change", (event) => {
    const data = readCustomerDetailsForm(customerDetailsForm);
    console.log("form data", { data, longId: window.longId });

    generateOrUpdateListSession(
      "PUT",
      { ...listRequest, ...data, transactionId: window.transactionId || "" },
      window.longId
    ).then((response) => {
      console.log("response", { response, checkoutInstance });
      checkoutInstance.updateLongId(response.id);
    });
  });
});
