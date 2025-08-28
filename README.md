# Gemini-extension
A starter template for building Chrome extensions with Manifest V3, featuring a popup, background worker, content script, and a customizable options page.

# Gemini Chrome Extension Scaffold

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Current Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/sura76/Gemini-extension)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Coming%20Soon-brightgreen.svg)](https://chrome.google.com/webstore)

A simple Chrome Extension scaffold that demonstrates core features like a popup UI, content scripts that interact with web pages, a background service worker, and a customizable options page. It's an excellent starting point for building your own Chrome extension with Manifest V3.

---

## ✨ Features

* **Popup UI**: A simple interface to send messages and trigger actions in the background script.
* **Content Script**: Directly interacts with the DOM of web pages, in this case, to highlight the page background.
* **Customizable Options**: Includes an options page where users can choose and save their preferences (e.g., a highlight color).
* **Background Service Worker**: Manages extension state, handles messages between components, and listens for browser events.
* **Persistent Settings**: Uses `chrome.storage.sync` to save user settings across devices.

---

## 📂 Project Structure

The repository is structured as a standard Chrome extension.


gemini-extension/
│
├── manifest.json        # Extension configuration (Manifest V3)
├── background.js        # Background service worker logic
├── popup.html           # HTML for the popup UI
├── popup.js             # JavaScript for the popup UI
├── options.html         # HTML for the options page
├── content.js           # Script injected into web pages
│
└── icons/               # Extension icons (16px, 48px, 128px)


---

## 🚀 Installation

To install this extension locally for development:

1.  **Clone the repository**:
    ```bash
    git clone [https://github.com/sura76/Gemini-extension.git](https://github.com/sura76/Gemini-extension.git)
    ```
2.  Open Google Chrome and navigate to the extensions page at `chrome://extensions/`.
3.  Enable **Developer Mode** using the toggle switch in the top-right corner.
4.  Click the **Load unpacked** button.
5.  Select the `gemini-extension` folder that you cloned.

The extension icon will now appear in your Chrome toolbar. You may need to pin it to keep it visible.

---

## ⚙️ Usage

1.  **Set a Color**: Right-click the extension icon and select "Options." Choose your preferred highlight color from the dropdown and save it.
2.  **Activate**: Click the extension icon in your toolbar to open the popup.
3.  **Highlight**: Click the "Highlight Page" button in the popup. The content script will apply your chosen color to the current page's background.

---

## 🛠️ Development Notes

* This scaffold is built using **Chrome Extension Manifest V3**, the latest standard for Chrome extensions.
* It demonstrates the fundamental messaging pattern between the `popup`, `background`, and `content` scripts.
* The code is intentionally kept simple and well-commented to be easy to understand and build upon.

---

## 📜 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute it as you see fit.






