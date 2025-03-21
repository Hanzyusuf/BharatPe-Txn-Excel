export async function convertToCSV(transactions) {
    // Fetch user preferences
    const { excelDateTime, includeHeader, columnOrder } = await browser.storage.local.get(["excelDateTime", "includeHeader", "columnOrder"]);
    const useExcelFormat = excelDateTime !== false; // Default to true
    const includeHeaders = includeHeader !== false; // Default to true

    // const headers = ["Received From", "UTR ID", "VPA", "Date & Time", "Amount"];

    /* const rows = transactions.map(txn => [
        txn.payerName.replace(/\s+/g,' ').trim(),  // "Received From"
        `UTR-${txn.bankReferenceNo}`,  // "UTR ID"
        txn.payeeIdentifier,  // "VPA"
        useExcelFormat 
            ? convertToExcelDateTime(txn.paymentTimestamp) 
            : convertToReadableDateTime(txn.paymentTimestamp),  // "Date & Time" based on storage setting
        formatAmount(txn.amount)  // "Amount" without rupee symbol
    ]); */

    // Default column order if not set
    const defaultColumns = [
        { id: "received_from", label: "Received From", value: txn => txn.payerName.replace(/\s+/g, ' ').trim() },
        { id: "utr_id", label: "UTR ID", value: txn => `UTR-${txn.bankReferenceNo}` },
        { id: "vpa", label: "VPA", value: txn => txn.payeeIdentifier },
        { id: "date_time", label: "Date & Time", value: txn => 
            useExcelFormat ? convertToExcelDateTime(txn.paymentTimestamp) : convertToReadableDateTime(txn.paymentTimestamp)
        },
        { id: "amount", label: "Amount", value: txn => formatAmount(txn.amount) }
    ];

    // Determine column order (use saved order or default order)
    const orderedColumns = (columnOrder || defaultColumns.map(col => col.id))
    .map(colId => defaultColumns.find(col => col.id === colId))
    .filter(col => col); // Remove any null values (if invalid column id is present)

    // Generate headers and rows
    const headers = orderedColumns.map(col => col.label);
    const rows = transactions.map(txn => orderedColumns.map(col => col.value(txn)));

     // Convert to CSV format
     const csvData = [
        ...(includeHeaders ? [headers.join("\t")] : []),
        ...rows.map(row => row.join("\t"))
    ].join("\n");

    return csvData;

    /* if(includeHeaders){
        return [headers.join("\t"), ...rows.map(row => row.join("\t"))].join("\n");    
    }
    return [...rows.map(row => row.join("\t"))].join("\n"); */
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
    const date = new Date(timestamp + 19800000);
    return (date.getTime() / 86400000) + 25569;
}

// Format date as YYYY-MM-DD h:mm A (e.g., 2025-03-16 7:41 PM)
function convertToReadableDateTime(timestamp) {
    const date = new Date(timestamp + 19800000);
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