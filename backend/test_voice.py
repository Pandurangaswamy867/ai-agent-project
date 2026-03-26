import numpy as np
import soundfile as sf
import os
from voice_utils import transcribe_audio

def create_dummy_audio(filename="dummy_voice.wav"):
    # Generate 1 second of silence at 16kHz
    samplerate = 16000
    data = np.zeros(samplerate)
    sf.write(filename, data, samplerate)
    print(f"Created dummy audio: {filename}")

if __name__ == "__main__":
    dummy_file = "dummy_voice.wav"
    try:
        if not os.path.exists(dummy_file):
            create_dummy_audio(dummy_file)
        
        print("Testing ASR transcription on dummy audio (silence)...")
        result = transcribe_audio(dummy_file)
        
        if "error" in result:
            print(f"ASR Test Failed: {result['error']}")
        else:
            print(f"ASR Test Success! Transcript: '{result['text']}'")
            
    finally:
        if os.path.exists(dummy_file):
            os.remove(dummy_file)
            print("Cleaned up dummy audio.")
