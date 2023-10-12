window.addEventListener("DOMContentLoaded", () => {

    // Set the chosen integration to embedded by default
    document.getElementById("embedded").checked = true;

    // Calculates payment amount based on payment outcome query parameter
    const amount = getAmount();

    // Sets country based on query parameter (used for triggering abort scenario with merchant risk rule)
    const country = getCountry();

    // Sets language based on query parameter
    const language = getLanguage();

    // Update the select menu for outcome based on query param
    setOutcomeSelect();

    // Update the select menu for language based on query param
    setLanguageSelect();

    // User can select payment outcome
    document.getElementById("outcome").addEventListener("change", (event) => {
        const params = new URLSearchParams(window.location.search);
        params.set("paymentOutcome", event.target.value);
        window.location.search = params.toString();
    });

    // User can select language used in cards component
    document.getElementById("language").addEventListener("change", (event) => {
        const params = new URLSearchParams(window.location.search);
        params.set("language", event.target.value);
        window.location.search = params.toString();
    });

    // User can select primary color which sets background of pay button
    document.getElementById("button-color-picker").addEventListener("input", (event) => {
        const newColor = event.target.value;
        const cards = document.getElementById("cards-form");
        cards.setStyles({
            primaryColor: newColor
        })
    });

    // User can select primary text color which sets text color of pay button
    document.getElementById("button-text-color-picker").addEventListener("input", (event) => {
        const newColor = event.target.value;
        const cards = document.getElementById("cards-form");
        cards.setStyles({
            primaryTextColor: newColor
        })
    });

    // User can see embedded cards component
    document.getElementById("embedded").addEventListener("change", (event) => {
        handleSelectEmbedded();
    });

    // User can see button which redirects to hosted payment page
    document.getElementById("hosted").addEventListener("change", (event) => {
        handleSelectHosted();
    });

    // User can copy a demo card number to paste into the card number input
    const numbers = document.getElementsByClassName("demo-card-number");

    Array.from(numbers).forEach(element => element.addEventListener("click", copyToClipboard));

    // Immediately generate an EMBEDDED list session for use by cards component
    generateList("EMBEDDED", amount, country, language).then(result => {
        document.getElementById("cards-form").listurl = result?.links?.self;
    });

});

// Hide styling options and show only redirect to hosted button
function handleSelectHosted() {
    document.getElementById("button-container").style = "display: block;"
    document.getElementById("component-container").style = "display: none;"
    document.getElementById("styling-options").style = "display: none;"
}

// Show styling options and only cards component
function handleSelectEmbedded() {
    document.getElementById("button-container").style = "display: none;"
    document.getElementById("component-container").style = "display: block;"
    document.getElementById("styling-options").style = "display: block;"
}

// Secret function for toggling dark theme so we can check styling options support
function handleToggleDarkModeClick() {
    const checkoutPage = document.getElementById("main-content");
    checkoutPage.classList.toggle("dark-mode");
    const cards = document.getElementById("cards-form");
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
function handleStandaloneRedirectClick() {
    
    const amount = getAmount();
    const country = getCountry();
    const language = getLanguage();

    generateList("HOSTED", amount, country, language).then(result => {
        window.location.href = result?.redirect?.url;
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
    return (params.has("paymentOutcome") && params.get("paymentOutcome") === "abort") ? "SE" : "DE";
}

// Returns language value based on query parameter
function getLanguage() {
    const params = new URLSearchParams(window.location.search);
    return params.has("language") ? params.get("language") : "en";
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
function generateList(integrationType, amount, country, language) {

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
            email: "john.doe@example.com",
            number: "42"
        },
        integration: integrationType,
        payment: {
            amount: amount,
            netAmount: (amount-0.01),
            taxAmount: 0.01,
            currency: "EUR",
            reference: "Shop 101/20-03-2016"
        }, 
        preselection: {
            direction:"CHARGE",
            networkCodes: [
                "AMEX", "VISA", "MASTERCARD", "JCB"
            ]
        },
        presetFirst: false,
        style:{
            hostedVersion: "v5",
            language: language,
            displayName: "My Store",
            primaryColor: "#2196F3",
            logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Payoneer_logo.svg/1024px-Payoneer_logo.svg.png",
            backgroundType: "BACKGROUND_IMAGE",
            backgroundColor: "#ff4700",
            backgroundImageUrl: "https://optile.github.io/cards-component-demo/public/map.jpg"
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