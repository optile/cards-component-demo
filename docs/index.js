window.addEventListener("DOMContentLoaded", async () => {
    // Sets up pay button according to which type is requested, default or custom
    setUpPayButton()

    // Update the select menu for outcome based on query param
    setOutcomeSelect();

    // Update the select menu for language based on query param
    setLanguageSelect();

    // User can select payment outcome
    setUpPaymentOutcomeListener();

    // User can select language used in cards component
    setUpLanguageSelectListener();

    // Sets up the demo cards tool that is shown on right hand side of screen
    setUpDemoCards()

    // TODO - replace this with proper method when API available - User can select primary color which sets background of pay button
    document.getElementById("button-color-picker").addEventListener("input", updatePayButtonBackgroundColor);

    // TODO - replace this with proper method when API available - User can select primary text color which sets text color of pay button
    document.getElementById("button-text-color-picker").addEventListener("input", updatePayButtonTextColor);

    // Generates a HOSTED list session and redirects when pay button is clicked in HOSTED scenario for cards
    document.getElementById("cards-hosted-redirect-button").addEventListener("click", (event) => {
        event.preventDefault();
        handleStandaloneRedirectClick("cards");
    });

    // Generates a HOSTED list session and redirects when pay button is clicked in HOSTED scenario for cards
    document.getElementById("afterpay-hosted-redirect-button").addEventListener("click", (event) => {
        event.preventDefault();
        handleStandaloneRedirectClick("afterpay");
    });

    // Sets up chooser between hosted and embedded
    setUpIntegrationSelector();

    try {
        initPayment();
    } catch(e) {
        console.error("could not initiate payment", e.message)
    }

});

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
    containers.forEach(container => {
        container.style.display = "block";
    });
}

function hideHostedButtonContainers() {
    const containers = document.querySelectorAll(".redirect-button-container");
    containers.forEach(container => {
        container.style.display = "none";
    });
}

function showEmbeddedPaymentContainers() {
    const containers = document.querySelectorAll(".payment-component-container");
    containers.forEach(container => {
        container.style.display = "block";
    });
}

function hideEmbeddedPaymentContainers() {
    const containers = document.querySelectorAll(".payment-component-container");
    containers.forEach(container => {
        container.style.display = "none";
    });
}

// Sets up chooser between hosted and embedded
function setUpIntegrationSelector() {
    const payButtonType = getPayButtonType();

    // User can see embedded cards component
    document.getElementById("embedded").addEventListener("change", (event) => {
        handleSelectEmbedded(event);
    });

    // User can see button which redirects to hosted payment page
    document.getElementById("hosted").addEventListener("change", (event) => {
        handleSelectHosted(event);
    });

    // Hide styling options and show only redirect to hosted button
    function handleSelectHosted() {

        showHostedButtonContainers();
        hideEmbeddedPaymentContainers();
        document.getElementById("styling-options").style = "display: none;"
        document.getElementById("hosted-theme").style = "display: block;"
        document.getElementById("custom-pay-button-container").style = "display: none;"
        document.getElementById("payment-button-choice").style = "display: none;"
    }

    // Show styling options and only cards component
    function handleSelectEmbedded() {
        hideHostedButtonContainers()
        showEmbeddedPaymentContainers();
        document.getElementById("styling-options").style = payButtonType === "default" ? "display: block;" : "display: none;";
        document.getElementById("hosted-theme").style = "display: none;"
        document.getElementById("custom-pay-button-container").style = payButtonType === "custom" ? "display: block;" : "display: none;";
        document.getElementById("payment-button-choice").style = "display: block;";
    }
}

