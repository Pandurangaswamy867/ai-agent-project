import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def seed_snps():
    snps = [
        {
            "name": "Bharat Logistics & Delivery",
            "type": "Logistics",
            "contact_person": "Amit Sharma",
            "email": "amit@bharatlog.com",
            "phone": "9876543210",
            "city": "Lucknow, Kanpur, Varanasi",
            "onboarding_fee": 500.0,
            "commission_rate": 3.5,
            "rating": 4.8,
            "supported_sectors": json.dumps(["Handicrafts", "Textiles", "Agri-products"]),
            "pincode_expertise": json.dumps(["226001", "208001", "221001"])
        },
        {
            "name": "Gramin Digital Seller App",
            "type": "Seller App",
            "contact_person": "Priya Singh",
            "email": "priya@gramindigital.in",
            "phone": "9876543211",
            "city": "Jaipur, Jodhpur, Udaipur",
            "onboarding_fee": 1000.0,
            "commission_rate": 8.0,
            "rating": 4.2,
            "supported_sectors": json.dumps(["Handicrafts", "Jewelry", "Decor"]),
            "pincode_expertise": json.dumps(["302001", "342001", "313001"])
        },
        {
            "name": "UP Rural Tech Solutions",
            "type": "Seller App",
            "contact_person": "Rahul Verma",
            "email": "rahul@uprural.org",
            "phone": "9876543212",
            "city": "Lucknow, Gorakhpur",
            "onboarding_fee": 0.0,
            "commission_rate": 5.0,
            "rating": 4.5,
            "supported_sectors": json.dumps(["Agri-products", "Handicrafts"]),
            "pincode_expertise": json.dumps(["226002", "273001"])
        }
    ]

    for snp in snps:
        try:
            res = requests.post(f"{BASE_URL}/snps/", json=snp)
            if res.status_code == 200:
                print(f"Seeded SNP: {snp['name']}")
            else:
                print(f"Failed to seed {snp['name']}: {res.text}")
        except Exception as e:
            print(f"Error seeding {snp['name']}: {e}")

if __name__ == "__main__":
    seed_snps()
