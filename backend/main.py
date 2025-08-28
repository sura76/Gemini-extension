import os
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, Optional, List

# Import the new service functions
from gemini_service import (
    generate_response_from_image,
    generate_response_from_text,
    generate_chat_response,
)

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Gemini Extension API",
    description="API for the Gemini Chrome Extension to provide AI-powered features.",
    version="1.0.0"
)

# Configure CORS to allow the extension to connect
# In production, you would restrict this to your extension's ID
# chrome-extension://<your-extension-id>
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
def read_root():
    """A simple endpoint to confirm the server is running."""
    return {"message": "Welcome to the Gemini Extension Backend!"}

# --- Image Query Endpoint ---
class ImageQueryRequest(BaseModel):
    """Request model for the image query endpoint."""
    image_data: str

@app.post("/image-query")
async def image_query(request: ImageQueryRequest):
    """
    Accepts a Base64 encoded image, sends it to the Gemini Vision API, and returns the analysis.
    """
    if not request.image_data:
        raise HTTPException(status_code=400, detail="No image data provided.")

    answer = await generate_response_from_image(request.image_data)

    return {"answer": answer}

# --- Text Tool Endpoint ---
class TextToolRequest(BaseModel):
    """Request model for the text tool endpoint."""
    text: str
    command: Literal[
        "Improve Writing",
        "Summarize Text",
        "Fix Grammar & Spelling",
        "Change Tone to Professional",
    ]

@app.post("/text-tool")
async def text_tool(request: TextToolRequest):
    """
    Accepts text and a command, sends them to the Gemini API, and returns the result.
    """
    if not request.text:
        raise HTTPException(status_code=400, detail="No text provided.")

    result_text = await generate_response_from_text(request.text, request.command)

    return {"result_text": result_text}

# --- Chat Endpoint ---
class ChatRequest(BaseModel):
    """Request model for the chat endpoint."""
    message: str
    page_url: Optional[str] = None

# In-memory store for conversation history. A more robust solution would use a database
# or a distributed cache like Redis to handle user sessions.
conversation_history: List[dict] = []

@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Accepts a user message, maintains conversation history, and returns an AI chat response.
    """
    if not request.message:
        raise HTTPException(status_code=400, detail="No message provided.")

    # Note: The current history is shared across all users.
    # For a real application, you would implement session management.

    # Note: The current history is shared across all users. For a real app, this would be session-based.

    # Get the response from the Gemini service, passing a copy of the history *before* the current message.
    reply = await generate_chat_response(
        message=request.message,
        history=conversation_history.copy(),
        page_url=request.page_url
    )

    # Update history with the user's message and the model's response for the next turn.
    conversation_history.append({"role": "user", "parts": [request.message]})
    conversation_history.append({"role": "model", "parts": [reply]})

    return {"reply": reply}
