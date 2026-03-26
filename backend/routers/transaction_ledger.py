from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, Request
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import List, Dict
import asyncio
import logging
import datetime
import models, schemas, auth
from database import get_db

router = APIRouter()
logger = logging.getLogger(__name__)

# LED-03: Real-Time Payments WebSocket Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

@router.websocket("/ws")
async def ledger_websocket(websocket: WebSocket, token: str = Query(default=None)):
    # Validate JWT before accepting — WebSocket upgrades can't use Authorization headers
    if not token:
        # Accept then close so the client receives a close event instead of a handshake error
        await websocket.accept()
        await websocket.close(code=1008, reason="Missing token")
        return
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        if not payload.get("sub"):
            raise JWTError("Missing subject claim")
    except JWTError as exc:
        logger.warning("Ledger WS rejected: invalid token (%s)", exc)
        await websocket.accept()
        await websocket.close(code=1008, reason="Invalid token")
        return

    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

from .notifications import send_external_notification

@router.post("/", response_model=schemas.TransactionResponse, dependencies=[Depends(auth.RoleChecker(["snp", "admin", "mse"]))])
async def record_transaction(transaction: schemas.TransactionSubmit, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_transaction = models.Transaction(
        mse_id=transaction.mse_id,
        snp_id=transaction.snp_id,
        order_id=transaction.order_id,
        amount=transaction.amount,
        status=transaction.status,
        transaction_date=transaction.transaction_date
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    
    # NOT-02: Simulated SMS to MSE about the new ledger entry
    send_external_notification(
        db, 
        db_transaction.mse_id, 
        "mse", 
        "SMS", 
        f"ONDC Settlement: A new transaction of ₹{db_transaction.amount:,.2f} (Order {db_transaction.order_id}) has been recorded by SNP {db_transaction.snp_id}."
    )

    # Broadcast new transaction
    await manager.broadcast({"event": "new_transaction", "transaction_id": db_transaction.transaction_id})
    return db_transaction

@router.get("/", response_model=List[schemas.TransactionResponse], dependencies=[Depends(auth.RoleChecker(["mse", "snp", "nsic", "admin"]))])
def get_transactions(mse_id: int | None = None, snp_id: int | None = None, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.Transaction)
    
    # UM-03: Ownership-based filtering for business nodes
    if current_user["role"] == "mse":
        # MSEs can only see their own transactions
        target_mse = db.query(models.MSE).filter(models.MSE.email == current_user["email"]).first()
        if target_mse:
            query = query.filter(models.Transaction.mse_id == target_mse.mse_id)
        else:
            return [] # No MSE profile found
    elif current_user["role"] == "snp":
        target_snp = db.query(models.SNP).filter(models.SNP.email == current_user["email"]).first()
        if target_snp:
            query = query.filter(models.Transaction.snp_id == target_snp.snp_id)
        else:
            return []
    else:
        # NSIC/Admin can filter by query params
        if mse_id:
            query = query.filter(models.Transaction.mse_id == mse_id)
        if snp_id:
            query = query.filter(models.Transaction.snp_id == snp_id)
            
    return query.all()

@router.post("/{transaction_id}/verify", response_model=schemas.TransactionResponse, dependencies=[Depends(auth.RoleChecker(["mse", "admin"]))])
def verify_transaction(request: Request, transaction_id: int, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_tx = db.query(models.Transaction).filter(models.Transaction.transaction_id == transaction_id).first()
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Ownership Check (UM-03)
    if current_user["role"] == "mse":
        target_mse = db.query(models.MSE).filter(models.MSE.email == current_user["email"]).first()
        if not target_mse or db_tx.mse_id != target_mse.mse_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this transaction")
    
    # Admin Audit Log
    if current_user["role"] == "admin":
        audit = models.SystemAuditLog(
            user_role="admin",
            user_id=current_user["id"],
            action="ADMIN_VERIFY_TRANSACTION",
            details=f"Admin verified transaction #{transaction_id} for MSE #{db_tx.mse_id}",
            ip_address=request.client.host if request.client else "unknown"
        )
        db.add(audit)

    db_tx.status = models.TransactionStatus.verified
    db_tx.updated_at = datetime.datetime.utcnow()
    
    # Update SNP Settlement Speed (Dynamic Performance Tracking)
    snp = db_tx.snp
    if snp:
        # Calculate hours since creation
        diff = db_tx.updated_at - db_tx.transaction_date
        hours = max(0.1, diff.total_seconds() / 3600)
        
        # Speed Score: 1.0 if < 1hr, decaying to 0.0 at 72hrs
        current_tx_speed = max(0.0, 1.0 - (hours / 72))
        
        # Moving average (90% weight to history, 10% to new data)
        snp.settlement_speed = (snp.settlement_speed * 0.9) + (current_tx_speed * 0.1)

    db.commit()
    db.refresh(db_tx)
    return db_tx

@router.post("/ondc-webhook", dependencies=[Depends(auth.RoleChecker(["admin", "nsic"]))])
async def ondc_webhook(payload: dict, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # TXN-02: External ONDC Push API integration
    try:
        mse_id = payload.get("mse_id")
        snp_id = payload.get("snp_id")
        if not mse_id or not snp_id:
            raise HTTPException(status_code=400, detail="Missing mandatory mse_id or snp_id")

        order_info = payload.get("message", {}).get("order", {})
        payment_info = order_info.get("payment", {})
        params = payment_info.get("params", {}) if isinstance(payment_info, dict) else {}
        amount = float(params.get("amount", "0") if isinstance(params, dict) else "0")
        
        db_transaction = models.Transaction(
            mse_id=mse_id,
            snp_id=snp_id,
            order_id=order_info.get("id", f"ondc-{payload.get('context', {}).get('transaction_id', 'mock')}"),
            amount=amount,
            status=models.TransactionStatus.pending
        )
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        
        await manager.broadcast({"event": "new_transaction", "transaction_id": db_transaction.transaction_id})
        return {"status": "ACK", "message": "ONDC push logged"}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.exception("Internal error in ONDC webhook")
        raise HTTPException(status_code=400, detail="Invalid ONDC payload format or internal error")

@router.get("/{transaction_id}/audit-trail", response_model=List[schemas.TransactionAuditTrail], dependencies=[Depends(auth.RoleChecker(["mse", "snp", "nsic", "admin"]))])
def get_transaction_audit_trail(transaction_id: int, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """
    Get audit history for a specific transaction.
    """
    db_tx = db.query(models.Transaction).filter(models.Transaction.transaction_id == transaction_id).first()
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Ownership check
    if current_user["role"] == "mse":
        target_mse = db.query(models.MSE).filter(models.MSE.email == current_user["email"]).first()
        if not target_mse or db_tx.mse_id != target_mse.mse_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this transaction")
    elif current_user["role"] == "snp":
        target_snp = db.query(models.SNP).filter(models.SNP.email == current_user["email"]).first()
        if not target_snp or db_tx.snp_id != target_snp.snp_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this transaction")

    # Search for audit logs related to this transaction
    logs = db.query(models.SystemAuditLog).filter(
        models.SystemAuditLog.details.contains(f"transaction_id\": {transaction_id}") | 
        models.SystemAuditLog.details.contains(f"Transaction #{transaction_id}")
    ).order_by(models.SystemAuditLog.timestamp.desc()).all()
    
    return logs

@router.post("/{transaction_id}/dispute", dependencies=[Depends(auth.RoleChecker(["mse"]))])
def raise_conflict(transaction_id: int, conflict_data: dict, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_tx = db.query(models.Transaction).filter(models.Transaction.transaction_id == transaction_id).first()
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Ownership Check (UM-03)
    target_mse = db.query(models.MSE).filter(models.MSE.email == current_user["email"]).first()
    if not target_mse or db_tx.mse_id != target_mse.mse_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this transaction")
        
    db_tx.status = models.TransactionStatus.failed
    
    conflict = models.TransactionConflict(
        transaction_id=transaction_id,
        conflict_type=conflict_data.get("type", "amount_mismatch"),
        description=conflict_data.get("description", "User raised dispute"),
        status="active"
    )
    
    # Notify NSIC
    db.add(models.Notification(
        user_role="nsic",
        title="Ledger Dispute Raised",
        message=f"Conflict #{transaction_id} reported. Type: {conflict.conflict_type}",
    ))
    
    db.add(conflict)
    db.commit()
    return {"status": "success", "message": "Dispute logged with NSIC"}
