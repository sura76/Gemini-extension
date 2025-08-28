// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log("Gemini Extension installed.");
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Background received:", msg);
  sendResponse({ reply: "Message received in background!" });
});
