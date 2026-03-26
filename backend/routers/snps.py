from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
import json
import models, schemas, auth
from database import get_db
import uuid
from .products import TAXONOMY

router = APIRouter()

def _validate_supported_sectors(sectors_json: str | None):
    if not sectors_json:
        return
    try:
        sectors = json.loads(sectors_json)
        valid_sectors = list(TAXONOMY.keys()) + ["General Merchandise"]
        for s in sectors:
            if s not in valid_sectors:
                # We allow it, but maybe log a warning or restrict if strict taxonomy is required.
                # Requirement says "Allow custom entries with a tag-input", so we don't block.
                pass
    except:
        pass

def _validate_json_list_field(field_value: str | None, field_name: str):
    if not field_value:
        return
    try:
        data = json.loads(field_value)
        if not isinstance(data, list):
            raise HTTPException(status_code=400, detail=f"{field_name} must be a JSON list")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail=f"Invalid JSON format for {field_name}")

@router.post("/", response_model=schemas.SNPResponse, dependencies=[Depends(auth.RoleChecker(["admin"]))])
def create_snp(snp: schemas.SNPSubmit, db: Session = Depends(get_db)):
    # Check if exists
    if db.query(models.SNP).filter(models.SNP.email == snp.email).first():
        raise HTTPException(status_code=400, detail="SNP with this email already exists")
    
    # Create User record first
    db_user = models.User(
        email=snp.email,
        hashed_password=auth.get_password_hash(snp.password),
        role="snp"
    )
    db.add(db_user)
    db.flush()

    db_snp = models.SNP(
        user_id=db_user.id,
        name=snp.name,
        type=snp.type,
        contact_person=snp.contact_person,
        email=snp.email,
        phone=snp.phone,
        city=snp.city,
        onboarding_fee=snp.onboarding_fee,
        commission_rate=snp.commission_rate,
        rating=snp.rating,
        supported_sectors=snp.supported_sectors,
        pincode_expertise=snp.pincode_expertise,
        capacity=snp.capacity,
        current_load=snp.current_load,
        settlement_speed=snp.settlement_speed,
        fulfillment_reliability=snp.fulfillment_reliability
    )
    db.add(db_snp)
    db.commit()
    db.refresh(db_snp)
    return db_snp

@router.get("/", response_model=List[schemas.SNPResponse], dependencies=[Depends(auth.RoleChecker(["mse", "nsic", "snp", "admin"]))])
def list_snps(current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.SNP).all()