function setUpPayButton() {
    // Sets pay button type
    const payButtonType = getPayButtonType();

    // Set the chosen integration to embedded by default
    document.getElementById("embedded").checked = true;

    if(payButtonType === "default") {
        document.getElementById("default-option").checked = true;
    }
    else if(payButtonType === "custom") {
        document.getElementById("styling-options").style = "display: none";
        document.getElementById("custom-pay-button-container").style = "display: block";
        document.getElementById("custom-option").checked = true;
    }
    else {
        document.getElementById("default-option").checked = true;
    }

    // Pay button is displayed inside cards component
    document.getElementById("default-option").addEventListener("change", (event) => {
        handleSelectDefaultPayButton(event);
    });

    // Pay button is displayed underneath store options and hidden in cards component
    document.getElementById("custom-option").addEventListener("change", (event) => {
        handleSelectCustomPayButton(event);
    });
}

async function initPayment() {

    // Calculates payment amount based on payment outcome query parameter
    const amount = getAmount();

    // Sets country based on query parameter (used for triggering abort scenario with merchant risk rule)
    const country = getCountry();

    // Sets language based on query parameter
    const language = getLanguage();

    // Sets whether there should be a list fetching error or not
    const isError = getError();

    const payButtonType = getPayButtonType();

    // Generate a list session
    const listResult = await generateList("EMBEDDED", amount, country, language, null);

    const longId = isError ? "657af292bd2dx24c0a9cf07cl3jphnlp1iruhlio061evom047" : listResult.identification.longId;

    // configurations for the Checkout Web SDK
    const configs = {
        env: "pi-nightly.integration", // test | live | int-env-name
        longId: longId,
        preload: ["cards", "afterpay"], // loads cards and afterpay script as soon as page loads so that rendering using dropIn is fast
        onBeforeError: async(_checkout, componentName, errorData) => {
            console.error("On before error called",_checkout, componentName, errorData);
            document.getElementById("payment-methods").style.display = "none";
            const message = document.getElementById("custom-override-message");
            message.innerHTML = `onBeforeError called in ${componentName}`;
            message.style = "background-color: red; display: flex;";
            return new Promise((resolve) => {
                resolve(false);
            });
        },
        onBeforeCharge: async () => {
            console.log("On before charge called");
            const message = document.getElementById("custom-override-message");
            message.innerHTML = "Awaiting onBeforeCharge result..."
            message.style = "display: flex;";
            return new Promise((resolve) => {
                setTimeout(() => {
                    message.style = "background-color: green; display: flex;";
                    message.innerHTML = "onBeforeCharge success! &#10003;"
                    setTimeout(() => {
                        message.style = "background-color: orange; display: none;";
                        resolve(true);
                    }, 1000)
                }, 1000)
            });
        }
    }
    
    // Initialises the SDK
    const checkout = await new Payoneer.CheckoutWeb(configs);

    document.getElementById("loading-message").style.display = "none";

    function createPaymentListener(paymentComponent) {
        return function(event) {
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
            payButton.removeEventListener('click', currentPaymentListener);
        }

        currentPaymentListener = createPaymentListener(component);

        // Add the new listener
        payButton.addEventListener('click', currentPaymentListener);
    }

    if(checkout.state === "LOADED") {
        document.getElementById("loading-message").style = "display: none;";

        // Checks which dropin components are available based on the list response
        const availableComponents = checkout.availableDropInComponents();
        document.getElementById("available-components").textContent =["Available components: "].concat(availableComponents.map(comp => comp.name)).join(" ");
        
        // Radio button inputs for the Payoneer-provided payment methods
        const cardsRadio = document.getElementById("card-radio");
        const afterpayRadio = document.getElementById("afterpay-radio");

        // Check if cards is available as a drop-in component and render cards option in payment methods if so
        if(availableComponents.find(component => component.name === "cards")) {
            showCardsPaymentMethod(true);

            // This is a container for the payoneer-cards component, hidden by default and shown when cards radio is clicked
            const container = document.getElementById("cards-component-container")

            // Already drop in cards component so that it renders immediately
            const cards = checkout.dropIn("cards", {
                hidePaymentButton: !(payButtonType === "default")
            }).mount(container);

            // When cards is selected, display the payoneer-cards component (and some extra configuration settings related to cards)
            cardsRadio.addEventListener("change", (event) => {
                if(event.target.checked) {
                    updateCustomPaymentButton(cards);
                    showCardsPaymentComponent(true);
                    showCardsOptions(true);
                    // Adds a click event handler to the custom pay button that triggers payment in cards component
                    showAfterpayPaymentComponent(false);
                }
            });

            // Show this component by default if it is the only one in the available components
            if(availableComponents.length === 1) {
                cardsRadio.click()
            }
        }

        // If Afterpay is available as a drop-in component, show it in the payment methods list
        if(availableComponents.find(component => component.name === "afterpay")) {
            showAfterpayPaymentMethod(true);

            // Placeholder for dropping in the Afterpay payment component
            const container = document.getElementById("afterpay-component-container")

            // Already drop in cards component so that it renders immediately
            const afterpay = checkout.dropIn("afterpay", {
                
            }).mount(container);

            console.log(afterpay)

            afterpayRadio.addEventListener("change", (event) => {
                if(event.target.checked) {
                    updateCustomPaymentButton(afterpay);
                    showCardsPaymentComponent(false);
                    showCardsOptions(false);
                    showAfterpayPaymentComponent(true)
                }
            });

            // Show this component by default if it is the only one in the available components
            if(availableComponents.length === 1) {
                afterpayRadio.click()
            }
        }
        // Update the UI once the list response is received so that components become visible
        document.getElementById("payment-methods").style = "display: block;";
    }
}

