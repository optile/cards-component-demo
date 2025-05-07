window.addEventListener("DOMContentLoaded", async () => {
  // Sets up pay button according to which type is requested, default or custom
  setUpPayButton();

  // Update the select menu for outcome based on query param
  setOutcomeSelect();

  // Update the preselection option for outcome based on query param
  setPreselection();

  // Update the select menu for language based on query param
  setLanguageSelect();

  // User can select payment outcome
  setUpPaymentOutcomeListener();

  // User can select language used in cards component
  setUpLanguageSelectListener();

  // Sets up the demo cards tool that is shown on right hand side of screen
  setUpDemoCards();

  // TODO - replace this with proper method when API available - User can select primary color which sets background of pay button
  document
    .getElementById("button-color-picker")
    .addEventListener("input", updatePayButtonBackgroundColor);

  // TODO - replace this with proper method when API available - User can select primary text color which sets text color of pay button
  document
    .getElementById("button-text-color-picker")
    .addEventListener("input", updatePayButtonTextColor);

  // Generates a HOSTED list session and redirects when pay button is clicked in HOSTED scenario for cards
  document
    .getElementById("cards-hosted-redirect-button")
    .addEventListener("click", (event) => {
      event.preventDefault();
      handleStandaloneRedirectClick("cards");
    });

  // Generates a HOSTED list session and redirects when pay button is clicked in HOSTED scenario for cards
  document
    .getElementById("afterpay-hosted-redirect-button")
    .addEventListener("click", (event) => {
      event.preventDefault();
      handleStandaloneRedirectClick("afterpay");
    });

  // Generates a HOSTED list session and redirects when pay button is clicked in HOSTED scenario for cards
  document
    .getElementById("klarna-hosted-redirect-button")
    .addEventListener("click", (event) => {
      event.preventDefault();
      handleStandaloneRedirectClick("klarna");
    });

  // Sets up chooser between hosted and embedded
  setUpIntegrationSelector();

  // Sets up chooser between payment list component or embedded components
  // Sets up pay button according to which type is requested, default or custom
  setUpPaymentListType();

  try {
    loadCheckoutWeb();
  } catch (e) {
    console.error("could not initiate payment", e.message);
  }
});

// Resets all radio buttons so if user comes back via browser back button default selection is used
window.addEventListener("beforeunload", function () {
  const radios = document.querySelectorAll('input[type="radio"]');
  radios.forEach((radio) => {
    if (radio.defaultChecked) {
      radio.checked = true;
    } else {
      radio.checked = false;
    }
  });
});

// Loads the checkout web script dynamically, using sandbox environment if listUrl from sandbox is passed
function loadCheckoutWeb() {
  const searchParams = new URLSearchParams(window.location.search);
  const head = document.getElementsByTagName("head")[0];
  const js = document.createElement("script");

  js.type = "text/javascript";

  js.onload = () => {
    initPayment();
  };

  if (
    searchParams.has("listUrl") &&
    searchParams.get("listUrl").includes("sandbox")
  ) {
    js.src =
      "https://resources.sandbox.oscato.com/web/libraries/checkout-web/umd/checkout-web.min.js";
  } else {
    js.src =
      "https://resources.sandbox.oscato.com/web/libraries/checkout-web/umd/checkout-web.min.js";
  }

  head.appendChild(js);
}

function setUpLanguageSelectListener() {
  document.getElementById("language").addEventListener("change", (event) => {
    const params = new URLSearchParams(window.location.search);
    params.set("language", event.target.value);
    window.location.search = params.toString();
  });
}

// User can select payment outcome
function setUpPaymentOutcomeListener() {
  document.getElementById("outcome").addEventListener("change", (event) => {
    const params = new URLSearchParams(window.location.search);
    params.set("paymentOutcome", event.target.value);
    window.location.search = params.toString();
  });
}

function showHostedButtonContainers() {
  const containers = document.querySelectorAll(".redirect-button-container");
  containers.forEach((container) => {
    container.style.display = "block";
  });
}

function hideHostedButtonContainers() {
  const containers = document.querySelectorAll(".redirect-button-container");
  containers.forEach((container) => {
    container.style.display = "none";
  });
}

function showEmbeddedPaymentContainers() {
  const containers = document.querySelectorAll(".payment-component-container");
  containers.forEach((container) => {
    container.style.display = "block";
  });
}

