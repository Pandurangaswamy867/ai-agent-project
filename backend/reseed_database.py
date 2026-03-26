import sys
import os
import json
import random
from datetime import datetime, timedelta

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
import models
import auth

def clear_db(db):
    print("Clearing database...")
    # Delete in order to respect foreign key constraints
    db.query(models.Notification).delete()
    db.query(models.SystemAuditLog).delete()
    db.query(models.Partnership).delete()
    db.query(models.TransactionConflict).delete()
    db.query(models.Transaction).delete()
    db.query(models.ProductVersion).delete()
    db.query(models.Product).delete()
    db.query(models.OCRDocument).delete()
    db.query(models.Claim).delete()
    db.query(models.MSE).delete()
    db.query(models.SNP).delete()
    db.query(models.NotificationPreference).delete()
    db.query(models.User).delete()
    db.commit()

def seed():
    # Ensure tables exist
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        clear_db(db)
        
        password_hash = auth.get_password_hash("enter123")
        
        # 1. Seed NSIC Admin
        nsic_user = models.User(
            email="admin@nsic.gov.in",
            hashed_password=password_hash,
            role="nsic",
            is_active=1
        )
        db.add(nsic_user)
        
        # 1b. Seed Demo MSE User
        demo_user = models.User(
            email="demo@mse.gov.in",
            hashed_password=auth.get_password_hash("MSEWelcome2026"),
            role="mse",
            is_active=1
        )
        db.add(demo_user)
        db.commit()
        
        # 2. Define Sectors and Cities
        sectors = ["Handicrafts", "Textiles", "Agri", "Food Processing", "Leather", "Other"]
        cities = [
            ("Varanasi", "Uttar Pradesh"), ("Jaipur", "Rajasthan"), ("Kanchipuram", "Tamil Nadu"),
            ("Ludhiana", "Punjab"), ("Salem", "Tamil Nadu"), ("Surat", "Gujarat"),
            ("Nagpur", "Maharashtra"), ("Amritsar", "Punjab"), ("Indore", "Madhya Pradesh")
        ]

        # 3. Seed SNPs
        snps_data = [
            {"name": "Bharat Logistics HQ", "type": "Logistics", "email": "logistics@bharat.in", "pincodes": ["221001", "302001", "631501"]},
            {"name": "Gramin Digital Hub", "type": "Seller App", "email": "seller@gramin.in", "pincodes": ["141001", "636001", "395001"]},
            {"name": "Kisaan Connect Node", "type": "Seller App", "email": "node@kisaan.org", "pincodes": ["440001", "143001", "452001"]},
            {"name": "PayVillage Solutions", "type": "Payments", "email": "pay@village.com", "pincodes": ["110001", "400001", "560001"]}
        ]
        
        snp_objects = []
        for s in snps_data:
            user = models.User(email=s["email"], hashed_password=password_hash, role="snp", is_active=1)
            db.add(user)
            db.commit()
            
            snp = models.SNP(
                user_id=user.id,
                name=s["name"],
                type=s["type"],
                contact_person="Manager",
                email=s["email"],
                phone="9876543210",
                city="Multi-city",
                onboarding_fee=500.0 if s["type"] == "Logistics" else 0.0,
                commission_rate=5.0,
                supported_sectors=json.dumps(sectors),
                pincode_expertise=json.dumps(s["pincodes"]),
                capacity=1000,
                status=models.SNPStatus.active
            )
            db.add(snp)
            snp_objects.append(snp)
        db.commit()

        # 4. Seed MSEs across sectors
        mse_objects = []
        
        # Add the specific Demo MSE first
        demo_mse = models.MSE(
            user_id=demo_user.id,
            name="Bharat Green Textiles",
            contact_person="Aravind Kumar",
            email="demo@mse.gov.in",
            phone="9876543210",
            address="Sector 12, Industrial Area",
            city="Varanasi",
            state="Uttar Pradesh",
            pincode="221001",
            sector="Textiles",
            description="Organic cotton processing and handloom weaving cooperative.",
            status=models.MSEStatus.approved
        )
        db.add(demo_mse)
        mse_objects.append(demo_mse)

        for i in range(1, 15):
            sector = random.choice(sectors)
            city, state = random.choice(cities)
            email = f"mse{i}@enterprise.in"
            
            user = models.User(email=email, hashed_password=password_hash, role="mse", is_active=1)
            db.add(user)
            db.commit()
            
            mse = models.MSE(
                user_id=user.id,
                name=f"{city} {sector} Collective",
                contact_person="Authorized Rep",
                email=email,
                phone=f"99988877{i:02d}",
                address=f"Industrial Area Phase {random.randint(1,4)}",
                city=city,
                state=state,
                pincode=f"{random.randint(100000, 999999)}",
                sector=sector,
                description=f"Traditional {sector} production unit focused on local heritage.",
                status=models.MSEStatus.approved
            )
            db.add(mse)
            mse_objects.append(mse)
        db.commit()

        # 5. Seed Products for each MSE
        product_names = {
            "Handicrafts": ["Bamboo Basket", "Wood Carved Statue", "Clay Pottery Set"],
            "Textiles": ["Silk Saree", "Cotton Tunic", "Woolen Shawl"],
            "Agri": ["Organic Turmeric", "Basmati Rice", "Honey Jar"],
            "Food Processing": ["Mango Pickle", "Fruit Jam", "Dehydrated Snacks"],
            "Leather": ["Handmade Wallet", "Leather Belt", "Ethnic Jutti"],
            "Other": ["Solar Lantern", "LED Bulb", "Power Bank"]
        }

        for mse in mse_objects:
            # Add products
            for _ in range(random.randint(2, 4)):
                p_name = random.choice(product_names.get(mse.sector, ["General Product"]))
                product = models.Product(
                    mse_id=mse.mse_id,
                    product_name=f"{p_name} - {random.randint(100, 999)}",
                    description=f"High quality {p_name} from {mse.city}.",
                    price=float(random.randint(200, 5000)),
                    unit="pcs",
                    is_active=1
                )
                db.add(product)
            
            # Add Documents
            for doc_type in ["aadhar", "udyam"]:
                doc = models.OCRDocument(
                    mse_id=mse.mse_id,
                    document_type=doc_type,
                    file_path=f"samples/{doc_type}.png",
                    ocr_status="completed",
                    confidence_score=random.uniform(0.75, 0.99),
                    is_verified=True
                )
                db.add(doc)
        db.commit()

        # 6. Seed Transactions for Insights
        # Generate some historical data
        for _ in range(50):
            mse = random.choice(mse_objects)
            snp = random.choice([s for s in snp_objects if s.type in ["Logistics", "Seller App"]])
            
            status = random.choice(["verified", "verified", "verified", "completed", "pending"])
            days_ago = random.randint(1, 60)
            tx_date = datetime.utcnow() - timedelta(days=days_ago)
            
            tx = models.Transaction(
                mse_id=mse.mse_id,
                snp_id=snp.snp_id,
                order_id=f"ONDC-TX-{random.randint(10000, 99999)}",
                amount=float(random.randint(1000, 25000)),
                status=status,
                transaction_date=tx_date
            )
            db.add(tx)
        db.commit()

        # 7. Seed Partnerships
        for mse in mse_objects:
            for snp in random.sample(snp_objects, 2):
                start_date = datetime.utcnow() - timedelta(days=random.randint(5, 30))
                partnership = models.Partnership(
                    mse_id=mse.mse_id,
                    snp_id=snp.snp_id,
                    match_score=random.uniform(65, 98),
                    status=models.PartnershipStatus.active,
                    ai_reasoning="Strong sectoral alignment and regional proximity.",
                    mse_consent=True,
                    snp_consent=True,
                    initiated_by=random.choice(["mse", "system"]),
                    initiated_at=start_date,
                    approved_by=random.choice(["snp", "admin"]),
                    approved_at=start_date + timedelta(hours=random.randint(1, 48))
                )
                db.add(partnership)
        db.commit()

        print("Successfully re-seeded the database with diverse Indian sectors!")
        print(f"Seed Summary: {len(mse_objects)} MSEs, {len(snp_objects)} SNPs, 50 Transactions.")
        print("Default password for all users: enter123")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
