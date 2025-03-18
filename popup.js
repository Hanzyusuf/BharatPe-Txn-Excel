import { convertToCSV, downloadCSV } from "./csvUtils.js";
import { fetchTransactionData } from "./transactions.js"

document.addEventListener("DOMContentLoaded", () => {
    initializeSavedValues();
    setupPopupMenu();
    updatePopupMenu();
});

// Listen for tab changes and update UI
browser.tabs.onActivated.addListener(updatePopupMenu);
browser.tabs.onUpdated.addListener(updatePopupMenu);

function initializeSavedValues(){
    /* Functions for Input of 'Include Header' */
    const includeHeader_CB = document.getElementById("includeHeaderInput");
    // Load saved preference
    browser.storage.local.get("includeHeader").then((data) => {
        includeHeader_CB.checked = data.includeHeader !== false; // Default to true
    });
    // Save preference when changed
    includeHeader_CB.addEventListener("change", function () {
        browser.storage.local.set({ includeHeader: includeHeader_CB.checked });
    });

    /* Functions for Input of 'Copy in Excel DateTime Format' */
    const excelDateTime_CB = document.getElementById("excelDateTimeFormat");
    // Load saved preference
    browser.storage.local.get("excelDateTime").then((data) => {
        excelDateTime_CB.checked = data.excelDateTime !== false; // Default to true
    });
    // Save preference when changed
    excelDateTime_CB.addEventListener("change", function () {
        browser.storage.local.set({ excelDateTime: excelDateTime_CB.checked });
    });
}

function setupPopupMenu(){
    /* Set start and end to current date */
    document.getElementById("start-date").valueAsDate = new Date();
    document.getElementById("end-date").valueAsDate = new Date();

    document.getElementById("copyCurrent").onclick = () => sendMessageToContentScript("copyCurrent");
    document.getElementById("copyAll").onclick = () => sendMessageToContentScript("copyAll");
    document.getElementById('download-csv-btn').onclick = handleCSVDownload;
}

function updatePopupMenu(){
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (tabs.length === 0) return;
        // const validURL = tabs[0].url.includes("bharatpe.in");
        const validURL = tabs[0].url.includes("bharatpe.in") && tabs[0].url.includes("transactionhistory");

        // Get elements
        const copyDataBtn = document.getElementById("copyCurrent");
        const copyAllDataBtn = document.getElementById("copyAll");
        // const downloadCsvBtn = document.getElementById('download-csv-btn');
        const errorMessage = document.getElementById("errorMessage");

        if (!validURL) {
            copyDataBtn.disabled = true;
            copyAllDataBtn.disabled = true;
            // downloadCsvBtn.disabled = true;
            errorMessage.style.display = "block";
        } else {
            copyDataBtn.disabled = false;
            copyAllDataBtn.disabled = false;
            // downloadCsvBtn.disabled = false;
            errorMessage.style.display = "none";
        }

    });
}

function sendMessageToContentScript(action, data = {}) {
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        // browser.tabs.sendMessage(tabs[0].id, { action });
        browser.tabs.sendMessage(tabs[0].id, { action, ...data });
    });
}

async function handleCSVDownload(){
    try {
        document.getElementById('status-message').textContent = "Downloading...";
        document.getElementById('status-message').style.color = "grey";

        const startDateInput = document.getElementById("start-date").value;
        const endDateInput = document.getElementById("end-date").value;

        if (!startDateInput || !endDateInput) {
            document.getElementById('status-message').textContent = "Please select a valid date range.";
            document.getElementById('status-message').style.color = "red";
            return;
        }

        // Convert to UNIX timestamps in milliseconds
        const startDate = new Date(startDateInput).setHours(0, 0, 0, 0);
        const endDate = new Date(endDateInput).setHours(23, 59, 59, 999);

        const transactions = await fetchTransactionData(startDate, endDate);

        if(transactions.error !== false){
            throw new Error(transactions.message);
        }

        const csvContent = await convertToCSV(transactions.data);
        const filename = `BharatPe Transaction History ${document.getElementById('start-date').value} to ${document.getElementById('end-date').value}.csv`;
        downloadCSV(csvContent, filename);

        document.getElementById('status-message').textContent = "Download successful!";
        document.getElementById('status-message').style.color = "green";
    } catch (error) {
        console.error('Error downloading CSV:', error);

        document.getElementById('status-message').textContent = "Error fetching transactions!\n" + error;
        document.getElementById('status-message').style.color = "red";
    }
}