function hideEmbeddedPaymentContainers() {
  const containers = document.querySelectorAll(".payment-component-container");
  containers.forEach((container) => {
    container.style.display = "none";
  });
}

// Sets up chooser between hosted and embedded
function setUpIntegrationSelector() {
  const payButtonType = getPayButtonType();
  const integrationType = getIntegrationType();

  if (integrationType === "embedded") {
    hideHostedButtonContainers();
    showEmbeddedPaymentContainers();
    document.getElementById("embedded-option").checked = true;
    document.getElementById("styling-options").style =
      payButtonType === "default" ? "display: block;" : "display: none;";
    document.getElementById("hosted-theme").style = "display: none;";
    document.getElementById("hosted-preselection").style = "display: none;";
    document.getElementById("custom-pay-button-container").style =
      payButtonType === "custom" ? "display: block;" : "display: none;";
    document.getElementById("payment-button-choice").style = "display: block;";
    document.getElementById("cards-options").style = "display: block;";
  } else if (integrationType === "hosted") {
    showHostedButtonContainers();
    hideEmbeddedPaymentContainers();
    document.getElementById("hosted-option").checked = true;
    document.getElementById("cards-options").style = "display: block;";
    document.getElementById("styling-options").style = "display: none;";
    document.getElementById("hosted-theme").style = "display: block;";
    document.getElementById("hosted-preselection").style = "display: block;";
    document.getElementById("custom-pay-button-container").style =
      "display: none;";
    document.getElementById("payment-list-form").style = "display: none";
    document.getElementById("payment-list-form-title").style = "display: none";
    document.getElementById("payment-button-choice").style = "display: none;";
  }

  // User can see embedded cards component
  document
    .getElementById("embedded-option")
    .addEventListener("change", (event) => {
      handleSelectEmbedded(event);
    });

  // User can see button which redirects to hosted payment page
  document
    .getElementById("hosted-option")
    .addEventListener("change", (event) => {
      handleSelectHosted(event);
    });

  // Hide styling options and show only redirect to hosted button
  function handleSelectHosted(event) {
    const params = new URLSearchParams(window.location.search);
    params.set("integrationType", event.target.value);
    window.location.search = params.toString();
  }

  // Show styling options and only cards component
  function handleSelectEmbedded(event) {
    const params = new URLSearchParams(window.location.search);
    params.set("integrationType", event.target.value);
    window.location.search = params.toString();
  }
}

function setUpPaymentListType() {
  const paymentListType = getPaymentListType();
  const payButtonType = getPayButtonType();
  const integrationType = getIntegrationType();

  if (paymentListType === "payment-list") {
    document.getElementById("styling-options").style = "display: none;";
    document.getElementById("payment-button-choice").style = "display: none;";
    document.getElementById("payment-list-option").checked = true;
    document.getElementById("custom-pay-button-container").style =
      "display: none;";
  } else if (
    paymentListType === "payment-components" &&
    !integrationType === "hosted"
  ) {
    document.getElementById("styling-options").style = "display: block;";
    document.getElementById("payment-button-choice").style = "display: block;";
    document.getElementById("payment-components-option").checked = true;
    document.getElementById("custom-pay-button-container").style =
      payButtonType === "custom" ? "display: block;" : "display: none;";
  }

  // User can see embedded cards component
  document
    .getElementById("payment-components-option")
    .addEventListener("change", (event) => {
      handleSelectPaymentComponents(event);
    });

  // User can see button which redirects to hosted payment page
  document
    .getElementById("payment-list-option")
    .addEventListener("change", (event) => {
      handleSelectPaymentList(event);
    });

  document
    .getElementById("hosted-preselection-checkbox")
    .addEventListener("change", (event) => {
      handlePreselectionCheckboxChange(event);
    });

  // Hide styling options and show only redirect to hosted button
  function handleSelectPaymentComponents(event) {
    const params = new URLSearchParams(window.location.search);
    params.set("paymentListType", event.target.value);
    window.location.search = params.toString();
  }

  // Show styling options and only cards component
  function handleSelectPaymentList(event) {
    const params = new URLSearchParams(window.location.search);
    params.set("paymentListType", event.target.value);
    window.location.search = params.toString();
  }

  function handlePreselectionCheckboxChange(event) {
    const params = new URLSearchParams(window.location.search);
    params.set("usePreselection", event.target.checked);
    window.location.search = params.toString();
  }
}

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

const defaultEnv = "checkout.integration";

