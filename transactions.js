async function extractAuth() {        
    const tabs = await browser.tabs.query({});
    const targetTab = tabs.find(tab => tab.url && tab.url.includes("enterprise.bharatpe.in"));

    if (!targetTab) {
        console.error("No BharatPe tab found.");
        throw new Error("No BharatPe tab found.");
    }

    try{
        browser.tabs.sendMessage(targetTab.id, { action: "extractAuth" });

        // we delay execution to let the values get stored
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    } catch (error) {
        console.error("Error extracting auth:", error);
        throw error;
    }
}

async function fetchAuthData() {
    let storedData = await browser.storage.local.get(["TOKEN", "MERCHANT_ID"]);

    if (!storedData.TOKEN || !storedData.MERCHANT_ID) {
        console.log("Auth not found, trying extraction...");
        authExtracted = await extractAuth();

        // Fetch again after extraction attempt
        storedData = await browser.storage.local.get(["TOKEN", "MERCHANT_ID"]);

        if (!storedData.TOKEN || !storedData.MERCHANT_ID) {
            throw new Error("Token or Merchant ID still missing! Try to login again.");
        }
    }

    return storedData;
}

export async function fetchTransactionData(startDate, endDate) {
    try {
        const authData = await fetchAuthData();

        const { TOKEN, MERCHANT_ID } = authData;

        const url = `https://payments-tesseract.bharatpe.in/api/v1/merchant/transactions?module=PAYMENT_QR&merchantId=${MERCHANT_ID}&sDate=${startDate}&eDate=${endDate}&pageSize=10000&pageCount=1&isFromOtDashboard=0`;

        console.log("Fetching from:", url);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "token": TOKEN
            }
        });

        if (!response.ok) {
            console.error(`Fetch Failed: ${response.status} ${response.statusText}`);
            throw new Error(`Fetch Failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Fetched Data:", data);
        return {error: false, message: "", data: data.data.transactions || []};
    } catch (error) {
        console.error("Error Fetching:", error);
        return {error: true, message: error};
    }
}