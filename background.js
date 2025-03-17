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

/* Shortcut buttons defined in manifest to send these commands which we listen here */
browser.commands.onCommand.addListener((command) => {
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;

        let message = command === "copy_current_page" ? { action: "copyCurrent" } : { action: "copyAll" };
        browser.tabs.sendMessage(tabs[0].id, message);
    });
});