function showCardsPaymentMethod(boolean) {
    const cardsPaymentMethod = document.getElementById("cards-payment-method");
    if(boolean) {
        cardsPaymentMethod.style = "display: block;";
    }
    else {
        cardsPaymentMethod.style = "display: none;";
    }
}

function showCardsPaymentComponent(boolean) {
    const cardsComponentContainer = document.getElementById("cards-container");
    if(boolean) {
        cardsComponentContainer.style = "display: block;";
    }
    else {
        cardsComponentContainer.style = "display: none;";
    }
}

function showCardsOptions(boolean) {
    const cardsOptions = document.getElementById("cards-options");
    if(boolean) {
        cardsOptions.style = "display: block;";
    }
    else {
        cardsOptions.style = "display: none;";
    }
}

function showAfterpayPaymentMethod(boolean) {
    const afterpayPaymentMethod = document.getElementById("afterpay-payment-method");
    if(boolean) {
        afterpayPaymentMethod.style = "display: block;";
    }
    else {
        afterpayPaymentMethod.style = "display: none;";
    }
}

function showAfterpayPaymentComponent(boolean) {
    const afterpayComponentContainer = document.getElementById("afterpay-container");
    if(boolean) {
        afterpayComponentContainer.style = "display: block;";
    }
    else {
        afterpayComponentContainer.style = "display: none;";
    }
}

function setUpDemoCards() {
    // User can copy a demo card number to paste into the card number input
    const numbers = document.getElementsByClassName("demo-card-number");

    Array.from(numbers).forEach(element => element.addEventListener("click", copyToClipboard));

    
}

// Update background color of default pay button
function updatePayButtonBackgroundColor(event) {
    const newColor = event.target.value;
    const cards = document.getElementById("payoneer-cards-component");
    cards.setStyles({
        primaryColor: newColor
    });
}

// Update text color of default pay button
function updatePayButtonTextColor(event) {
    const newColor = event.target.value;
    const cards = document.getElementById("payoneer-cards-component");
    cards.setStyles({
        primaryTextColor: newColor
    })
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
    if(checkoutPage.classList.contains("dark-mode")) {
        cards.setStyles({
            primaryColor: "#727bff",
            primaryTextColor: "#000000"
        })
        document.getElementById("toggle-dark").innerHTML="Light mode"
    }
    else {
        cards.setStyles({
            primaryColor: null,
            primaryTextColor: null
        })
        document.getElementById("toggle-dark").innerHTML="Dark mode"
    }
}