function showMessage(messageText, messageStyle, time) {
  const message = document.getElementById("custom-override-message");
  message.innerHTML = messageText;
  message.style = messageStyle;
  setTimeout(() => {
    message.style = "background-color: orange; display: none;";
    return false; // false hides default error message from the SDK
  }, time);
}

// Checks URL params to see if default or custom pay button was chosen
function getIntegrationType() {
  const params = new URLSearchParams(window.location.search);
  return params.has("integrationType")
    ? params.get("integrationType")
    : "embedded";
}

// Checks URL params to see if default or custom pay button was chosen
function getPaymentListType() {
  const params = new URLSearchParams(window.location.search);
  return params.has("paymentListType")
    ? params.get("paymentListType")
    : "payment-components";
}

// Checks URL params to see if default or custom pay button was chosen
function getUsePreselection() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("usePreselection")) {
    if (params.get("usePreselection") === "false") {
      return false;
    } else {
      return true;
    }
  } else {
    return true;
  }
}

async function initPayment() {
  const payButtonType = getPayButtonType();

  const longId = await getLongId();

  const paymentListType = getPaymentListType();

  const integrationType = getIntegrationType();

  if (
    paymentListType === "payment-components" ||
    integrationType === "hosted"
  ) {
    const ie = getIE();

    function createPaymentListener(paymentComponent) {
      return function (event) {
        event.preventDefault();
        paymentComponent.pay();
      };
    }

    // Reference to the current listener to enable removal
    let currentPaymentListener = null;

    // Function to update the payment method listener
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

    // configurations for the Checkout Web SDK
    const configs = {
      env: ie, // test | live | int-env-name | checkout.integration
      longId: longId,
      preload: ["cards", "afterpay", "klarna"], // loads cards and afterpay script as soon as page loads so that rendering using dropIn is fast
      // Called whenever there is an error (either server-side or client-side) which prevents payment. componentName indicates
      // where the error occurred (checkout-web or one of the payment components)
      onBeforeError: (checkout, componentName, errorData) => {
        console.error(
          "On before error called",
          checkout,
          componentName,
          errorData
        );
        switch (componentName) {
          // Cards payment component error - we want to unmount the component and hide payment method
          case "cards":
            try {
              checkout.remove("cards");
              showCardsPaymentMethod(false);
            } catch (e) {
              console.log(e);
            }
            showMessage(
              `onBeforeError called in Cards`,
              "background-color: #FF4800; display: flex;",
              1500
            );
          // Afterpay payment component error - we want to unmount the component and hide payment method
          case "afterpay":
            try {
              checkout.remove("afterpay");
              showAfterpayPaymentMethod(false);
            } catch (e) {
              console.log(e);
            }
            showMessage(
              `onBeforeError called in Afterpay`,
              "background-color: #FF4800; display: flex;",
              1500
            );
          // Klarna payment component error - we want to unmount the component and hide payment method
          case "klarna":
            try {
              checkout.remove("klarna");
              showKlarnaPaymentMethod(false);
            } catch (e) {
              console.log(e);
            }
            showMessage(
              `onBeforeError called in Klarna`,
              "background-color: #FF4800; display: flex;",
              1500
            );
          // Global error
          case "checkout-web":
          default:
            showMessage(
              `onBeforeError called in ${componentName}`,
              "background-color: #FF4800; display: flex;",
              100000
            );
        }
      },
      // Called after pay button click, but before payment attempt
      onBeforeCharge: async (checkout, componentName, errorData) => {
        console.log(
          "On before charge called",
          checkout,
          componentName,
          errorData
        );
        const message = document.getElementById("custom-override-message");
        message.innerHTML = "Awaiting onBeforeCharge result...";
        message.style = "display: flex;";
        return new Promise((resolve) => {
          setTimeout(() => {
            message.style = "background-color: #61b2e8; display: flex;";
            message.innerHTML = "onBeforeCharge OK. Attempting payment...";
            setTimeout(() => {
              message.style = "background-color: orange; display: none;";
              resolve(true); // true means payment attempt proceeds
            }, 1000);
          }, 1000);
        });
      },
      // Called in PROCEED scenario with PROVIDER redirect just before redirecting to provider url
      onBeforeProviderRedirect: (checkout, componentName, redirectData) => {
        console.log(
          "On before provider redirect called",
          checkout,
          componentName,
          redirectData
        );
        const message = document.getElementById("custom-override-message");
        message.innerHTML = "Awaiting onBeforeProviderRedirect result...";
        message.style = "display: flex;";
        setTimeout(() => {
          return true; // true means redirect to provider proceeds
        }, 1000);
        return new Promise((resolve) => {
          setTimeout(() => {
            message.style = "background-color: #61b2e8; display: flex;";
            message.innerHTML = "Redirecting to 3rd party provider...";
            setTimeout(() => {
              message.style = "background-color: orange; display: none;";
              resolve(true); // true means redirect to provider proceeds
            }, 1000);
          }, 1000);
        });
      },
      // Called in PROCEED scenario with RETURN redirect just before redirecting to returnUrl
      onPaymentSuccess: async (checkout, componentName, redirectData) => {
        console.log(
          "On payment success called",
          checkout,
          componentName,
          redirectData
        );
        const message = document.getElementById("custom-override-message");
        message.innerHTML = "onPaymentSuccess was called...";
        message.style = "display: flex;";
        return new Promise((resolve) => {
          setTimeout(() => {
            message.style = "background-color: #20DC86; display: flex;";
            message.innerHTML =
              "Payment was successful! &#10003; Redirecting...";
            setTimeout(() => {
              message.style = "background-color: orange; display: none;";
              resolve(true); // true means redirect to returnUrl proceeds
            }, 1000);
          }, 1000);
        });
      },
      // Called in ABORT scenario just before redirecting to cancelUrl
      onPaymentFailure: async (checkout, componentName, redirectData) => {
        console.log(
          "On payment failure called",
          checkout,
          componentName,
          redirectData
        );
        const message = document.getElementById("custom-override-message");
        message.innerHTML = "onPaymentFailure was called...";
        message.style = "display: flex;";
        return new Promise((resolve) => {
          setTimeout(() => {
            message.style = "background-color: #FF4800; display: flex;";
            message.innerHTML = "Payment session aborted! Redirecting...";
            setTimeout(() => {
              message.style = "background-color: orange; display: none;";
              resolve(true); // true means redirect to cancelUrl proceeds
            }, 1000);
          }, 1000);
        });
      },
      // Called when fresh payment session data is received from Payoneer gateway
      onListRefetch: async (checkout, componentName, listData) => {
        console.log("List data refetched", checkout, componentName, listData);
        const availableComponents = checkout.availableDropInComponents();
        setAvailableComponents(availableComponents);
        return true;
      },
      onComponentListChange: (checkout, changeInfo) => {
        // Remove any payment methods that are no longer available
        const removedComponents = changeInfo.removedComponents;
        const isStripeProvider = (checkout?.providers.indexOf("STRIPE") > -1);

        if (removedComponents.has("cards") && checkout.isDroppedIn("cards")) {
          checkout.remove("cards");
          showCardsPaymentMethod(false);
          showMessage(
            `Payment with cards not possible`,
            "background-color: #FF4800; display: flex;",
            1500
          );
        }

        if (
          removedComponents.has("afterpay") &&
          checkout.isDroppedIn("afterpay")
        ) {
          checkout.remove("afterpay");
          showAfterpayPaymentMethod(false);
          showMessage(
            `Payment with Afterpay not possible`,
            "background-color: #FF4800; display: flex;",
            1500
          );
        }

        if (removedComponents.has("klarna") && checkout.isDroppedIn("klarna")) {
          checkout.remove("klarna");
          showKlarnaPaymentMethod(false);
          showMessage(
            `Payment with Klarna not possible`,
            "background-color: #FF4800; display: flex;",
            1500
          );
        }

        // Handle the available components
        const availableComponents = changeInfo.availableComponents;
        console.log("New available components are...", availableComponents);

        // Radio button inputs for the Payoneer-provided payment methods
        const cardsRadio = document.getElementById("card-radio");
        const afterpayRadio = document.getElementById("afterpay-radio");
        const klarnaRadio = document.getElementById("klarna-radio");

        if (availableComponents.has("cards")) {
          // Ensure card icons in payment list are updated
          const cardIcons = document.getElementById("card-icons");
          cardIcons.innerHTML = "";
          checkout
            .getComponentInfo("cards")
            ?.networkInformation?.map((info) => info.logoUrl)
            .slice(0, 4)
            .forEach((url) => {
              const img = document.createElement("img");
              img.src = url;
              cardIcons.appendChild(img);
            });

          if (!checkout.isDroppedIn("cards")) {
            showCardsPaymentMethod(true);

            // This is a container for the payoneer-cards component, hidden by default and shown when cards radio is clicked
            const container = document.getElementById(
              "cards-component-container"
            );

            // Already drop in cards component so that it renders immediately
            const cards = checkout
              .dropIn(isStripeProvider ? "stripe:card" : "cards", {
                hidePaymentButton: !(payButtonType === "default"),
              })
              .mount(container);

            // When cards is selected, display the payoneer-cards component (and some extra configuration settings related to cards)
            cardsRadio.addEventListener("change", (event) => {
              if (event.target.checked) {
                updateCustomPaymentButton(cards);
                showCardsPaymentComponent(true);
                showCardsOptions(true);
                // Adds a click event handler to the custom pay button that triggers payment in cards component
                showAfterpayPaymentComponent(false);
                showKlarnaPaymentComponent(false);
              }
            });

            // Show this component by default if it is the only one in the available components
            if (availableComponents.size === 1) {
              cardsRadio.click();
            }
          } else {
            if (availableComponents.size === 1) {
              cardsRadio.click();
            }
          }
        }

        if (availableComponents.has("afterpay")) {
          // Ensure Afterpay icon in payment list is updated
          const afterpayIcons = document.getElementById("afterpay-icons");
          afterpayIcons.innerHTML = "";
          checkout
            .getComponentInfo("afterpay")
            ?.networkInformation?.map((info) => info.logoUrl)
            .slice(0, 4)
            .forEach((url) => {
              const img = document.createElement("img");
              img.src = url;
              afterpayIcons.appendChild(img);
            });

          if (!checkout.isDroppedIn("afterpay")) {
            showAfterpayPaymentMethod(true);

            // Placeholder for dropping in the Afterpay payment component
            const container = document.getElementById(
              "afterpay-component-container"
            );

            // Already drop in cards component so that it renders immediately
            const afterpay = checkout
              .dropIn(isStripeProvider ? "stripe:afterpay" : "afterpay", {
                hidePaymentButton: !(payButtonType === "default"),
              })
              .mount(container);

            afterpayRadio.addEventListener("change", (event) => {
              if (event.target.checked) {
                updateCustomPaymentButton(afterpay);
                showCardsPaymentComponent(false);
                showCardsOptions(false);
                showKlarnaPaymentComponent(false);
                showAfterpayPaymentComponent(true);
              }
            });

            // Show this component by default if it is the only one in the available components
            if (availableComponents.size === 1) {
              afterpayRadio.click();
            }
          } else {
            if (availableComponents.size === 1) {
              afterpayRadio.click();
            }
          }
        }

        if (availableComponents.has("klarna")) {
          // Ensure Klarna icon in payment list is updated
          const klarnaIcons = document.getElementById("klarna-icons");
          klarnaIcons.innerHTML = "";
          checkout
            .getComponentInfo("klarna")
            ?.networkInformation?.map((info) => info.logoUrl)
            .slice(0, 4)
            .forEach((url) => {
              const img = document.createElement("img");
              img.src = url;
              klarnaIcons.appendChild(img);
            });

          if (!checkout.isDroppedIn("klarna")) {
            showKlarnaPaymentMethod(true);

            // Placeholder for dropping in the klarna payment component
            const container = document.getElementById(
              "klarna-component-container"
            );

            // Already drop in cards component so that it renders immediately
            const klarna = checkout
              .dropIn(isStripeProvider ? "stripe:klarna" : "klarna", {
                hidePaymentButton: !(payButtonType === "default"),
              })
              .mount(container);

            klarnaRadio.addEventListener("change", (event) => {
              if (event.target.checked) {
                updateCustomPaymentButton(klarna);
                showCardsPaymentComponent(false);
                showCardsOptions(false);
                showAfterpayPaymentComponent(false);
                showKlarnaPaymentComponent(true);
              }
            });

            // Show this component by default if it is the only one in the available components
            if (availableComponents.size === 1) {
              klarnaRadio.click();
            }
          } else {
            if (availableComponents.size === 1) {
              klarnaRadio.click();
            }
          }
        }
      },
    };

    // Initialises the SDK
    const checkout = await new Payoneer.CheckoutWeb(configs);

    // Makes instance available in window
    window.checkout = checkout;

    document.getElementById("loading-message").style.display = "none";

    if (checkout.state === "LOADED") {
      document.getElementById("loading-message").style = "display: none;";

      // Checks which dropin components are available based on the list response
      const availableComponents = checkout.availableDropInComponents();
      console.log("Available components", availableComponents);
      setAvailableComponents(availableComponents);

      // Update the UI once the list response is received so that components become visible
      document.getElementById("payment-methods").style = "display: block;";
    }
  } else {
    document.getElementById("payment-methods-list").classList.remove("hidden");
    document.getElementById("loading-message").classList.add("hidden");
    document
      .getElementById("payment-list-component")
      .setAttribute("env", getIE());
    document
      .getElementById("payment-list-component")
      .setAttribute("long-id", longId);
  }
}

