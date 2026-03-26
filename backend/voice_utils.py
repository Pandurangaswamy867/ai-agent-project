def transcribe_audio(audio_path: str):
    return {"text": "Audio disabled", "chunks": []}

def classify_intent(text: str):
    text = text.lower()
    if "ledger" in text: return {"intent": "go to ledger", "confidence": 1.0}
    elif "dashboard" in text: return {"intent": "go to dashboard", "confidence": 1.0}
    else: return {"intent": "unknown", "confidence": 0.0}