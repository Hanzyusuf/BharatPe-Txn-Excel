browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "copyToClipboard") {
        copyToClipboard(message.data);
        sendResponse({ success: true });
    }
});

function copyToClipboard(text) {
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.value = text;
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    // console.log("Data copied to clipboard.");
}