function setAvailableComponents(availableComponents) {
  document.getElementById("available-components").textContent = [
    "Available components: ",
  ]
    .concat(availableComponents.map((comp) => comp.name))
    .join(" ");
}

async function getListResult() {
  // Calculates payment amount based on payment outcome query parameter
  const amount = getAmount();

  // Sets country based on query parameter (used for triggering abort scenario with merchant risk rule)
  const country = getCountry();

  // Sets language based on query parameter
  const language = getLanguage();

  const division = getDivision();

  return generateList(amount, country, language, "USD", division);
}

async function getLongId() {
  const searchParams = new URLSearchParams(location.search);

  if (searchParams.has("listId")) {
    return searchParams.get("listId");
  }

  const listData = await getListResult();

  const outcome = getPaymentOutcome();

  switch (outcome) {
    case "error":
      return "657af292bd2dx24c0a9cf07cl3jphnlp1iruhlio061evom047";
    case "alreadypaid":
      return "6731d7569e99650001ea64b0l6iff867etchoafjmi0kjn7dj7";
    case "expiredlist":
      return "6731c5509e99650001ea623elrdfkf8vqeo9eauobobjc71m78";
    default:
      return listData.id;
  }
}

function getIE() {
  const searchParams = new URLSearchParams(location.search);

  if (searchParams.has("env")) {
    return searchParams.get("env");
  }

  return defaultEnv;
}

