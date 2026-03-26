from transformers import pipeline
from PIL import Image
import json
import os
import pypdfium2 as pdfium

_nlp = None

def get_ocr_model():
    global _nlp
    if _nlp is None:
        try:
            print("Loading OCR Model (Donut)...")
            _nlp = pipeline(
                "document-question-answering",
                model="naver-clova-ix/donut-base-finetuned-docvqa"
            )
        except Exception as e:
            print(f"Error loading Donut model: {e}")
    return _nlp

def extract_fields(image_path: str, document_type: str):
    nlp = get_ocr_model()
    if nlp is None:
        return {"error": "OCR model not loaded"}, 0.0

    if not os.path.exists(image_path):
        return {"error": "File not found"}, 0.0

    try:
        if image_path.lower().endswith(".pdf"):
            pdf = pdfium.PdfDocument(image_path)
            page = pdf[0]
            pil_image = page.render(scale=2).to_pil()
            image = pil_image.convert("RGB")
        else:
            image = Image.open(image_path).convert("RGB")
    except Exception as e:
        return {"error": f"Failed to process file: {str(e)}"}, 0.0

    # ... rest of the extraction logic ...
    # (Keeping it consistent with previous version)
    queries = {
        "aadhar": {"name": "What is the name?", "dob": "What is the date of birth?", "aadhar_no": "What is the aadhaar number?"},
        "pan": {"name": "What is the name?", "pan_no": "What is the PAN number?", "dob": "What is the date of birth?"},
        "udyam": {"name": "What is the enterprise name?", "udyam_no": "What is the udyam registration number?", "type": "What is the type of enterprise?"}
    }
    
    doc_queries = queries.get(document_type, {})
    extracted_data = {}
    total_score = 0
    count = 0

    for field, query in doc_queries.items():
        try:
            result = nlp(image, query)
            if result:
                best_match = result[0]
                extracted_data[field] = best_match.get('answer')
                total_score += best_match.get('score', 1.0)
                count += 1
        except Exception as e:
            print(f"Error extracting {field}: {e}")
            extracted_data[field] = None

    confidence_score = total_score / count if count > 0 else 0.0
    return extracted_data, confidence_score
