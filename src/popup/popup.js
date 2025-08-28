
// src/popup/popup.js
async function send(type, data) {
  return await chrome.runtime.sendMessage({ type, data });
}

const authStatus = document.getElementById('auth-status');
const modelSel = document.getElementById('model');
const useOAuth = document.getElementById('useOAuth');
const historyEl = document.getElementById('history');

document.getElementById('open-options').onclick = async () => {
  await send("OPEN_OPTIONS");
};
document.getElementById('login').onclick = async () => {
  // Placeholder: actual OAuth handled in background when implemented.
  alert("If OAuth is enabled, implement login via Options or your OAuth flow.");
};
document.getElementById('logout').onclick = async () => {
  await chrome.storage.local.remove("oauth_token");
  updateAuthStatus();
};

document.getElementById('view-history').onclick = async () => {
  const res = await send("GET_LOGS");
  if (!res?.ok) return;
  historyEl.innerHTML = "";
  for (const item of res.data) {
    const div = document.createElement('div');
    div.className = "log";
    const ts = new Date(item.ts).toLocaleString();
    div.innerHTML = `<div style="opacity:.7;font-size:12px;">${ts} • ${item.action}</div>
      <pre style="white-space:pre-wrap">${JSON.stringify(item.input, null, 2)}</pre>
      <hr style="border-color:#1f2937"/>
      <div>${(item.output?.text || "").replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</div>`;
    historyEl.appendChild(div);
  }
};

document.getElementById('clear-history').onclick = async () => {
  if (!confirm("Clear all interaction history?")) return;
  await send("CLEAR_LOGS");
  historyEl.innerHTML = "";
};

async function loadSettings() {
  const res = await send("GET_SETTINGS");
  if (!res?.ok) return;
  const s = res.data;
  modelSel.value = s.model || modelSel.value;
  useOAuth.checked = !!s.useOAuth;
  updateAuthStatus();
}
modelSel.onchange = async () => {
  await send("SAVE_SETTINGS", { model: modelSel.value });
};
useOAuth.onchange = async () => {
  await send("SAVE_SETTINGS", { useOAuth: useOAuth.checked });
  updateAuthStatus();
};

async function updateAuthStatus() {
  const { oauth_token } = await chrome.storage.local.get("oauth_token");
  const res = await send("GET_SETTINGS");
  const useOAuthNow = !!res?.data?.useOAuth;
  if (useOAuthNow) {
    authStatus.textContent = oauth_token ? "Signed In (OAuth)" : "Signed Out";
  } else {
    authStatus.textContent = res?.data?.apiKey ? "API Key Set" : "Signed Out";
  }
}

loadSettings();
