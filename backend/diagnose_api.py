import requests
import numpy as np
import soundfile as sf
import os

def diagnose():
    url = "http://localhost:8000/api/v1/mses/transcribe-command"
    filename = "test_diag.wav"
    
    # Generate 1 second of "audio" (noise)
    data = np.random.uniform(-1, 1, 16000)
    sf.write(filename, data, 16000)
    
    print(f"Connecting to {url}...")
    try:
        with open(filename, "rb") as f:
            files = {"file": (filename, f, "audio/wav")}
            response = requests.post(url, files=files, timeout=60)
            
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Diagnosis Failed: {e}")
    finally:
        if os.path.exists(filename):
            os.remove(filename)

if __name__ == "__main__":
    diagnose()
