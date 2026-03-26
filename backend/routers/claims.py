from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from typing import List, Optional
import models, schemas, auth
from database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.ClaimResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(auth.RoleChecker(["mse"]))])
def submit_claim(claim: schemas.ClaimSubmit, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Ownership Check (UM-03)
    target_mse = db.query(models.MSE).filter(models.MSE.mse_id == claim.mse_id).first()
    if not target_mse or target_mse.email != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized to submit claims for this MSE")
    
    db_claim = models.Claim(
        mse_id=claim.mse_id,
        claim_type=claim.claim_type,
        claim_data=claim.claim_data,
        status=models.ClaimStatus.pending
    )
    db.add(db_claim)
    db.commit()
    db.refresh(db_claim)
    return db_claim

@router.get("/pending", response_model=List[schemas.ClaimResponse], dependencies=[Depends(auth.RoleChecker(["nsic"]))])
def list_pending_claims(claim_type: Optional[str] = None, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.Claim).filter(models.Claim.status == models.ClaimStatus.pending)
    if claim_type:
        query = query.filter(models.Claim.claim_type == claim_type)
    return query.all()

import json
from fastapi import Request

@router.put("/{claim_id}/verify", response_model=schemas.ClaimResponse, dependencies=[Depends(auth.RoleChecker(["nsic", "admin"]))])
def verify_claim(request: Request, claim_id: int, verification: dict, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_claim = db.query(models.Claim).filter(models.Claim.claim_id == claim_id).first()
    if not db_claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    old_status = db_claim.status
    new_status = verification.get("status", models.ClaimStatus.verified)
    db_claim.status = new_status
    db_claim.comments = verification.get("comments")
    db_claim.verified_by = current_user["email"]
    
    # CLAIM-06: Verification Action History (Logged to System Audit)
    audit = models.SystemAuditLog(
        user_role=current_user["role"],
        user_id=current_user["id"],
        action="VERIFY_CLAIM",
        details=json.dumps({
            "claim_id": claim_id,
            "claim_type": db_claim.claim_type,
            "old_status": old_status,
            "new_status": new_status,
            "comments": db_claim.comments
        }),
        ip_address=request.client.host if request.client else "unknown"
    )
    db.add(audit)

    # Workflow Logic by Claim Type
    if new_status == models.ClaimStatus.verified:
        # 1. Registration Claims: Approve MSE
        if "registration" in db_claim.claim_type.lower():
            mse = db.query(models.MSE).filter(models.MSE.mse_id == db_claim.mse_id).first()
            if mse:
                mse.status = models.MSEStatus.approved

        # 2. Product Claims: Activate products listed in claim_data
        elif "product" in db_claim.claim_type.lower():
            try:
                claim_data = json.loads(db_claim.claim_data)
                product_ids = claim_data.get("product_ids", [])
                if product_ids:
                    db.query(models.Product).filter(
                        models.Product.product_id.in_(product_ids),
                        models.Product.mse_id == db_claim.mse_id
                    ).update({models.Product.is_active: 1}, synchronize_session=False)
            except Exception as e:
                print(f"Error processing product claim data: {e}")

        # 3. Subsidy Claims: Record payout in transaction ledger
        elif "subsidy" in db_claim.claim_type.lower():
            try:
                claim_data = json.loads(db_claim.claim_data)
                amount = claim_data.get("requested_amount", 0)
                # Create a simulated 'completed' transaction for the subsidy payout
                subsidy_tx = models.Transaction(
                    mse_id=db_claim.mse_id,
                    snp_id=1, # NSIC node (mocked)
                    order_id=f"SUBSIDY-{claim_id}",
                    amount=amount,
                    status=models.TransactionStatus.completed
                )
                db.add(subsidy_tx)
            except Exception as e:
                print(f"Error processing subsidy claim payout: {e}")
    
    db.commit()

    # Create notification for MSE
    notif_title = "Compliance Approved" if db_claim.status == models.ClaimStatus.verified else "Compliance Rejected"
    notif_msg = f"Your {db_claim.claim_type} verification is complete."
    if db_claim.comments:
        notif_msg += f" Note: {db_claim.comments}"
    
    db.add(models.Notification(
        user_role="mse",
        user_id=db_claim.mse_id,
        title=notif_title,
        message=notif_msg,
        type="success" if db_claim.status == models.ClaimStatus.verified else "error"
    ))
    db.commit()

    db.refresh(db_claim)
    return db_claim
