from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth
from typing import List

router = APIRouter()

from sqlalchemy import or_

@router.get("/", response_model=List[schemas.NotificationResponse], dependencies=[Depends(auth.RoleChecker(["mse", "snp", "nsic", "admin"]))])
def get_notifications(current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # NOT-02: Include broadcast messages (user_role="ALL")
    # Role and entity identity are derived from JWT — never from caller-supplied params
    role = current_user["role"]

    entity_id = None
    if role == "mse":
        mse = db.query(models.MSE).filter(models.MSE.email == current_user["email"]).first()
        if mse:
            entity_id = mse.mse_id
    elif role == "snp":
        snp = db.query(models.SNP).filter(models.SNP.email == current_user["email"]).first()
        if snp:
            entity_id = snp.snp_id

    try:
        base_filter = or_(
            models.Notification.user_role == role,
            models.Notification.user_role == "ALL"
        )
        query = db.query(models.Notification).filter(base_filter)
        if entity_id is not None:
            query = query.filter(or_(
                models.Notification.user_id == entity_id,
                models.Notification.user_id.is_(None)
            ))
        results = query.order_by(models.Notification.created_at.desc()).limit(20).all()
        return results
    except Exception as e:
        print(f"Error in get_notifications: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{notification_id}/read", dependencies=[Depends(auth.RoleChecker(["mse", "snp", "nsic", "admin"]))])
def mark_read(notification_id: int, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    notif = db.query(models.Notification).filter(models.Notification.notification_id == notification_id).first()
    if notif:
        notif.is_read = 1
        db.commit()
    return {"status": "success"}

@router.post("/batch-read", dependencies=[Depends(auth.RoleChecker(["mse", "snp", "nsic", "admin"]))])
def mark_all_read(current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    role = current_user["role"]

    entity_id = None
    if role == "mse":
        mse = db.query(models.MSE).filter(models.MSE.email == current_user["email"]).first()
        if mse:
            entity_id = mse.mse_id
    elif role == "snp":
        snp = db.query(models.SNP).filter(models.SNP.email == current_user["email"]).first()
        if snp:
            entity_id = snp.snp_id

    query = db.query(models.Notification).filter(models.Notification.user_role == role)
    if entity_id is not None:
        query = query.filter(models.Notification.user_id == entity_id)
    query.update({models.Notification.is_read: 1})
    db.commit()
    return {"status": "success"}

@router.get("/preferences", response_model=schemas.NotificationPreferenceResponse, dependencies=[Depends(auth.RoleChecker(["mse", "snp", "nsic", "admin"]))])
def get_preferences(current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    prefs = db.query(models.NotificationPreference).filter(models.NotificationPreference.user_id == current_user["id"]).first()
    if not prefs:
        # Create default preferences if they don't exist
        prefs = models.NotificationPreference(user_id=current_user["id"])
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return prefs

@router.put("/preferences", response_model=schemas.NotificationPreferenceResponse, dependencies=[Depends(auth.RoleChecker(["mse", "snp", "nsic", "admin"]))])
def update_preferences(req: schemas.NotificationPreferenceBase, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    prefs = db.query(models.NotificationPreference).filter(models.NotificationPreference.user_id == current_user["id"]).first()
    if not prefs:
        prefs = models.NotificationPreference(user_id=current_user["id"])
        db.add(prefs)
    
    prefs.email_enabled = req.email_enabled
    prefs.sms_enabled = req.sms_enabled
    prefs.in_app_enabled = req.in_app_enabled
    prefs.marketing_enabled = req.marketing_enabled
    
    db.commit()
    db.refresh(prefs)
    return prefs

from pydantic import BaseModel
class DispatchRequest(BaseModel):
    user_id: int
    role: str
    channel: str # 'SMS' or 'EMAIL'
    message: str

def send_external_notification(db: Session, user_id: int, role: str, channel: str, message: str):
    """
    NOT-01/02: Core dispatch utility with Preference Enforcement.
    """
    # 1. Fetch User and Preferences
    # Note: user_id in Notification model currently refers to mse_id or snp_id based on old schema
    # We need to find the actual User record to check preferences
    target_user = None
    if role == "mse":
        mse = db.query(models.MSE).filter(models.MSE.mse_id == user_id).first()
        if mse:
            target_user = db.query(models.User).filter(models.User.email == mse.email).first()
    elif role == "snp":
        snp = db.query(models.SNP).filter(models.SNP.snp_id == user_id).first()
        if snp:
            target_user = db.query(models.User).filter(models.User.email == snp.email).first()
    
    if not target_user:
        print(f"Skipping dispatch: User not found for {role} {user_id}")
        return None

    prefs = db.query(models.NotificationPreference).filter(models.NotificationPreference.user_id == target_user.id).first()
    if not prefs:
        # Default policy: Email and In-App enabled
        prefs = models.NotificationPreference(user_id=target_user.id, email_enabled=True, in_app_enabled=True)
        db.add(prefs)
        db.commit()

    # 2. Check Channel Opt-In
    allowed = False
    if channel == "EMAIL" and prefs.email_enabled:
        allowed = True
    elif channel == "SMS" and prefs.sms_enabled:
        allowed = True
    
    if not allowed:
        print(f"Skipping dispatch: User has disabled {channel} channel.")
        return None

    # 3. Final Dispatch Logic
    print(f"\n{'='*60}")
    print(f"[{channel} DISPATCH SUCCESS]")
    print(f"TO (AUTH_ID): {target_user.id} ({target_user.email})")
    print(f"MESSAGE: {message}")
    print(f"{'='*60}\n")
    
    # Save in-app record if in_app is enabled
    if prefs.in_app_enabled:
        notif = models.Notification(
            user_role=role,
            user_id=user_id,
            title=f"National Gateway: {channel} Alert",
            message=message,
            type="info"
        )
        db.add(notif)
        db.commit()
        return notif
    return None

@router.post("/dispatch", dependencies=[Depends(auth.RoleChecker(["admin", "nsic"]))])
def dispatch_external_notification(req: DispatchRequest, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """
    NOT-01: API wrapper for external triggers.
    """
    result = send_external_notification(db, req.user_id, req.role, req.channel, req.message)
    if not result and req.channel in ["SMS", "EMAIL"]:
         return {"status": "skipped", "reason": "user_opt_out_or_not_found"}
    return {"status": "dispatched", "channel": req.channel}
