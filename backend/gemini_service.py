import os
import google.generativeai as genai
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
import base64
from PIL import Image
import io

# Load environment variables from the .env file
load_dotenv()

# Configure the Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file.")
genai.configure(api_key=GEMINI_API_KEY)

# --- Service Functions ---

async def generate_response_from_image(image_data: str):
    """
    Analyzes an image using the Gemini Vision model.
    """
    try:
        # The image data is a base64 string with a data URL prefix (e.g., 'data:image/png;base64,')
        # We need to strip the prefix and decode the base64 string.
        header, encoded = image_data.split(",", 1)
        image_bytes = base64.b64decode(encoded)

        # Create a PIL Image object. The Gemini API can handle PIL Images directly.
        image = Image.open(io.BytesIO(image_bytes))

        model = genai.GenerativeModel('gemini-pro-vision')

        prompt = "Analyze this image which contains a question. Provide a clear, step-by-step solution if it's a problem, or a detailed explanation if it's a concept. Format the output in Markdown."

        # The model expects a list of parts, which can be text or images.
        response = await model.generate_content_async([prompt, image])

        return response.text
    except Exception as e:
        print(f"Error in Gemini image service: {e}")
        # Provide a more user-friendly error message
        return "Sorry, I couldn't process the image. It might be in an unsupported format or too large."

async def generate_response_from_text(text: str, command: str):
    """
    Generates a response for a given text and command using the Gemini Pro model.
    """
    try:
        # Create a specific prompt based on the command
        prompts = {
            "Improve Writing": f"Rewrite the following text to be more clear, concise, and engaging. Return only the improved text:\n\n'{text}'",
            "Summarize Text": f"Provide a concise summary of the following text. Return only the summary:\n\n'{text}'",
            "Fix Grammar & Spelling": f"Fix the grammar and spelling in the following text. Return only the corrected text:\n\n'{text}'",
            "Change Tone to Professional": f"Rewrite the following text in a formal, professional tone. Return only the rewritten text:\n\n'{text}'"
        }

        prompt = prompts.get(command)
        if not prompt:
            return "Invalid command provided."

        model = genai.GenerativeModel('gemini-pro')
        response = await model.generate_content_async(prompt)

        return response.text
    except Exception as e:
        print(f"Error in Gemini text service: {e}")
        return "Sorry, I encountered an error while processing the text. Please try again later."

async def generate_chat_response(message: str, history: list, page_url: str = None):
    """
    Generates a chat response using Gemini Pro, with conversation history and optional page context.
    """
    try:
        context = ""
        if page_url:
            try:
                # Scrape the webpage for context
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}
                page_response = requests.get(page_url, headers=headers, timeout=10)
                page_response.raise_for_status()
                soup = BeautifulSoup(page_response.text, 'html.parser')

                # Extract text from the body, remove script/style tags, and join with spaces
                for script_or_style in soup(["script", "style"]):
                    script_or_style.decompose()
                page_text = ' '.join(soup.body.get_text().split())

                # Limit context to avoid overly long prompts
                context = f"Here is the context from the webpage '{page_url}':\n---\n{page_text[:3000]}\n---\n"
            except Exception as e:
                print(f"Could not scrape URL {page_url}: {e}")
                context = f"Note: I was unable to access the content of the webpage at {page_url}. "

        # The system prompt is an instruction to the model on how to behave.
        # For Gemini, we include this as part of the first turn or as a general instruction.
        system_prompt = "You are a helpful AI Tutor. Given the context from the webpage and our previous conversation, answer the user's question."

        model = genai.GenerativeModel('gemini-pro')

        # The history passed to start_chat should be clean.
        chat_session = model.start_chat(history=history)

        # Construct the final message to send, including context and the user's query
        full_message = f"{system_prompt}\n\n{context}My question is: {message}"

        response = await chat_session.send_message_async(full_message)

        return response.text
    except Exception as e:
        print(f"Error in Gemini chat service: {e}")
        return "Sorry, I'm having trouble responding right now. Please try again."
