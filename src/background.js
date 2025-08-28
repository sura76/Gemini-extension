
// src/background.js
// MV3 service worker (module). Handles context menus, messaging, OAuth/API calls, logging.

const STORAGE_KEYS = {
  SETTINGS: "settings",
  TOKEN: "oauth_token",
  LOGS: "interaction_logs"
};

const DEFAULT_SETTINGS = {
  model: "models/gemini-1.5-pro-latest",
  useOAuth: false,           // Use OAuth via chrome.identity.launchWebAuthFlow
  apiKey: "",                // Fallback: API key from Options page
  searchBoxHotkey: "Alt+G"   // Not registered globally; content script listens when injected
};

// --- Utility: storage ---
async function getSettings() {
  const { [STORAGE_KEYS.SETTINGS]: s } = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...(s || {}) };
}
async function setSettings(patch) {
  const s = await getSettings();
  const merged = { ...s, ...patch };
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: merged });
  return merged;
}
async function appendLog(entry) {
  const { [STORAGE_KEYS.LOGS]: logs = [] } = await chrome.storage.local.get(STORAGE_KEYS.LOGS);
  logs.unshift({ id: crypto.randomUUID(), ts: Date.now(), ...entry });
  await chrome.storage.local.set({ [STORAGE_KEYS.LOGS]: logs.slice(0, 500) }); // cap
  return logs[0];
}
async function getLogs() {
  const { [STORAGE_KEYS.LOGS]: logs = [] } = await chrome.storage.local.get(STORAGE_KEYS.LOGS);
  return logs;
}
async function clearLogs() { await chrome.storage.local.set({ [STORAGE_KEYS.LOGS]: [] }); }

// --- Context Menus ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "gemini_summarize_selection",
      title: "Gemini: Summarize Selection",
      contexts: ["selection"]
    });
    chrome.contextMenus.create({
      id: "gemini_rewrite_selection",
      title: "Gemini: Rewrite Selection",
      contexts: ["selection"]
    });
    chrome.contextMenus.create({
      id: "gemini_explain_image",
      title: "Gemini: Explain Image",
      contexts: ["image"]
    });
    chrome.contextMenus.create({
      id: "gemini_ask_about_page",
      title: "Gemini: Ask about this page…",
      contexts: ["page"]
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId === "gemini_summarize_selection") {
    chrome.tabs.sendMessage(tab.id, { type: "SHOW_SEARCH_BOX", preset: "summarize" });
  } else if (info.menuItemId === "gemini_rewrite_selection") {
    chrome.tabs.sendMessage(tab.id, { type: "SHOW_SEARCH_BOX", preset: "rewrite" });
  } else if (info.menuItemId === "gemini_explain_image") {
    const imageUrl = info.srcUrl;
    const res = await callGemini("image_explain", { imageUrl });
    await appendLog({ action: "explain_image", input: imageUrl, output: res });
    chrome.tabs.sendMessage(tab.id, { type: "SHOW_RESULT_TOAST", result: res?.text || "No response" });
  } else if (info.menuItemId === "gemini_ask_about_page") {
    chrome.tabs.sendMessage(tab.id, { type: "SHOW_SEARCH_BOX", preset: "qa" });
  }
});

// --- Messaging between popup/content/background ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case "GET_SETTINGS":
          sendResponse({ ok: true, data: await getSettings() });
          break;
        case "SAVE_SETTINGS":
          sendResponse({ ok: true, data: await setSettings(message.data || {}) });
          break;
        case "GET_LOGS":
          sendResponse({ ok: true, data: await getLogs() });
          break;
        case "CLEAR_LOGS":
          await clearLogs();
          sendResponse({ ok: true });
          break;
        case "RUN_GEMINI":
          {
            const res = await callGemini(message.mode, message.payload);
            await appendLog({ action: message.mode, input: message.payload, output: res });
            sendResponse({ ok: true, data: res });
          }
          break;
        case "OPEN_OPTIONS":
          chrome.runtime.openOptionsPage();
          sendResponse({ ok: true });
          break;
        default:
          sendResponse({ ok: false, error: "Unknown message type" });
      }
    } catch (e) {
      console.error(e);
      sendResponse({ ok: false, error: String(e?.message || e) });
    }
  })();
  return true; // async
});

// --- OAuth (placeholder) and API requests ---
async function getAccessTokenInteractive(interactive = true) {
  // Placeholder: You may use chrome.identity.launchWebAuthFlow to your OAuth server or Google OAuth.
  // This sample simply retrieves a cached token if any (not functional without your OAuth flow).
  const { [STORAGE_KEYS.TOKEN]: token } = await chrome.storage.local.get(STORAGE_KEYS.TOKEN);
  if (token) return token;
  if (!interactive) return null;
  // TODO: Implement your OAuth flow here. For now, return null.
  return null;
}

async function callGemini(mode, payload) {
  const settings = await getSettings();
  const model = settings.model || "models/gemini-1.5-pro-latest";

  // Prefer OAuth if enabled, else use API key from options.
  let authHeader = null;
  if (settings.useOAuth) {
    const token = await getAccessTokenInteractive(false);
    if (!token) throw new Error("Not authenticated. Enable API Key in Options or complete OAuth.");
    authHeader = { "Authorization": `Bearer ${token}` };
  }

  // Endpoints
  const apiBase = "https://generativelanguage.googleapis.com/v1beta";
  const endpoint = `${apiBase}/${encodeURIComponent(model)}:generateContent`;

  // Build request body
  let contents = [];

  if (mode === "text_ops") {
    const { text, instruction } = payload;
    contents = [{
      role: "user",
      parts: [
        { text: `${instruction}\n\n---\n${text}` }
      ]
    }];
  } else if (mode === "qa_page") {
    const { question, pageText } = payload;
    contents = [{
      role: "user",
      parts: [
        { text: `You are assisting with Q&A about the user's current web page. Use the provided page text as context.\n\nPage text:\n${pageText}\n\nQuestion: ${question}` }
      ]
    }];
  } else if (mode === "image_explain") {
    const { imageUrl } = payload;
    contents = [{
      role: "user",
      parts: [
        { text: "Explain the content of this image in clear, concise terms." },
        { inline_data: { mime_type: "image/png", data: "" } }, // Placeholder; some endpoints accept image URL via webImage
        { text: `Image URL: ${imageUrl}` }
      ]
    }];
  } else {
    const { prompt } = payload;
    contents = [{ role: "user", parts: [{ text: prompt }]}];
  }

  const body = { contents };

  const headers = {
    "Content-Type": "application/json",
    ...(authHeader || {})
  };

  let url = endpoint;
  if (!settings.useOAuth) {
    const key = settings.apiKey?.trim();
    if (!key) throw new Error("API key is empty. Add it in Options, or enable OAuth.");
    const u = new URL(url);
    u.searchParams.set("key", key);
    url = u.toString();
  }

  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Gemini API error: ${resp.status} ${resp.statusText}\n${txt}`);
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") || "";
  return { raw: data, text };
}

// Inject content script on action click (to honor activeTab privacy)
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["src/content.js"]
    });
    chrome.tabs.sendMessage(tab.id, { type: "SHOW_SEARCH_BOX" });
  } catch (e) {
    console.error("Failed to inject content script:", e);
  }
});
