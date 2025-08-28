
// src/options/options.js
async function getSettings() {
  const { settings } = await chrome.storage.local.get("settings");
  return settings || {};
}
async function saveSettings(patch) {
  const cur = await getSettings();
  const next = { ...{ model: "models/gemini-1.5-pro-latest", useOAuth:false, apiKey:"" }, ...cur, ...patch };
  await chrome.storage.local.set({ settings: next });
  return next;
}
async function init() {
  const s = await getSettings();
  document.getElementById("apiKey").value = s.apiKey || "";
  document.getElementById("defaultModel").value = s.model || "models/gemini-1.5-pro-latest";
  document.getElementById("useOAuthOpt").checked = !!s.useOAuth;
}
document.getElementById("save").onclick = async () => {
  const apiKey = document.getElementById("apiKey").value.trim();
  const model = document.getElementById("defaultModel").value;
  const useOAuth = document.getElementById("useOAuthOpt").checked;
  await saveSettings({ apiKey, model, useOAuth });
  alert("Saved.");
};
document.getElementById("wipe").onclick = async () => {
  await saveSettings({ apiKey:"" });
  document.getElementById("apiKey").value = "";
  alert("Cleared API key.");
};
init();
