document.getElementById("sendMsg").addEventListener("click", () => {
  chrome.runtime.sendMessage({ text: "Hello from popup!" }, (response) => {
    console.log("Background replied:", response);
    alert(response.reply);
  });
});

// Button to highlight page
const btn = document.createElement("button");
btn.textContent = "Highlight Page";
btn.style.marginTop = "10px";
document.body.appendChild(btn);

btn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "highlight" }, (response) => {
      if (response) alert(response.status);
    });
  });
});