function showCardsPaymentMethod(boolean) {
  const cardsPaymentMethod = document.getElementById("cards-payment-method");
  if (boolean) {
    cardsPaymentMethod.classList.remove("hidden");
  } else {
    cardsPaymentMethod.classList.add("hidden");
  }
}

function showCardsPaymentComponent(boolean) {
  const cardsPaymentMethod = document.getElementById("cards-payment-method");
  const cardsComponentContainer = document.getElementById("cards-container");
  if (boolean) {
    cardsPaymentMethod.classList.add("selected");
    cardsComponentContainer.style = "display: block;";
  } else {
    cardsPaymentMethod.classList.remove("selected");
    cardsComponentContainer.style = "display: none;";
  }
}

function showCardsOptions(boolean) {
  const cardsOptions = document.getElementById("cards-options");
  if (boolean) {
    cardsOptions.style = "display: block;";
  } else {
    cardsOptions.style = "display: none;";
  }
}

function showAfterpayPaymentMethod(boolean) {
  const afterpayPaymentMethod = document.getElementById(
    "afterpay-payment-method"
  );
  if (boolean) {
    afterpayPaymentMethod.classList.remove("hidden");
  } else {
    afterpayPaymentMethod.classList.add("hidden");
  }
}

function showAfterpayPaymentComponent(boolean) {
  const afterpayComponentContainer =
    document.getElementById("afterpay-container");
  const afterpayPaymentMethod = document.getElementById(
    "afterpay-payment-method"
  );
  if (boolean) {
    afterpayComponentContainer.style = "display: block;";
    afterpayPaymentMethod.classList.add("selected");
  } else {
    afterpayComponentContainer.style = "display: none;";
    afterpayPaymentMethod.classList.remove("selected");
  }
}

