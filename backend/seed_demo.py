import json
import random
import urllib.request
import urllib.error
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api/v1"

def post_json(url, data):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return 0, str(e)

def seed():
    # 1. Seed SNPs
    snps = [
        {
            "name": "Bharat Logistics HQ",
            "type": "Logistics",
            "contact_person": "Amit Sharma",
            "email": "amit@bharatlog.com",
            "phone": "9876543210",
            "city": "Lucknow, Kanpur, Varanasi, Delhi",
            "onboarding_fee": 500.0,
            "commission_rate": 3.5,
            "rating": 4.8,
            "supported_sectors": "Handicrafts, Textiles, Agri-products",
            "pincode_expertise": "226001, 208001, 221001"
        },
        {
            "name": "Gramin Digital Seller Hub",
            "type": "Seller App",
            "contact_person": "Priya Singh",
            "email": "priya@gramindigital.in",
            "phone": "9876543211",
            "city": "Jaipur, Jodhpur, Udaipur, Ahmedabad",
            "onboarding_fee": 1000.0,
            "commission_rate": 8.0,
            "rating": 4.2,
            "supported_sectors": "Handicrafts, Jewelry, Decor",
            "pincode_expertise": "302001, 342001, 380001"
        },
        {
            "name": "Kisaan Connect Node",
            "type": "Seller App",
            "contact_person": "Rahul Verma",
            "email": "rahul@kisaanconnect.org",
            "phone": "9876543212",
            "city": "Bhopal, Indore, Pune",
            "onboarding_fee": 0.0,
            "commission_rate": 5.0,
            "rating": 4.6,
            "supported_sectors": "Agri-products, Food & Beverages",
            "pincode_expertise": "462001, 452001, 411001"
        }
    ]

    snp_ids = []
    for snp in snps:
        code, res = post_json(f"{BASE_URL}/snps/", snp)
        if code == 200:
            snp_ids.append(res['snp_id'])
            print(f"Seeded SNP: {snp['name']}")

    # 2. Seed MSEs
    mses = [
        {
            "name": "Varanasi Silk Emporium",
            "contact_person": "Kashinath Das",
            "email": "kashi@silk.com",
            "phone": "9998887771",
            "address": "Ghat Road",
            "city": "Varanasi",
            "state": "Uttar Pradesh",
            "pincode": "221001",
            "sector": "Handicrafts",
            "description": "Premium hand-woven silk sarees and fabrics."
        },
        {
            "name": "Malwa Organic Farms",
            "contact_person": "Suresh Jat",
            "email": "suresh@malwafarms.co",
            "phone": "9998887773",
            "address": "Farm Circle 4",
            "city": "Indore",
            "state": "Madhya Pradesh",
            "pincode": "452001",
            "sector": "Food & Agri",
            "description": "Wholesale organic pulses and spices."
        }
    ]

    mse_ids = []
    for mse in mses:
        code, res = post_json(f"{BASE_URL}/mses/register", mse)
        if code == 201:
            mse_ids.append(res['mse_id'])
            print(f"Seeded MSE: {mse['name']}")

    # 3. Seed Products
    products_tpl = [
        {"name": "Banarasi Katan Silk Saree", "price": 12500, "unit": "pcs", "desc": "Authentic Katan silk with gold zari work."},
        {"name": "Silk Scarf (Indigo)", "price": 1200, "unit": "pcs", "desc": "Natural dyed silk scarf."},
        {"name": "Bamboo Craft Box", "price": 450, "unit": "pcs", "desc": "Handcrafted bamboo storage box."} 
    ]
    
    for mse_id in mse_ids:
        for p in products_tpl:
            post_json(f"{BASE_URL}/products/{mse_id}/products", {
                "product_name": p['name'],
                "description": p['desc'],
                "price": p['price'],
                "unit": p['unit'],
                "mse_id": mse_id
            })

    # 4. Seed Transactions
    for mse_id in mse_ids:
        for _ in range(3):
            post_json(f"{BASE_URL}/transactions/", {
                "mse_id": mse_id,
                "snp_id": random.choice(snp_ids) if snp_ids else 1,
                "order_id": f"ONDC-FIX-{random.randint(1000, 9999)}",
                "amount": random.randint(1000, 10000),
                "status": "pending",
                "transaction_date": (datetime.utcnow() - timedelta(days=random.randint(1, 10))).isoformat()
            })

    # 5. Seed Claims
    for mse_id in mse_ids:
        post_json(f"{BASE_URL}/claims/", {
            "mse_id": mse_id,
            "claim_type": "registration_verification",
            "claim_data": json.dumps({"reason": "New MSME registration audit required."})
        })
        print(f"Seeded verification claim for MSE #{mse_id}")

    print("Demo Seeding Complete!")

if __name__ == "__main__":
    seed()