@router.get("/{snp_id}", response_model=schemas.SNPResponse, dependencies=[Depends(auth.RoleChecker(["mse", "nsic", "snp", "admin"]))])
def get_snp(snp_id: int, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_snp = db.query(models.SNP).filter(models.SNP.snp_id == snp_id).first()
    if not db_snp:
        raise HTTPException(status_code=404, detail="SNP not found")
    
    # Ownership Check
    if current_user["role"] == "snp" and db_snp.email != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this SNP profile")

    return db_snp

@router.post("/register", response_model=schemas.SNPRegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_snp(snp: schemas.SNPSubmit, db: Session = Depends(get_db)):
    existing_snp = db.query(models.SNP).filter(models.SNP.email == snp.email).first()
    existing_user = db.query(models.User).filter(models.User.email == snp.email).first()
    if existing_snp or existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already registered as a Network Participant. Please login."
        )
    _validate_json_list_field(snp.supported_sectors, "supported_sectors")
    _validate_supported_sectors(snp.supported_sectors)
    _validate_json_list_field(snp.pincode_expertise, "pincode_expertise")

    # Create corresponding User record
    db_user = models.User(
        email=snp.email,
        hashed_password=auth.get_password_hash(snp.password),
        role="snp"
    )
    db.add(db_user)
    db.flush() # Get user ID before committing

    db_snp = models.SNP(
        user_id=db_user.id,
        name=snp.name,
        type=snp.type,
        contact_person=snp.contact_person,
        email=snp.email,
        phone=snp.phone,
        city=snp.city,
        onboarding_fee=snp.onboarding_fee,
        commission_rate=snp.commission_rate,
        rating=snp.rating,
        supported_sectors=snp.supported_sectors,
        pincode_expertise=snp.pincode_expertise,
        capacity=snp.capacity,
        current_load=snp.current_load,
        settlement_speed=snp.settlement_speed,
        fulfillment_reliability=snp.fulfillment_reliability
    )
    db.add(db_snp)
    db.commit()
    db.refresh(db_snp)
    db.refresh(db_user)

    # Generate token immediately
    access_token = auth.create_access_token(
        data={"sub": db_user.email, "role": db_user.role, "id": db_user.id, "profile_id": db_snp.snp_id}
    )
    
    return {
        "snp": schemas.SNPResponse.model_validate(db_snp),
        "user": schemas.UserResponse.model_validate(db_user),
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.put("/{snp_id}", response_model=schemas.SNPResponse, dependencies=[Depends(auth.RoleChecker(["snp", "admin"]))])
def update_snp(snp_id: int, snp: schemas.SNPProfileCreate, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_snp = db.query(models.SNP).filter(models.SNP.snp_id == snp_id).first()
    if not db_snp:
        raise HTTPException(status_code=404, detail="SNP not found")

    # Ownership check
    if current_user["role"] == "snp" and db_snp.email != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this SNP profile")

    _validate_json_list_field(snp.supported_sectors, "supported_sectors")
    _validate_supported_sectors(snp.supported_sectors)
    _validate_json_list_field(snp.pincode_expertise, "pincode_expertise")

    db_snp.name = snp.name
    db_snp.type = snp.type
    db_snp.contact_person = snp.contact_person
    db_snp.phone = snp.phone
    db_snp.city = snp.city
    db_snp.onboarding_fee = snp.onboarding_fee
    db_snp.commission_rate = snp.commission_rate
    db_snp.rating = snp.rating
    db_snp.supported_sectors = snp.supported_sectors
    db_snp.pincode_expertise = snp.pincode_expertise
    db_snp.capacity = snp.capacity
    db_snp.current_load = snp.current_load
    db_snp.settlement_speed = snp.settlement_speed
    db_snp.fulfillment_reliability = snp.fulfillment_reliability

    db.commit()
    db.refresh(db_snp)
    return db_snp

@router.put("/{snp_id}/status", response_model=schemas.SNPResponse, dependencies=[Depends(auth.RoleChecker(["snp", "nsic", "admin"]))])
def update_snp_status(snp_id: int, status: str, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_snp = db.query(models.SNP).filter(models.SNP.snp_id == snp_id).first()
    if not db_snp:
        raise HTTPException(status_code=404, detail="SNP not found")

    if current_user["role"] == "snp" and db_snp.email != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized to update status for this SNP")
    
    if status.lower() == "active":
        db_snp.status = models.SNPStatus.active
    elif status.lower() == "inactive":
        db_snp.status = models.SNPStatus.inactive
    else:
        raise HTTPException(status_code=400, detail="Invalid status")

    db.commit()
    db.refresh(db_snp)
    return db_snp

@router.delete("/{snp_id}", dependencies=[Depends(auth.RoleChecker(["snp", "admin"]))])
def delete_snp(request: Request, snp_id: int, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """
    Remove an SNP profile and its user record.
    """
    db_snp = db.query(models.SNP).filter(models.SNP.snp_id == snp_id).first()
    if not db_snp:
        raise HTTPException(status_code=404, detail="SNP not found")

    # Ownership check
    if current_user["role"] == "snp" and db_snp.email != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this SNP profile")

    # Admin Audit Log
    if current_user["role"] == "admin":
        audit = models.SystemAuditLog(
            user_role="admin",
            user_id=current_user["id"],
            action="ADMIN_DELETE_SNP",
            details=f"Admin deleted SNP profile: {db_snp.name} (ID: {snp_id}, Email: {db_snp.email})",
            ip_address=request.client.host if request.client else "unknown"
        )
        db.add(audit)

    # Remove corresponding user record
    db_user = db.query(models.User).filter(models.User.email == db_snp.email).first()
    if db_user:
        db.delete(db_user)

    db.delete(db_snp)
    db.commit()
    return {"message": "SNP profile and user record deleted successfully"}
