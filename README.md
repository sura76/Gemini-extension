# Gemini Extension

This repository contains the source code for the Gemini Extension, a powerful AI-powered Chrome extension designed to assist users with various tasks by leveraging Google's Gemini models.

## 🚀 Features

The extension is composed of a Python backend and a Chrome Extension frontend, providing the following features:

### 1. Visual Query (Screenshot Analysis)
- **Action**: Click the extension icon to activate a crosshair cursor.
- **Functionality**: Select any rectangular area on a webpage to capture a screenshot. The captured image is sent to the backend for analysis.
- **Result**: A floating, draggable modal appears on the page, displaying a detailed, AI-generated explanation or solution based on the content of the screenshot.

### 2. AI Writing Assistant
- **Action**: Highlight any text in a textarea or on a webpage and right-click to open a context menu.
- **Functionality**: Choose from several commands:
    - **Improve Writing**: Rewrites the text to be clearer and more engaging.
    - **Summarize Text**: Provides a concise summary.
    - **Fix Grammar & Spelling**: Corrects any grammatical errors.
    - **Change Tone to Professional**: Rewrites the text in a formal tone.
- **Result**: The selected text is replaced in-place with the AI-generated version, with an option to undo the change.

### 3. Interactive AI Chat Tutor
- **Action**: Open a persistent side panel in the browser.
- **Functionality**: Engage in a conversation with an AI tutor. The chat is context-aware and can use the content of the current webpage to provide more accurate and relevant answers.
- **Result**: A familiar chat interface where you can ask questions and receive answers, with the conversation history maintained for follow-up questions.

## 🛠️ Technology Stack

- **Backend**:
    - **Framework**: Python 3.11+ with [FastAPI](https://fastapi.tiangolo.com/)
    - **AI Model**: Google Gemini Pro & Gemini Pro Vision
    - **Web Server**: [Uvicorn](https://www.uvicorn.org/)
    - **Testing**: [Pytest](https://docs.pytest.org/)
- **Frontend (Chrome Extension)**:
    - **Languages**: HTML, CSS, JavaScript
    - **APIs**: Chrome Extension APIs (Context Menus, Side Panel, etc.)

## ⚙️ Setup and Installation

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r backend/requirements.txt
    ```

4.  **Set up environment variables:**
    -   Create a file named `.env` inside the `backend/` directory.
    -   Add your Google Gemini API key to the file like this:
        ```
        GEMINI_API_KEY="YOUR_API_KEY_HERE"
        ```

5.  **Run the server:**
    -   Navigate to the `backend` directory.
    -   Use Uvicorn to run the FastAPI application:
        ```bash
        cd backend
        uvicorn main:app --reload
        ```
    -   The server will be running at `http://127.0.0.1:8000`.

### Frontend Setup

*(This section is a placeholder and will be updated once the frontend is developed.)*

1.  Navigate to `chrome://extensions` in your Chrome browser.
2.  Enable "Developer mode".
3.  Click "Load unpacked" and select the `frontend` directory (once it is created).

## 🧪 Running Tests

The backend includes a suite of unit tests to ensure its functionality and reliability.

To run the tests, navigate to the root directory of the project and run `pytest`:
```bash
pytest backend/
```

## 📄 API Endpoints

The backend exposes the following API endpoints:

-   `POST /image-query`
    -   **Payload**: `{ "image_data": "data:image/png;base64,..." }`
    -   **Response**: `{ "answer": "AI-generated analysis..." }`

-   `POST /text-tool`
    -   **Payload**: `{ "text": "...", "command": "Improve Writing" }`
    -   **Response**: `{ "result_text": "AI-generated text..." }`

-   `POST /chat`
    -   **Payload**: `{ "message": "...", "page_url": "http://..." }`
    -   **Response**: `{ "reply": "AI-generated reply..." }`