function showKlarnaPaymentMethod(boolean) {
  const klarnaPaymentMethod = document.getElementById("klarna-payment-method");
  if (boolean) {
    klarnaPaymentMethod.classList.remove("hidden");
  } else {
    klarnaPaymentMethod.classList.add("hidden");
  }
}

function showKlarnaPaymentComponent(boolean) {
  const klarnaComponentContainer = document.getElementById("klarna-container");
  const klarnaPaymentMethod = document.getElementById("klarna-payment-method");
  if (boolean) {
    klarnaComponentContainer.style = "display: block;";
    klarnaPaymentMethod.classList.add("selected");
  } else {
    klarnaComponentContainer.style = "display: none;";
    klarnaPaymentMethod.classList.remove("selected");
  }
}

function setUpDemoCards() {
  // User can copy a demo card number to paste into the card number input
  const numbers = document.getElementsByClassName("demo-card-number");

  Array.from(numbers).forEach((element) =>
    element.addEventListener("click", copyToClipboard)
  );
}

// Update background color of default pay button
function updatePayButtonBackgroundColor(event) {
  const newColor = event.target.value;
  const cards = document.getElementById("payoneer-cards-component");
  cards.setStyles({
    primaryColor: newColor,
  });
}

// Update text color of default pay button
function updatePayButtonTextColor(event) {
  const newColor = event.target.value;
  const cards = document.getElementById("payoneer-cards-component");
  cards.setStyles({
    primaryTextColor: newColor,
  });
}

