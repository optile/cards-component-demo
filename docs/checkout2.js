const env = "checkout.integration";
const defaultDivision = "45667";
let isDifferentShippingAddress = false;
const listRequest = {
  currency: "USD",
  amount: 10,
  country: "US",
  division: getDivision(),
  customer: {
    number: "777",
    firstName: "John",
    lastName: "Doe",
    birthday: "1977-09-13",
    email: "john_doe@email-domain.com",
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
        phones: {
          mobile: {
            unstructuredNumber: "123456789",
          },
        },
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
        phones: {
          mobile: {
            unstructuredNumber: "123456789",
          },
        },
      },
    },
  },
};

function createPaymentListener(paymentComponent) {
  return function (event) {
    event.preventDefault();
    paymentComponent.pay();
  };
}

let currentPaymentListener = null;

function updateCustomPaymentButton(component) {
  const payButton = document.getElementById("custom-pay-button");

  // If there's an existing listener, remove it
  if (currentPaymentListener) {
    payButton.removeEventListener("click", currentPaymentListener);
  }

  currentPaymentListener = createPaymentListener(component);

  // Add the new listener
  payButton.addEventListener("click", currentPaymentListener);
}

const getComponentName = (eventName) => {
  if (eventName === "cards") return `payoneer-stripe[method="STRIPE:CARDS"]`;

  return `payoneer-stripe[method="STRIPE:${eventName.toUpperCase()}"]`;
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

      const selectorName = getComponentName(e.target.value);
      const checkoutComponent = document.querySelector(selectorName);

      updateCustomPaymentButton(checkoutComponent);

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
  const cards = document.getElementById("payoneer-stripe-component");
  cards.setStyles({
    primaryColor: newColor,
  });
}

// Update text color of default pay button
function updatePayButtonTextColor(event) {
  const newColor = event.target.value;
  const cards = document.getElementById("payoneer-stripe-component");
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

function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}

function isEmptyValue(val) {
  return val === "" || val === null || val === undefined;
}

function deepMerge() {
  var result = {};

  for (var i = 0; i < arguments.length; i++) {
    var obj = arguments[i];
    if (!obj || typeof obj !== "object") continue;

    for (var key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      var newVal = obj[key];
      var existingVal = result[key];

      if (Array.isArray(existingVal) && Array.isArray(newVal)) {
        result[key] = existingVal.concat(newVal);
      } else if (isPlainObject(existingVal) && isPlainObject(newVal)) {
        result[key] = deepMerge(existingVal, newVal);
      } else if (isPlainObject(newVal) && isPlainObject(result[key])) {
        result[key] = deepMerge(result[key], newVal);
      } else {
        if (isEmptyValue(newVal) && result.hasOwnProperty(key)) {
          // skip assigning if newVal is empty
          continue;
        }
        result[key] = newVal;
      }
    }
  }

  return result;
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

  // If shipping address is same as billing.
  if (!isDifferentShippingAddress) {
    data.customer.addresses.shipping = data.customer.addresses.billing;
  }

  if (
    data.customer.addresses.billing.country !== "" &&
    data.customer.addresses.billing.country !== listRequest.country
  ) {
    listRequest.country = data.customer.addresses.billing.country;
  }

  const mergedData = deepMerge(listRequest, data);

  // Attach transactionId
  if (window.transactionId) {
    mergedData.transactionId = window.transactionId;
  }

  return mergedData;
}

/**
 * A callback function to handle checkout UI lifecycle from rendering to updating UI etc.
 * @param {*} checkout
 * @param {*} diff
 */
function onComponentListChange(checkout, diff) {
  const componentsInfo = checkout.availableDropInComponents();

  /**
   * Container of payment methods list
   */
  const paymentMethodsContainer = document.getElementById(
    "payment-methods-container"
  );

  /**
   * Remove UI of unavailable components
   */
  diff.removedComponents.forEach((component) => {
    console.log({ component, isDroppedIn: checkout.isDroppedIn(component) });
    if (checkout.isDroppedIn(component)) {
      const removed = checkout.remove(component);
      const el = document.getElementById(`${component}-payment-method`);
      console.log({ removed, el });
      if (removed && el) {
        el.parentNode.removeChild(el);
      }
    }
  });

  diff.availableComponents.forEach((component) => {
    const buttonType = getPayButtonType();
    if (!checkout.isDroppedIn(component)) {
      console.log({ component });
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
                            info.logoUrl &&
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
      checkout
        .dropIn(component, {
          hidePaymentButton: buttonType === "custom",
        })
        .mount(parentElement);

      if (!document.querySelector(".active")) {
        document.getElementById(`${component}-radio`).click();
      }
    }
  });
}