// Makes the demo cards visible so user can copy a demo card number
function handleShowDemoCardsClick() {
    const button = document.getElementById("demo-show");
    button.style = "display: none;"
    const demoCards = document.getElementById("demo-cards");
    demoCards.style = "display: block;"
}

// Hides demo cards
function handleHideDemoCardsClick() {
    const button = document.getElementById("demo-show");
    button.style = "display: flex;"
    const demoCards = document.getElementById("demo-cards");
    demoCards.style = "display: none;"
}

// When user clicks on proceed to payment, generates a HOSTED list session and redirects to hosted page
function handleStandaloneRedirectClick(method) {
    
    const amount = getAmount();
    const country = getCountry();
    const language = getLanguage();
    const theme = getTheme()

    generateList("HOSTED", amount, country, language, theme, method).then(result => {
        window.location.href = result.redirect.url;
    });
}

// Used for copying demo card numbers to clipboard
function copyToClipboard(event) {
    const element = event.target;
    const text = element.textContent;
    navigator.clipboard.writeText(text);
    element.style.backgroundColor = "#6dd18c";
    element.innerHTML = "Copied"
    setTimeout(() => {
        element.style.backgroundColor = "#e9e9e9";
        element.innerHTML = text;
        handleHideDemoCardsClick();
    }, 2000)
}

// Sets initial value of outcome select menu based on query parameter
function setOutcomeSelect() {
    const params = new URLSearchParams(window.location.search);
    const paymentOutcome = params.get("paymentOutcome");
    if(paymentOutcome) {
        document.getElementById("outcome").value = paymentOutcome;
    }
}

// Sets initial value of language select menu based on query parameter
function setLanguageSelect() {
    const params = new URLSearchParams(window.location.search);
    const language = params.get("language");
    if(language) {
        document.getElementById("language").value = language;
    }
    else {
        document.getElementById("language").value = "en";
    }
}

// Returns country value based on query parameter
function getCountry() {
    const params = new URLSearchParams(window.location.search);
    return (params.has("paymentOutcome") && params.get("paymentOutcome") === "abort") ? "SE" : "US";
}

// Checks query params to see if error case was selected
function getError() {
    const params = new URLSearchParams(window.location.search);
    return (params.has("paymentOutcome") && params.get("paymentOutcome") === "error") ? true : false;
}

// Returns language value based on query parameter
function getLanguage() {
    const params = new URLSearchParams(window.location.search);
    return params.has("language") ? params.get("language") : "en";
}

// Checks URL params to see if default or custom pay button was chosen
function getPayButtonType() {
    const params = new URLSearchParams(window.location.search);
    return params.has("payButtonType") ? params.get("payButtonType") : "default";
}

// Checks which of the two hosted page theme options is selected
function getTheme() {
    if(document.getElementById("payoneer-theme").checked) {
        return "payoneer"
    }
    else if(document.getElementById("garden-theme").checked) {
        return "garden"
    }
    else {
        console.error("Error fetching theme")
    }
}