// Handler for choosing the default payment button option (button displayed in cards component)
function handleSelectDefaultPayButton(event) {
  const params = new URLSearchParams(window.location.search);
  params.set("payButtonType", event.target.value);
  window.location.search = params.toString();
}

// Handler for choosing the custom pay button option (store custom button is displayed)
function handleSelectCustomPayButton(event) {
  const params = new URLSearchParams(window.location.search);
  params.set("payButtonType", event.target.value);
  window.location.search = params.toString();
}

// Secret function for toggling dark theme so we can check styling options support
function handleToggleDarkModeClick() {
  const checkoutPage = document.getElementById("main-content");
  checkoutPage.classList.toggle("dark-mode");
  const cards = document.getElementById("payoneer-cards-component");
  if (checkoutPage.classList.contains("dark-mode")) {
    cards.setStyles({
      primaryColor: "#727bff",
      primaryTextColor: "#000000",
    });
    document.getElementById("toggle-dark").innerHTML = "Light mode";
  } else {
    cards.setStyles({
      primaryColor: null,
      primaryTextColor: null,
    });
    document.getElementById("toggle-dark").innerHTML = "Dark mode";
  }
}

// Makes the demo cards visible so user can copy a demo card number
function handleShowDemoCardsClick() {
  const button = document.getElementById("demo-show");
  button.style = "display: none;";
  const demoCards = document.getElementById("demo-cards");
  demoCards.style = "display: block;";
}

// Hides demo cards
function handleHideDemoCardsClick() {
  const button = document.getElementById("demo-show");
  button.style = "display: flex;";
  const demoCards = document.getElementById("demo-cards");
  demoCards.style = "display: none;";
}

// When user clicks on proceed to payment, generates a HOSTED list session and redirects to hosted page
function handleStandaloneRedirectClick(method) {
  const amount = getAmount();
  const country = getCountry();
  const language = getLanguage();
  const theme = getTheme();

  generateList(amount, country, language, "USD", getDivision()).then((result) => {
    window.location.href = result.url;
  });
}

// Used for copying demo card numbers to clipboard
function copyToClipboard(event) {
  const element = event.target;
  const text = element.textContent;
  navigator.clipboard.writeText(text);
  element.style.backgroundColor = "#6dd18c";
  element.innerHTML = "Copied";
  setTimeout(() => {
    element.style.backgroundColor = "#e9e9e9";
    element.innerHTML = text;
    handleHideDemoCardsClick();
  }, 2000);
}

// Sets initial value of outcome select menu based on query parameter
function setOutcomeSelect() {
  const params = new URLSearchParams(window.location.search);
  const paymentOutcome = params.get("paymentOutcome");
  if (paymentOutcome) {
    document.getElementById("outcome").value = paymentOutcome;
  }
}

function setPreselection() {
  const params = new URLSearchParams(window.location.search);
  const usePreselection = params.get("usePreselection");
  if (usePreselection && usePreselection == "false") {
    document.getElementById("hosted-preselection-checkbox").checked = false;
  } else {
    document.getElementById("hosted-preselection-checkbox").checked = true;
  }
}

// Sets initial value of language select menu based on query parameter
function setLanguageSelect() {
  const params = new URLSearchParams(window.location.search);
  const language = params.get("language");
  if (language) {
    document.getElementById("language").value = language;
  } else {
    document.getElementById("language").value = "en";
  }
}

// Returns the payment outcome based on query parameter
function getPaymentOutcome() {
  const params = new URLSearchParams(window.location.search);
  const paymentOutcome = params.get("paymentOutcome")
    ? params.get("paymentOutcome")
    : null;
  return paymentOutcome;
}

