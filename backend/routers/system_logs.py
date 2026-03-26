from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
import auth

router = APIRouter(
    prefix="/system",
    tags=["system"]
)

@router.post("/logs", response_model=schemas.SystemAuditLogResponse, dependencies=[Depends(auth.RoleChecker(["admin", "nsic"]))])
def log_action(log_submit: schemas.SystemAuditLogSubmit, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_log = models.SystemAuditLog(**log_submit.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/logs", response_model=List[schemas.SystemAuditLogResponse], dependencies=[Depends(auth.RoleChecker(["admin", "nsic"]))])
def get_logs(limit: int = 50, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.SystemAuditLog).order_by(models.SystemAuditLog.timestamp.desc()).limit(limit).all()

@router.post("/notify/external", dependencies=[Depends(auth.RoleChecker(["admin", "nsic"]))])
def trigger_external_notification(recipient: str, message: str, type: str = "sms", current_user: dict = Depends(auth.get_current_user)):
    """
    Dummy endpoint for triggering external notifications (SMS, Email) via services like Twilio or AWS SNS.
    """
    # Simulated external API call
    print(f"[EXT_NOTIFY] Sending {type.upper()} to {recipient}: {message}")
    return {"status": "success", "provider": "mock_sns", "delivered_to": recipient}
