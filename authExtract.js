browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    /* if (message.action === "extractAuth") {
        extractAuthDetails().then(result => {
            console.log("Extract Auth Successful:", result); // Debug
            sendResponse({ success: result });
        }).catch(error => {
            console.error("Error extracting auth:", error);
            sendResponse({ success: false, error: error});
        });

        return true; // Important: Ensures async response works
    } */
    if (message.action === "extractAuth") {
        extractAuthDetails();
        return false; // No need for async response handling anymore
    }
});

function extractAuthDetails() {
    try {
        const userInfo = localStorage.getItem("USER_INFO");
        const token = localStorage.getItem("TOKEN");

        if (!userInfo || !token) {
            console.log("No Token or MerchantID found. Please login on BharatPe.");
            return false;
        }

        const merchantId = JSON.parse(userInfo).merchant_id;

        // Store Token & Merchant ID directly in browser.storage.local
        browser.storage.local.set({
            TOKEN: token,
            MERCHANT_ID: merchantId
        }).then(() => {
            console.log("Auth data stored successfully in local storage!");
        }).catch(error => {
            console.error("Error storing auth data:", error);
        });

    } catch (error) {
        console.error("Error extracting auth details:", error);
    }
}

// Run extraction on page load
extractAuthDetails();