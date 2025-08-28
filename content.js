// Content script that runs on every page
console.log("Gemini content script loaded on", window.location.href);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "highlight") {
    document.body.style.backgroundColor = "yellow";
    sendResponse({ status: "Page highlighted!" });
  }
});
