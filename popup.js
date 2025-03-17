document.getElementById("copyCurrent").addEventListener("click", () => {
    sendMessageToContentScript("copyCurrent");
});

document.getElementById("copyAll").addEventListener("click", () => {
    sendMessageToContentScript("copyAll");
});

function sendMessageToContentScript(action) {
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        browser.tabs.sendMessage(tabs[0].id, { action });
    });
}
