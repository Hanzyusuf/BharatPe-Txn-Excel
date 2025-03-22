export async function convertToCSV(transactions) {
    // Fetch user preferences
    const { excelDateTime, includeHeader, columnOrder, separateDateTime, fileFormat } = await browser.storage.local.get(["excelDateTime", "includeHeader", "columnOrder", "separateDateTime", "fileFormat"]);
    const useExcelFormat = excelDateTime !== false; // Default to true
    const includeHeaders = includeHeader !== false; // Default to true
    const useSeparateDateTime = separateDateTime !== false; // Default to true

    const delimiter = fileFormat === "tsv" ? "\t" : ","; // Choose between CSV (,) or TSV (tab)

    // Default column definitions
    const defaultColumns = [
        { id: "received_from", label: "Received From", value: txn => txn.payerName.replace(/\s+/g, ' ').trim() },
        { id: "utr_id", label: "UTR ID", value: txn => `UTR-${txn.bankReferenceNo}` },
        { id: "vpa", label: "VPA", value: txn => txn.payeeIdentifier },
    ];

    // Handle Date & Time columns
    if (useSeparateDateTime) {
        defaultColumns.push(
            { id: "date", label: "Date", value: txn => useExcelFormat ? convertToExcelDateTime(txn.paymentTimestamp) : convertToReadableDate(txn.paymentTimestamp) },
            { id: "time", label: "Time", value: txn => useExcelFormat ? convertToExcelDateTime(txn.paymentTimestamp) : convertToReadableTime(txn.paymentTimestamp) }
        );
    } else {
        defaultColumns.push(
            { id: "date_time", label: "Date & Time", value: txn => useExcelFormat ? convertToExcelDateTime(txn.paymentTimestamp) : convertToReadableDateTime(txn.paymentTimestamp) }
        );
    }

    // Add Amount column
    defaultColumns.push({ id: "amount", label: "Amount", value: txn => formatAmount(txn.amount) });
    
    // Adjust column order dynamically
    let finalColumnOrder = columnOrder || defaultColumns.map(col => col.id);

    // Ensure correct order when splitting Date/Time, replace date_time with date and time columns
    if (useSeparateDateTime) {
        finalColumnOrder = finalColumnOrder.flatMap(colId => 
            colId === "date_time" ? ["date", "time"] : colId
        );
    }

    // Determine column order (use saved order or default order)
    const orderedColumns = finalColumnOrder
    .map(colId => defaultColumns.find(col => col.id === colId))
    .filter(col => col); // Remove any null values (if invalid column id is present)

    // Generate headers and rows
    const headers = orderedColumns.map(col => col.label);
    const rows = transactions.map(txn => orderedColumns.map(col => col.value(txn)));

     // Convert to CSV format
     const csvData = [
        ...(includeHeaders ? [headers.join(delimiter)] : []),
        ...rows.map(row => row.join(delimiter))
    ].join("\n");

    return csvData;

    /* if(includeHeaders){
        return [headers.join("\t"), ...rows.map(row => row.join("\t"))].join("\n");    
    }
    return [...rows.map(row => row.join("\t"))].join("\n"); */
}

// Function to download CSV file
export function downloadCSV(content, filename) {
    const fileType = filename.endsWith(".tsv") ? "text/tab-separated-values" : "text/csv";
    const blob = new Blob([content], { type: fileType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Convert JavaScript date to Excel date format (days since 1899-12-30)
function convertToExcelDateTime(timestamp) {
    const date = new Date(timestamp + 19800000); // Convert to IST (UTC+5:30)
    return (date.getTime() / 86400000) + 25569;
}

// Format date separately (YYYY-MM-DD)
function convertToReadableDate(timestamp) {
    const date = new Date(timestamp + 19800000);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Format time separately (h:mm A)
function convertToReadableTime(timestamp) {
    const date = new Date(timestamp + 19800000);
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // Convert to 12-hour format
    return `${hours}:${minutes} ${ampm}`;
}

// Format date & time together (YYYY-MM-DD h:mm A)
function convertToReadableDateTime(timestamp) {
    return `${convertToReadableDate(timestamp)} ${convertToReadableTime(timestamp)}`;
}

// Ensure amount has two decimal places
function formatAmount(amount) {
    return parseFloat(amount).toFixed(2);
}