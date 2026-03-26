import models
from database import SessionLocal

db = SessionLocal()
user = db.query(models.User).filter(models.User.email == "admin").first()
if user:
    print(f"Found: {user.email}, Role: {user.role}")
else:
    print("Not found")
db.close()