async function initCheckout() {
  function createDummyCallHandler(component, returnValue) {
    return function () {
      console.log("\n\n " + component + " \n");
      console.log([...arguments]);
      console.log("\n " + component + " \n\n");

      return returnValue;
    };
  }

  const checkout = await Payoneer.CheckoutWeb({
    env,
    preload: ["stripe:card"],
    // longId: "683d24e78f22ef000169dc9ald6u4oh30rilu40ghid78dqmpu",
    onComponentListChange,
    onBeforeCharge: createDummyCallHandler("onBeforeCharge", true),
    onBeforeError: createDummyCallHandler("onBeforeError", true),
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
      .then((res) => {
        return method === "POST" ? res.json() : { longId: window.longId };
      })
      .then((listResponse) => {
        resolve(listResponse);
      })
      .catch((err) => reject(err));
  });
}

initCheckout();

function setUpPayButton() {
  // Sets pay button type
  const payButtonType = getPayButtonType();

  if (payButtonType === "default") {
    document.getElementById("default-option").checked = true;
  } else if (payButtonType === "custom") {
    document.getElementById("styling-options").style = "display: none";
    document.getElementById("custom-pay-button-container").style =
      "display: block";
    document.getElementById("custom-option").checked = true;
  } else {
    document.getElementById("default-option").checked = true;
  }

  // Pay button is displayed inside cards component
  document
    .getElementById("default-option")
    .addEventListener("change", (event) => {
      handleSelectDefaultPayButton(event);
    });

  // Pay button is displayed underneath store options and hidden in cards component
  document
    .getElementById("custom-option")
    .addEventListener("change", (event) => {
      handleSelectCustomPayButton(event);
    });
}

window.addEventListener("DOMContentLoaded", async () => {
  togglePaymentMethodSelection();
  toggleShippingFields();
  setUpPayButton();

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

  var amountEdit = document.getElementById("amount-edit");
  var amountSave = document.getElementById("amount-save");
  var amountDetails = document.getElementById("amount-details");
  var amountForm = document.getElementById("amount-form");

  amountEdit.addEventListener("click", function () {
    amountEdit.classList.add("hidden");
    amountSave.classList.remove("hidden");
    amountDetails.classList.add("hidden");
    amountForm.classList.remove("hidden");
  });

  const customerDetailsForm = document.getElementById("customer-details-form");

  function updateListData() {
    const payload = readCustomerDetailsForm(customerDetailsForm);

    const wrapper = document.getElementById("payment-methods-container");
    wrapper.style = "display: none;";
    document.getElementById("loading-message").style = "display: block;";

    generateOrUpdateListSession("PUT", payload, window.longId).then(
      (response) => {
        console.log({ response });
        checkoutInstance.updateLongId(window.longId);
        setTimeout(function () {
          document.getElementById("loading-message").style = "display: none;";
          wrapper.style = "display: block;";
        }, 1000);
      }
    );
  }
  customerDetailsForm.addEventListener("change", updateListData);

  amountSave.addEventListener("click", function () {
    amountEdit.classList.remove("hidden");
    amountSave.classList.add("hidden");
    amountDetails.classList.remove("hidden");
    amountForm.classList.add("hidden");
    const formData = new FormData(amountForm);
    listRequest.amount = formData.get("amount");
    listRequest.currency = formData.get("currency");
    var symbols = {
      USD: "$", // US Dollar
      EUR: "€", // Euro
      GBP: "£", // British Pound
      CNY: "¥", // Chinese Yuan (Renminbi)
      JPY: "¥", // Japanese Yen
      RUB: "₽", // Russian Ruble
    };
    Array.from(
      document.getElementsByClassName("amount-with-currency-sign")
    ).forEach(function (el) {
      el.innerHTML = `${symbols[listRequest.currency]}${listRequest.amount}`;
    });
    updateListData();
  });
});
