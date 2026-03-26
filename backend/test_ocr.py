from ocr_utils import extract_fields
from PIL import Image, ImageDraw, ImageFont
import os

def create_dummy_aadhar():
    img = Image.new('RGB', (400, 200), color = (255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((10,10), "GOVERNMENT OF INDIA", fill=(0,0,0))
    d.text((10,40), "Name: Rajesh Kumar", fill=(0,0,0))
    d.text((10,70), "DOB: 05/10/1985", fill=(0,0,0))
    d.text((10,100), "Aadhaar No: 1234 5678 9012", fill=(0,0,0))
    img.save("dummy_aadhar.png")

if __name__ == "__main__":
    if not os.path.exists("dummy_aadhar.png"):
        create_dummy_aadhar()
    
    print("Testing OCR extraction on dummy Aadhaar...")
    data, confidence = extract_fields("dummy_aadhar.png", "aadhar")
    print(f"Extracted Data: {data}")
    print(f"Confidence: {confidence}")
