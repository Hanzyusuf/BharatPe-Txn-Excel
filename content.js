let useExcelFormat = true;
let includeHeader = true;
let columnOrder = ["received_from", "utr_id", "vpa", "date_time", "amount"];
let separateDateTime = true;
let delimiter = ",";

browser.runtime.onMessage.addListener(async (message) => {
    // Check if the current URL is a BharatPe domain
    if (!window.location.hostname.includes("bharatpe.in")) {
        console.warn("Invalid URL: This extension only works on BharatPe.");
        return;
    }

    try {
        // Fetch stored preferences
        const data = await browser.storage.local.get(["excelDateTime", "includeHeader", "columnOrder", "separateDateTime", "fileFormat"]);
        useExcelFormat = data.excelDateTime !== false; // Default to true
        includeHeader = data.includeHeader !== false; // Default to true
        columnOrder = data.columnOrder || ["received_from", "utr_id", "vpa", "date_time", "amount"];
        separateDateTime = data.separateDateTime !== false; // Default to true

        delimiter = data.fileFormat === "tsv" ? "\t" : ","; // Choose between CSV (,) or TSV (tab)

        modifyColumnOrderForDateTime();

        if (message.action === "copyCurrent") {
            copyCurrentPageData();
        } else if (message.action === "copyAll") {
            extractAllTableData();
        }
    } catch (error) {
        console.error("Error fetching preferences:", error);
    }

    return true; // Important: Allows async handling
});

function copyCurrentPageData() {
    let data = extractTableData();
    if (data && data.length > 0) {

        if(includeHeader){
            data = getHeader() + data;
        }

        copyToClipboard(data);
        showToast("Current page data copied!", "success");
    } else {
        showToast("No data found!", "error");
    }
}

async function extractAllTableData() {
    let allData = "";

    while (true) {
        let pageData = extractTableData();
        if (!pageData) break; // Stop if no data on the page

        allData += pageData;

        let nextBtn = document.querySelector("#pagNextBtn");
        if (!nextBtn || getComputedStyle(nextBtn).pointerEvents === "none") {
            break; // Stop if Next button is disabled
        }

        nextBtn.click(); // Click Next button
        await waitForPageLoad(); // Wait for new data to load
    }

    if (allData && allData.length > 0) {

        if(includeHeader){
            allData = getHeader() + allData;
        }

        copyToClipboard(allData);
        showToast("All pages copied!", "success");
    } else {
        showToast("No data found!", "error");
    }
}

/* function getHeader() {
    return "Received From\tUTR ID\tVPA\tDate & Time\tAmount\n";
} */

function getHeader() {
    const defaultHeaders = {
        received_from: "Received From",
        utr_id: "UTR ID",
        vpa: "VPA",
        amount: "Amount"
    };

    if (separateDateTime) {
        defaultHeaders.date = "Date";
        defaultHeaders.time = "Time";
    } else {
        defaultHeaders.date_time = "Date & Time";
    }

    const headers = columnOrder.map(col => defaultHeaders[col] || col);
    return headers.join(delimiter) + "\n";
}

function extractTableData() {
    const table = document.querySelector("#datatable_success tbody");
    if (!table) return "";

    let data = "";
    table.querySelectorAll("tr").forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 7) {
            const receivedFrom = cells[2].innerText.trim();
            const utrId = "UTR-" + cells[3].innerText.trim();
            const vpa = cells[4].innerText.trim();
            const dateTimeRaw = cells[6].innerText.trim();
            const amountRaw = cells[7].innerText.trim();

            // Convert date to appropriate format
            let dateTime = "";
            let date = "";
            let time = "";
            if (separateDateTime) {
                date = convertToReadableDate(dateTimeRaw);
                time = convertToReadableTime(dateTimeRaw);
            } else {
                dateTime = convertDate(dateTimeRaw);
            }

            // Remove ₹ symbol and spaces
            const amount = amountRaw.replace(/[₹,]/g, '').trim();

            const rowData = {
                received_from: receivedFrom,
                utr_id: utrId,
                vpa: vpa,
                amount: amount
            };
            
            if (separateDateTime) {
                rowData.date = date;
                rowData.time = time;
            } else {
                rowData.date_time = dateTime;
            }

            // Arrange columns based on user preference
            data += columnOrder.map(col => rowData[col] || "").join(delimiter) + "\n";
        }
    });

    return data;
}

function waitForPageLoad() {
    return new Promise(resolve => {
        let checkInterval = setInterval(() => {
            let table = document.querySelector("#datatable_success tbody");
            if (table && table.querySelector("tr")) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 500);
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => console.error("Clipboard error:", err));
}

function showToast(message, type) {
    let toast = document.createElement("div");
    toast.innerText = message;
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.padding = "10px 20px";
    toast.style.color = "#fff";
    toast.style.background = type === "success" ? "green" : "red";
    toast.style.borderRadius = "5px";
    toast.style.zIndex = "9999";
    toast.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.3)";
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => document.body.removeChild(toast), 500);
    }, 2000);
}

function convertDate(dateStr){
    if(useExcelFormat){
        return convertToExcelDate(dateStr);
    }
    else{
        return convertToReadableDateTime(dateStr);    
    }
}

function convertToExcelDate(dateStr) {
    const months = {
        "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
        "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
    };

    const match = dateStr.match(/(\d+) (\w+) '(\d+) \| (\d+):(\d+) (\w+)/);
    if (!match) return "";

    let [, day, monthStr, year, hours, minutes, ampm] = match;
    let month = months[monthStr];
    let fullYear = 2000 + parseInt(year);  // Convert '25 to 2025

    hours = parseInt(hours);
    minutes = parseInt(minutes);
    if (ampm === "pm" && hours !== 12) hours += 12;
    if (ampm === "am" && hours === 12) hours = 0;

    let jsDate = new Date(fullYear, month - 1, day, hours, minutes);
    
    return jsDate.getTime() / 86400000 + 25569; // Convert to Excel format
}

function convertToReadableDate(dateStr) {
    const match = dateStr.match(/(\d{1,2}) (\w{3}) '(\d{2})/);
    if (!match) return dateStr;
    let [, day, month, year] = match;
    year = "20" + year; // Convert '25 to 2025
    return `${year}-${month}-${day.padStart(2, "0")}`;
}

function convertToReadableTime(dateStr) {
    const match = dateStr.match(/(\d{1,2}):(\d{2}) (am|pm)/i);
    if (!match) return dateStr;
    let [, hour, minute, meridian] = match;
    return `${hour}:${minute} ${meridian.toUpperCase()}`;
}

function convertToReadableDateTime(dateStr) {
    const months = {
        "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04", "May": "05", "Jun": "06",
        "Jul": "07", "Aug": "08", "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"
    };

    const match = dateStr.match(/(\d{1,2}) (\w{3}) '(\d{2}) \| (\d{1,2}):(\d{2}) (am|pm)/i);
    if (!match) return dateStr;

    let [, day, month, year, hour, minute, meridian] = match;
    year = "20" + year; // Convert '25 to 2025
    month = months[month];

    return `${year}-${month}-${day.padStart(2, "0")} ${hour}:${minute} ${meridian.toUpperCase()}`;
}

function modifyColumnOrderForDateTime(){
    // Adjust column order dynamically if separateDateTime is enabled
    columnOrder = separateDateTime 
    ? columnOrder.flatMap(col => (col === "date_time" ? ["date", "time"] : col)) 
    : columnOrder;
}