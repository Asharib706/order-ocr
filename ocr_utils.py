import os
import google.generativeai as genai
import json
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel('gemini-2.5-flash')

def extract_work_order_data(image):
    """
    Extracts work order data from an image using Gemini 2.5 Flash.
    Args:
        image: PIL Image object or bytes.
    Returns:
        dict: Extracted data in JSON format.
    """
    try:
        # Prompt for extraction
        prompt = """
        Extract the following information from this work order image and return it as a valid JSON object:
        {
          "work_order_number": "The work order number, usually near top right",
          "job_number": "Job number",
          "description": "Description of work (combine lines if necessary)",
          "date": "Date of the work order (format: DD-MM-YYYY)",
          "hours": "Total hours",
          "total_amount_due": "Total Amount Due (number or string, usually near bottom right)",
          "signed_by_both": boolean (true if both WCDP Signature and Customer Signature are present, false otherwise),
          "customer_sign": boolean (true if Customer Signature is present),
          "wcdp_sign": boolean (true if WCDP Signature is present)
        }
        If a field is missing or illegible, use null.
        """
        
        response = model.generate_content([prompt, image])
        
        # Parse JSON response
        # Using a simple cleanup to handle potential markdown code blocks
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
            
        return json.loads(text)
    except Exception as e:
        print(f"Error during OCR extraction: {e}")
        return None