// Returns the deferral based on payment outcome
function getDeferral() {
  const paymentOutcome = getPaymentOutcome();
  if (paymentOutcome === "abort") {
    return "DEFERRED";
  } else {
    return "NON_DEFERRED";
  }
}

// Checks query params to see if error case was selected
function getError() {
  const params = new URLSearchParams(window.location.search);
  return params.has("paymentOutcome") &&
    params.get("paymentOutcome") === "error"
    ? true
    : false;
}

// Returns language value based on query parameter
function getLanguage() {
  const params = new URLSearchParams(window.location.search);
  return params.has("language") ? params.get("language") : "en";
}

function getDivision() {
  const params = new URLSearchParams(window.location.search);
  return params.has("division") ? params.get("division") : "1";
}

// Checks URL params to see if default or custom pay button was chosen
function getPayButtonType() {
  const params = new URLSearchParams(window.location.search);
  return params.has("payButtonType") ? params.get("payButtonType") : "default";
}

// Checks which of the two hosted page theme options is selected
function getTheme() {
  if (document.getElementById("payoneer-theme").checked) {
    return "payoneer";
  } else if (document.getElementById("garden-theme").checked) {
    return "garden";
  } else {
    console.error("Error fetching theme");
  }
}

// Returns hosted page style settings given a particular theme
function getThemeSettings(theme, setting) {
  const payoneerSettings = {
    displayName: "My Store",
    primaryColor: "#2196F3",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Payoneer_logo.svg/1024px-Payoneer_logo.svg.png",
    backgroundType: "BACKGROUND_IMAGE",
    backgroundColor: "#ff4700",
    backgroundImageUrl:
      "https://optile.github.io/cards-component-demo/public/map.jpg",
  };

  const gardenSettings = {
    displayName: "Garden Pro",
    primaryColor: "#67a300",
    logoUrl: "https://optile.github.io/cards-component-demo/public/garden.png",
    backgroundType: "BACKGROUND_IMAGE",
    backgroundColor: "#ff4700",
    backgroundImageUrl:
      "https://unsplash.com/photos/4PG6wLlVag4/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8M3x8Z2FyZGVuaW5nfGVufDB8fHx8MTY5ODAwOTM4MXww&force=true&w=1920",
  };

  switch (theme) {
    case "payoneer":
      return payoneerSettings[setting];
    case "garden":
      return gardenSettings[setting];
    default:
      return payoneerSettings[setting];
  }
}

// Returns amount value based on query parameter (used for triggering different payment scenarios in TESTPSP)
function getAmount() {
  const paymentOutcome = getPaymentOutcome();

  let amount;

  switch (paymentOutcome) {
    case "success":
      amount = 15.0;
      break;
    case "error":
      amount = 15.0;
      break;
    case "abort":
      amount = 4.02;
      break;
    case "retry":
      amount = 1.03;
      break;
    case "3ds2":
      amount = 1.23;
      break;
    case "tryothernetwork":
      amount = 1.2;
      break;
    case "tryotheraccount":
      amount = 1.21;
      break;
    default:
      amount = 15.0;
      break;
  }

  return amount;
}

function getCountry() {
  const languageMap = {
    fr: "FR",
    de: "DE",
    ro: "RO",
    ru: "RU",
    es: "ES",
    th: "TH",
    zh: "CN",
    en: "US",
    el: "GR",
    ja: "JP",
    sv: "SE",
  };

  const params = new URLSearchParams(window.location.search);
  const language = params.get("language");

  if (!language) {
    return languageMap.en;
  }

  return languageMap[language] || languageMap.en;
}

// List generator function which uses demo backend on given IE, by default it uses checkout integration
function generateList(
  amount,
  country,
  language,
  currency = "USD",
  division = "1"
) {
  const listRequest = {
    currency,
    amount,
    country,
    division,
    customer: {
      number: "777",
      firstName: "John",
      lastName: "Doe",
      birthday: "1977-09-13",
      email: "afterpay_visa_successful@payoneer.com",
    },
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(listRequest),
  };

  return new Promise((resolve, reject) => {
    const url = `https://api.${getIE()}.oscato.com/checkout/session`;
    fetch(url, options)
      .then((res) => res.json())
      .then((listResponse) => {
        resolve(listResponse);
      })
      .catch((err) => reject(err));
  });
}
