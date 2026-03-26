from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
import random
import models, schemas, auth
from database import get_db

router = APIRouter()

@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register_account(data: schemas.UserRegisterRequest, db: Session = Depends(get_db)):
    if data.role not in ("mse", "snp"):
        raise HTTPException(status_code=400, detail="Role must be 'mse' or 'snp'")
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered. Please login.")
    db_user = models.User(
        email=data.email,
        hashed_password=auth.get_password_hash(data.password),
        role=data.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    access_token = auth.create_access_token(data={"sub": db_user.email, "role": db_user.role, "id": db_user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/send-otp")
def send_otp(request: schemas.OTPRequest, db: Session = Depends(get_db)):
    print(f"OTP Request for identifier: {request.email}")
    user = db.query(models.User).filter(models.User.email == request.email).first()

    # Always return the same response — never reveal whether the account exists
    if user:
        otp_code = str(random.randint(100000, 999999))
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        db.add(models.OTPVerification(
            email=request.email,
            otp_code=otp_code,
            expires_at=expires_at
        ))
        db.commit()
        print(f"\n[AUTH SERVICE] OTP for {request.email}: {otp_code}\n")
    else:
        print(f"Identifier {request.email} not found in DB — suppressing response difference")

    return {"message": "OTP sent successfully. Please check your registered mobile/email."}

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(request: Request, login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    print(f"Login attempt for identifier: {login_data.email}")
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    
    if not user:
        print(f"Login identifier {login_data.email} not found in DB")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1. Check OTP if provided
    if login_data.otp_code:
        otp_verify = db.query(models.OTPVerification).filter(
            models.OTPVerification.email == login_data.email,
            models.OTPVerification.otp_code == login_data.otp_code
        ).order_by(models.OTPVerification.created_at.desc()).first()
        
        if not otp_verify or otp_verify.expires_at < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
            
        # Success - clean up OTP
        db.delete(otp_verify)
        db.commit()
        
    # 2. Check Password if provided (fallback or alternative)
    elif login_data.password:
        if not auth.verify_password(login_data.password, user.hashed_password):
            # Audit log for failed attempt
            print(f"Login failed: Invalid password for {login_data.email}")
            audit = models.SystemAuditLog(
                user_role=user.role,
                user_id=user.id,
                action="LOGIN_FAILED",
                details=f"User {user.email} failed to authenticate via password.",
                ip_address=request.client.host if request.client else "unknown"
            )
            db.add(audit)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        raise HTTPException(status_code=400, detail="Password or OTP required")
        
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    # Include profile ID in token for convenience
    profile_id = None
    if user.role == "mse":
        mse = db.query(models.MSE).filter(models.MSE.email == user.email).first()
        if mse: profile_id = mse.mse_id
    elif user.role == "snp":
        snp = db.query(models.SNP).filter(models.SNP.email == user.email).first()
        if snp: profile_id = snp.snp_id

    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role, "id": user.id, "profile_id": profile_id}, 
        expires_delta=access_token_expires
    )
    
    # AUDIT LOG
    audit = models.SystemAuditLog(
        user_role=user.role,
        user_id=user.id,
        action="LOGIN_SUCCESS",
        details=f"User {user.email} successfully authenticated.",
        ip_address=request.client.host if request.client else "unknown"
    )
    db.add(audit)
    db.commit()

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def read_users_me(current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == current_user["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    profile_id = None
    if user.role == "mse":
        mse = db.query(models.MSE).filter(models.MSE.email == user.email).first()
        if mse: profile_id = mse.mse_id
    elif user.role == "snp":
        snp = db.query(models.SNP).filter(models.SNP.email == user.email).first()
        if snp: profile_id = snp.snp_id
        
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "profile_id": profile_id
    }

@router.get("/me/mse", response_model=schemas.MSEResponse)
def get_current_mse_profile(current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "mse":
        raise HTTPException(status_code=403, detail="Current user is not an MSE")
    mse = db.query(models.MSE).filter(models.MSE.email == current_user["email"]).first()
    if not mse:
        raise HTTPException(status_code=404, detail="MSE profile not found")
    return mse

@router.get("/me/snp", response_model=schemas.SNPResponse)
def get_current_snp_profile(current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "snp":
        raise HTTPException(status_code=403, detail="Current user is not an SNP")
    snp = db.query(models.SNP).filter(models.SNP.email == current_user["email"]).first()
    if not snp:
        raise HTTPException(status_code=404, detail="SNP profile not found")
    return snp

from pydantic import BaseModel
import uuid

class MinimalRegisterRequest(BaseModel):
    email: str
    phone: str
    role: str
    password: str | None = None

@router.post("/register-minimal", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register_minimal(data: MinimalRegisterRequest, db: Session = Depends(get_db)):
    if data.role not in ("mse", "snp"):
        raise HTTPException(status_code=400, detail="Role must be 'mse' or 'snp'")
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered. Please login.")

    # Store a random password since this flow is OTP-first; user can set a password later.
    raw_password = data.password or str(uuid.uuid4())
    temp_password = auth.get_password_hash(raw_password)
    db_user = models.User(
        email=data.email,
        hashed_password=temp_password,
        role=data.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    access_token = auth.create_access_token(data={"sub": db_user.email, "role": db_user.role, "id": db_user.id})
    return {"access_token": access_token, "token_type": "bearer"}

class ResetPasswordRequest(BaseModel):
    username: str
    otp_code: str
    new_password: str

class SetPasswordRequest(BaseModel):
    new_password: str

@router.post("/set-password")
def set_password(data: SetPasswordRequest, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == current_user["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = auth.get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password set successfully"}

@router.post("/reset-password")
def reset_password(request: Request, data: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Require a valid, unexpired OTP — proves the caller owns the account
    otp_verify = db.query(models.OTPVerification).filter(
        models.OTPVerification.email == data.username,
        models.OTPVerification.otp_code == data.otp_code
    ).order_by(models.OTPVerification.created_at.desc()).first()
    if not otp_verify or otp_verify.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    db.delete(otp_verify)

    user.hashed_password = auth.get_password_hash(data.new_password)
    
    # Audit log (UM-04)
    audit = models.SystemAuditLog(
        user_role=user.role,
        user_id=user.id,
        action="PASSWORD_RESET_SUCCESS",
        details=f"User {user.email} successfully completed password reset workflow.",
        ip_address=request.client.host if request.client else "unknown"
    )
    db.add(audit)
    db.commit()
    return {"message": "Password successfully reset"}
