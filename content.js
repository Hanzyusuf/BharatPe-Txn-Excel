function extractTableData() {
    const table = document.querySelector("#datatable_success tbody");
    if (!table) {
        showToast("Table not found!", "error");
        return;
    }

    let data = "";
    table.querySelectorAll("tr").forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 7) {
            const receivedFrom = cells[2].innerText.trim();
            const utrId = cells[3].innerText.trim();
            const vpa = cells[4].innerText.trim();
            const dateTimeRaw = cells[6].innerText.trim();
            const amountRaw = cells[7].innerText.trim();

            // Convert date to Excel format (YYYY-MM-DD HH:MM:SS)
            const dateTime = convertToExcelDate(dateTimeRaw);

            // Remove ₹ symbol and spaces
            const amount = amountRaw.replace(/₹|\s/g, "");

            // Format: Column separated by tab, row by newline
            data += `${receivedFrom}\t${utrId}\t${vpa}\t${dateTime}\t${amount}\n`;
        }
    });

    if (data && data.length !== 0) {
        browser.runtime.sendMessage({ action: "copyToClipboard", data: data }).then(response => {
            showToast("Data copied to clipboard!", "success");
        });
    } else {
        showToast("No data found!", "error");
    }
}

function convertToExcelDate(dateStr) {
    const match = dateStr.match(/(\d{1,2})\s(\w{3})\s'(\d{2})\s\|\s(\d{1,2}):(\d{2})\s(am|pm)/i);
    if (!match) return dateStr;

    const months = { "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04", "May": "05", "Jun": "06",
                     "Jul": "07", "Aug": "08", "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12" };
    
    let [_, day, month, year, hours, minutes, meridian] = match;
    year = "20" + year; // Convert '25 to 2025
    if (meridian.toLowerCase() === "pm" && hours !== "12") hours = String(parseInt(hours) + 12);
    if (meridian.toLowerCase() === "am" && hours === "12") hours = "00";

    return `${year}-${months[month]}-${day.padStart(2, '0')} ${hours.padStart(2, '0')}:${minutes}:00`;
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

extractTableData();