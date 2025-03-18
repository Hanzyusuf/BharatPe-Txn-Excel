export async function convertToCSV(transactions) {
    // Fetch user preferences
    const { excelDateTime, includeHeader } = await browser.storage.local.get(["excelDateTime", "includeHeader"]);
    const useExcelFormat = excelDateTime !== false; // Default to true
    const includeHeaders = includeHeader !== false; // Default to true

    const headers = ["Received From", "UTR ID", "VPA", "Date & Time", "Amount"];

    const rows = transactions.map(txn => [
        txn.payerName.replace(/\s+/g,' ').trim(),  // "Received From"
        `UTR-${txn.bankReferenceNo}`,  // "UTR ID"
        txn.payeeIdentifier,  // "VPA"
        useExcelFormat 
            ? convertToExcelDateTime(txn.paymentTimestamp) 
            : convertToReadableDateTime(txn.paymentTimestamp),  // "Date & Time" based on storage setting
        formatAmount(txn.amount)  // "Amount" without rupee symbol
    ]);

    if(includeHeaders){
        return [headers.join("\t"), ...rows.map(row => row.join("\t"))].join("\n");    
    }
    return [...rows.map(row => row.join("\t"))].join("\n");
}

// Function to download CSV file
export function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Convert JavaScript date to Excel date format (days since 1899-12-30)
function convertToExcelDateTime(timestamp) {
    const date = new Date(timestamp);
    return (date.getTime() / 86400000) + 25569;
}

// Format date as YYYY-MM-DD h:mm A (e.g., 2025-03-16 7:41 PM)
function convertToReadableDateTime(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // Convert to 12-hour format

    return `${year}-${month}-${day} ${hours}:${minutes} ${ampm}`;
}

// Ensure amount has two decimal places
function formatAmount(amount) {
    return parseFloat(amount).toFixed(2);
}