// Returns hosted page style settings given a particular theme
function getThemeSettings(theme, setting) {
    const payoneerSettings = {
        displayName: "My Store",
        primaryColor: "#2196F3",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Payoneer_logo.svg/1024px-Payoneer_logo.svg.png",
        backgroundType: "BACKGROUND_IMAGE",
        backgroundColor: "#ff4700",
        backgroundImageUrl: "https://optile.github.io/cards-component-demo/public/map.jpg"
    }

    const gardenSettings = {
        displayName: "Garden Pro",
        primaryColor: "#67a300",
        logoUrl: "https://optile.github.io/cards-component-demo/public/garden.png",
        backgroundType: "BACKGROUND_IMAGE",
        backgroundColor: "#ff4700",
        backgroundImageUrl: "https://unsplash.com/photos/4PG6wLlVag4/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8M3x8Z2FyZGVuaW5nfGVufDB8fHx8MTY5ODAwOTM4MXww&force=true&w=1920"
    }

    switch(theme) {
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
    const params = new URLSearchParams(window.location.search);

    const paymentOutcome = params.get("paymentOutcome") ? params.get("paymentOutcome") : null;

    let amount;

    switch(paymentOutcome) {
        case "success":
            amount = 15.00;
            break;
        case "error":
            amount = 15.00;
            break;
        case "abort":
            amount = 15.00;
            break;
        case "retry":
            amount = 1.03;
            break;
        case "3ds2":
            amount = 1.23;
            break;
        case "tryothernetwork":
            amount = 1.20;
            break;
        case "tryotheraccount":
            amount = 1.21;
            break;
        default:
            amount = 15.00;
            break;
    }

    return amount;
}

// List generator function which uses our unauthenticated pi-nightly list creation service for demo list sesssions
function generateList(integrationType, amount, country, language, theme, method) {

    function getPreselection(paymentMethod) {
        switch(paymentMethod) {
            case "cards":
                return [ "AMEX", "VISA", "MASTERCARD", "JCB"];
            case "afterpay":
                return [ "AFTERPAY"];
            default:
                return ["AMEX", "VISA", "MASTERCARD", "JCB", "AFTERPAY"]
        }
    }
    
    const listRequest = {
        allowDelete:false,
        callback: {
            cancelUrl: "https://optile.github.io/cards-component-demo/failed.html",
            notificationUrl: "https://dev.oscato.com/shop/notify.html",
            returnUrl: "https://optile.github.io/cards-component-demo/success.html",
            summaryUrl: "https://dev.oscato.com/shop/summary.html"
        },
        country: country,
        customer: {
            number: "777",
            name: {
                firstName: "John",
                lastName: "Doe"
            },
            birthday: "1977-09-13",
            email: "afterpay_visa_successful@payoneer.com",
            addresses: {
                billing: {
                        street: "Fake Street.",
                        houseNumber: "123",
                        zip: "80339",
                        state: "Californa",
                        city: "Los Angeles",
                        country: "US",
                        name: {
                        firstName: "First",
                        lastName: "Last"
                    }
                },
                shipping: {
                    street: "Fake Street.",
                    houseNumber: "123",
                    zip: "80339",
                    state: "Californa",
                    city: "Los Angeles",
                    country: "US",
                    name: {
                        firstName: "First",
                        lastName: "Last"
                    }
                }
            }
        },
        integration: integrationType,
        payment: {
            amount: amount,
            netAmount: (amount-0.01),
            taxAmount: 0.01,
            currency: "USD",
            reference: "Shop 101/20-03-2016"
        }, 
        preselection: {
            direction:"CHARGE",
            networkCodes: getPreselection(method)
        },
        presetFirst: false,
        style:{
            hostedVersion: "v5",
            language: language,
            displayName: getThemeSettings(theme, "displayName"),
            primaryColor: getThemeSettings(theme, "primaryColor"),
            logoUrl: getThemeSettings(theme, "logoUrl"),
            backgroundType: getThemeSettings(theme, "backgroundType"),
            backgroundColor: getThemeSettings(theme, "backgroundColor"),
            backgroundImageUrl: getThemeSettings(theme, "backgroundImageUrl"),
        },
        transactionId: "tr101",
        updateOnly:false
    }

    const options = {
        method: "POST",
        body: JSON.stringify(listRequest)
    }

    return new Promise((resolve, reject) => {
        fetch("https://api.pi-nightly.integration.oscato.com/demo/lists", options)
        .then(res => res.json()).then(listResponse => {
            resolve(listResponse);
        }).catch(err => reject(err));
    })

    
}