from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, auth
from database import get_db

router = APIRouter()

@router.get("/", response_model=list[schemas.TransactionConflictResponse], dependencies=[Depends(auth.RoleChecker(["nsic", "admin"]))])
def get_conflicts(current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.TransactionConflict).all()

@router.post("/{conflict_id}/resolve", dependencies=[Depends(auth.RoleChecker(["nsic", "admin"]))])
def resolve_conflict(conflict_id: int, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    conflict = db.query(models.TransactionConflict).filter(models.TransactionConflict.conflict_id == conflict_id).first()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")
    conflict.status = "resolved"
    db.commit()

    # Create notification for NSIC (as an example of system confirmation)
    db.add(models.Notification(
        user_role="nsic",
        title="Conflict Rectified",
        message=f"Dispute {conflict.conflict_id} has been formally closed.",
        type="success"
    ))
    db.commit()

    return {"message": "Conflict resolved"}
