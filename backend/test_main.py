import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

# It's important to set the environment variable *before* importing the app
import os
os.environ['GEMINI_API_KEY'] = 'test-key'

from backend.main import app, conversation_history

# Create a TestClient instance
client = TestClient(app)

@pytest.fixture(autouse=True)
def clear_history():
    """A fixture to clear conversation history before each test."""
    conversation_history.clear()
    yield

# --- Tests for /image-query ---

@patch("backend.main.generate_response_from_image", new_callable=AsyncMock)
def test_image_query_success(mock_generate_response):
    """Test successful image query."""
    mock_generate_response.return_value = "This is a mock analysis of the image."
    response = client.post("/image-query", json={"image_data": "data:image/png;base64,mocked_base64_string"})
    assert response.status_code == 200
    assert response.json() == {"answer": "This is a mock analysis of the image."}
    mock_generate_response.assert_called_once_with("data:image/png;base64,mocked_base64_string")

def test_image_query_no_data():
    """Test image query with no image data."""
    response = client.post("/image-query", json={"image_data": ""})
    assert response.status_code == 400
    assert response.json() == {"detail": "No image data provided."}

# --- Tests for /text-tool ---

@patch("backend.main.generate_response_from_text", new_callable=AsyncMock)
def test_text_tool_success(mock_generate_response):
    """Test successful text tool query."""
    mock_generate_response.return_value = "This is improved text."
    response = client.post("/text-tool", json={"text": "some text", "command": "Improve Writing"})
    assert response.status_code == 200
    assert response.json() == {"result_text": "This is improved text."}
    mock_generate_response.assert_called_once_with("some text", "Improve Writing")

def test_text_tool_invalid_command():
    """Test text tool with an invalid command."""
    response = client.post("/text-tool", json={"text": "some text", "command": "Invalid Command"})
    assert response.status_code == 422  # Unprocessable Entity for Pydantic validation error

def test_text_tool_no_text():
    """Test text tool with no text provided."""
    response = client.post("/text-tool", json={"text": "", "command": "Improve Writing"})
    assert response.status_code == 400
    assert response.json() == {"detail": "No text provided."}

# --- Tests for /chat ---

@patch("backend.main.generate_chat_response", new_callable=AsyncMock)
def test_chat_success(mock_generate_response):
    """Test successful chat message."""
    mock_generate_response.return_value = "This is a mock reply."
    response = client.post("/chat", json={"message": "Hello there", "page_url": "http://example.com"})

    assert response.status_code == 200
    assert response.json() == {"reply": "This is a mock reply."}

    # Check that the service was called correctly
    mock_generate_response.assert_called_once_with(
        message="Hello there",
        history=[],
        page_url="http://example.com"
    )

    # Check that the history was updated
    assert len(conversation_history) == 2
    assert conversation_history[0] == {"role": "user", "parts": ["Hello there"]}
    assert conversation_history[1] == {"role": "model", "parts": ["This is a mock reply."]}

def test_chat_no_message():
    """Test chat with no message provided."""
    response = client.post("/chat", json={"message": ""})
    assert response.status_code == 400
    assert response.json() == {"detail": "No message provided."}

@patch("backend.main.generate_chat_response", new_callable=AsyncMock)
def test_chat_history_is_maintained(mock_generate_response):
    """Test that chat history is passed correctly between calls."""
    # First call
    mock_generate_response.return_value = "First reply."
    client.post("/chat", json={"message": "First message"})

    # Second call
    mock_generate_response.return_value = "Second reply."
    client.post("/chat", json={"message": "Second message"})

    # The second call to the service should have the history from the first call
    expected_history = [
        {"role": "user", "parts": ["First message"]},
        {"role": "model", "parts": ["First reply."]}
    ]
    mock_generate_response.assert_called_with(
        message="Second message",
        history=expected_history,
        page_url=None
    )

    # Check the final history
    assert len(conversation_history) == 4
    assert conversation_history[2] == {"role": "user", "parts": ["Second message"]}
    assert conversation_history[3] == {"role": "model", "parts": ["Second reply."]}
