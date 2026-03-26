from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
import models, schemas, auth
from database import get_db
from datetime import datetime, timedelta
import random
import traceback

router = APIRouter()

@router.get("/{mse_id}/sales_trend", dependencies=[Depends(auth.RoleChecker(["mse", "nsic", "admin"]))])
def get_sales_trend(mse_id: int, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        # Ownership check for MSE users
        if current_user["role"] == "mse":
            mse_owner = db.query(models.MSE).filter(models.MSE.mse_id == mse_id).first()
            if not mse_owner or mse_owner.email != current_user["email"]:
                raise HTTPException(status_code=403, detail="Not authorized to view analytics for this MSE")
        days = []
        base_date = datetime.now().date()
        
        for i in range(6, -1, -1):
            target_date = base_date - timedelta(days=i)
            # Filter transactions for this specific day - Transaction model uses 'transaction_date'
            daily_txs = db.query(models.Transaction).filter(
                models.Transaction.mse_id == mse_id,
                models.Transaction.transaction_date >= datetime.combine(target_date, datetime.min.time()),
                models.Transaction.transaction_date <= datetime.combine(target_date, datetime.max.time())
            ).all()
            
            days.append({
                "date": target_date.strftime("%Y-%m-%d"),
                "sales": sum([tx.amount for tx in daily_txs]) or 0,
                "orders": len(daily_txs)
            })
        
        return days
    except Exception as e:
        print(f"Error in get_sales_trend: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import StreamingResponse
import io
import csv

@router.get("/{mse_id}/sales_trend/export", dependencies=[Depends(auth.RoleChecker(["mse"]))])
def export_sales_trend(mse_id: int, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    days = get_sales_trend(mse_id, current_user, db)
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["date", "sales", "orders"])
    writer.writeheader()
    writer.writerows(days)
    
    output.seek(0)
    
    headers = {
        'Content-Disposition': f'attachment; filename="mse_{mse_id}_sales_export.csv"'
    }
    return StreamingResponse(output, media_type="text/csv", headers=headers)

@router.get("/{mse_id}/performance", dependencies=[Depends(auth.RoleChecker(["mse", "nsic", "admin"]))])
def get_performance_metrics(mse_id: int, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        # Ownership check for MSE users
        if current_user["role"] == "mse":
            mse_owner = db.query(models.MSE).filter(models.MSE.mse_id == mse_id).first()
            if not mse_owner or mse_owner.email != current_user["email"]:
                raise HTTPException(status_code=403, detail="Not authorized to view analytics for this MSE")
        # Calculate some real-ish metrics
        mse = db.query(models.MSE).filter(models.MSE.mse_id == mse_id).first()
        if not mse:
            raise HTTPException(status_code=404, detail="MSE not found")
            
        transactions = db.query(models.Transaction).filter(models.Transaction.mse_id == mse_id).all()
        total_sales = sum([tx.amount for tx in transactions])
        order_count = len(transactions)

        verified_txs = [
            tx for tx in transactions
            if tx.status == models.TransactionStatus.verified
            and tx.transaction_date
            and tx.updated_at
            and tx.updated_at >= tx.transaction_date
        ]
        if verified_txs:
            avg_seconds = sum(
                (tx.updated_at - tx.transaction_date).total_seconds() for tx in verified_txs
            ) / len(verified_txs)
            avg_days = avg_seconds / 86400
            settlement_delay = f"{avg_days:.1f} days"
        else:
            settlement_delay = "N/A"

        return {
            "revenue": total_sales,
            "orders": order_count,
            "avg_value": total_sales / order_count if order_count > 0 else 0,
            "settlement_delay": settlement_delay
        }
    except Exception as e:
        print(f"Error in get_performance_metrics: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mse-activity/{mse_id}", dependencies=[Depends(auth.RoleChecker(["mse", "nsic", "admin"]))])
def get_mse_activity(mse_id: int, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] == "mse":
        mse_owner = db.query(models.MSE).filter(models.MSE.mse_id == mse_id).first()
        if not mse_owner or mse_owner.email != current_user["email"]:
            raise HTTPException(status_code=403, detail="Not authorized to view activity for this MSE")

    activities = []

    txs = db.query(models.Transaction).filter(
        models.Transaction.mse_id == mse_id
    ).order_by(models.Transaction.transaction_date.desc()).limit(8).all()
    for tx in txs:
        activities.append({
            "type": "transaction",
            "title": f"Transaction {tx.status.value.capitalize()}",
            "content": f"₹{tx.amount:,.2f} — Order {tx.order_id or tx.transaction_id}",
            "timestamp": tx.transaction_date,
        })

    partnerships = db.query(models.Partnership).filter(
        models.Partnership.mse_id == mse_id
    ).order_by(models.Partnership.created_at.desc()).limit(8).all()
    for p in partnerships:
        event_ts = p.approved_at or p.initiated_at or p.created_at
        if p.status == models.PartnershipStatus.active:
            title, content = "Partnership Activated", "Your network partnership is now active."
        elif p.status == models.PartnershipStatus.rejected:
            title, content = "Partnership Rejected", "Your partnership request was not accepted."
        elif p.status == models.PartnershipStatus.closed:
            title, content = "Partnership Closed", "A network partnership has been closed."
        else:
            title, content = "Partnership Requested", "A new partnership request has been submitted."
        activities.append({
            "type": "partnership",
            "title": title,
            "content": content,
            "timestamp": event_ts,
        })

    notifications = db.query(models.Notification).filter(
        models.Notification.user_id == mse_id,
        models.Notification.user_role == "mse"
    ).order_by(models.Notification.created_at.desc()).limit(8).all()
    for n in notifications:
        activities.append({
            "type": "notification",
            "title": n.title,
            "content": n.message,
            "timestamp": n.created_at,
        })

    activities.sort(key=lambda x: x["timestamp"] if x["timestamp"] else datetime.min, reverse=True)
    return activities[:8]

@router.get("/mse-compliance/{mse_id}", dependencies=[Depends(auth.RoleChecker(["mse", "nsic", "admin"]))])
def get_mse_compliance(mse_id: int, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] == "mse":
        mse_owner = db.query(models.MSE).filter(models.MSE.mse_id == mse_id).first()
        if not mse_owner or mse_owner.email != current_user["email"]:
            raise HTTPException(status_code=403, detail="Not authorized to view compliance for this MSE")

    mse = db.query(models.MSE).filter(models.MSE.mse_id == mse_id).first()
    if not mse:
        raise HTTPException(status_code=404, detail="MSE not found")

    # Registration
    registration = {
        "status": mse.status.value,
        "label": {"approved": "Approved", "pending": "Pending Review", "rejected": "Rejected"}.get(mse.status.value, mse.status.value),
    }

    # Document verification
    docs = db.query(models.OCRDocument).filter(models.OCRDocument.mse_id == mse_id).all()
    doc_items = [
        {
            "document_id": d.document_id,
            "document_type": d.document_type,
            "ocr_status": d.ocr_status,
            "is_verified": d.is_verified,
            "confidence_score": d.confidence_score,
        }
        for d in docs
    ]
    verified_doc_count = sum(1 for d in docs if d.is_verified)
    documents = {
        "total": len(docs),
        "verified": verified_doc_count,
        "pending": sum(1 for d in docs if not d.is_verified and d.ocr_status != "failed"),
        "failed": sum(1 for d in docs if d.ocr_status == "failed"),
        "items": doc_items,
    }

    # Claims
    claims = db.query(models.Claim).filter(models.Claim.mse_id == mse_id).all()
    claim_items = [
        {
            "claim_id": c.claim_id,
            "claim_type": c.claim_type,
            "status": c.status.value,
            "created_at": c.created_at,
        }
        for c in claims
    ]
    verified_claim_count = sum(1 for c in claims if c.status == models.ClaimStatus.verified)
    claims_out = {
        "total": len(claims),
        "verified": verified_claim_count,
        "pending": sum(1 for c in claims if c.status == models.ClaimStatus.pending),
        "rejected": sum(1 for c in claims if c.status == models.ClaimStatus.rejected),
        "items": claim_items,
    }

    # Overall compliance
    checks_passed = sum([
        mse.status == models.MSEStatus.approved,
        verified_doc_count > 0,
        verified_claim_count > 0,
    ])
    if mse.status == models.MSEStatus.rejected:
        overall_status = "non_compliant"
    elif checks_passed == 3:
        overall_status = "compliant"
    elif checks_passed > 0:
        overall_status = "partial"
    else:
        overall_status = "non_compliant"

    return {
        "overall_status": overall_status,
        "registration": registration,
        "documents": documents,
        "claims": claims_out,
    }

@router.get("/snp-trend/{snp_id}", dependencies=[Depends(auth.RoleChecker(["snp"]))])
def get_snp_trend(snp_id: int, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    snp = db.query(models.SNP).filter(models.SNP.snp_id == snp_id).first()
    if not snp:
        raise HTTPException(status_code=404, detail="SNP not found")
    if snp.email != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized to view trend for this SNP")

    base_date = datetime.utcnow().date()
    days = []
    for i in range(6, -1, -1):
        target_date = base_date - timedelta(days=i)
        day_start = datetime.combine(target_date, datetime.min.time())
        day_end = datetime.combine(target_date, datetime.max.time())
        daily_txs = db.query(models.Transaction).filter(
            models.Transaction.snp_id == snp_id,
            models.Transaction.transaction_date >= day_start,
            models.Transaction.transaction_date <= day_end,
        ).all()
        days.append({
            "date": target_date.strftime("%Y-%m-%d"),
            "volume": sum(tx.amount or 0 for tx in daily_txs),
            "count": len(daily_txs),
        })
    return days

@router.get("/snp-performance/{snp_id}", dependencies=[Depends(auth.RoleChecker(["snp"]))])
def get_snp_performance(snp_id: int, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    snp = db.query(models.SNP).filter(models.SNP.snp_id == snp_id).first()
    if not snp:
        raise HTTPException(status_code=404, detail="SNP not found")

    # Aggregate performance for specific SNP
    transactions = db.query(models.Transaction).filter(models.Transaction.snp_id == snp_id).all()
    total_volume = sum([(t.amount or 0) for t in transactions])

    # Count only MSEs that have an active partnership with this SNP
    mses_onboarded = db.query(models.Partnership).filter(
        models.Partnership.snp_id == snp_id,
        models.Partnership.status == models.PartnershipStatus.active
    ).count()

    now = datetime.utcnow()
    current_window_start = now - timedelta(days=7)
    previous_window_start = now - timedelta(days=14)

    current_7d_volume = sum([
        (t.amount or 0) for t in transactions
        if t.transaction_date and current_window_start <= t.transaction_date < now
    ])
    previous_7d_volume = sum([
        (t.amount or 0) for t in transactions
        if t.transaction_date and previous_window_start <= t.transaction_date < current_window_start
    ])

    if previous_7d_volume > 0:
        growth_pct = ((current_7d_volume - previous_7d_volume) / previous_7d_volume) * 100
    elif current_7d_volume > 0:
        growth_pct = 100.0
    else:
        growth_pct = 0.0
    growth_rate = f"{growth_pct:+.1f}%"

    total_txs = len(transactions)
    completed_or_verified_txs = sum([
        1 for t in transactions
        if t.status in (models.TransactionStatus.completed, models.TransactionStatus.verified)
    ])

    if total_txs > 0:
        fulfillment_value = (completed_or_verified_txs / total_txs) * 100
    else:
        fulfillment_value = (snp.fulfillment_reliability or 0) * 100
    fulfillment_index = f"{fulfillment_value:.1f}%"

    verified_txs = [
        t for t in transactions
        if t.status == models.TransactionStatus.verified
        and t.transaction_date
        and t.updated_at
        and t.updated_at >= t.transaction_date
    ]

    def _format_duration(value: float) -> str:
        return f"{value:.1f}".rstrip("0").rstrip(".")

    if verified_txs:
        avg_seconds = sum([
            (t.updated_at - t.transaction_date).total_seconds() for t in verified_txs
        ]) / len(verified_txs)
        avg_hours = avg_seconds / 3600
        if avg_hours < 24:
            settlement_velocity = f"T+{_format_duration(avg_hours)}h"
        else:
            avg_days = avg_hours / 24
            day_label = "Day" if round(avg_days, 1) == 1.0 else "Days"
            settlement_velocity = f"T+{_format_duration(avg_days)} {day_label}"
    else:
        speed = snp.settlement_speed or 0
        if speed >= 0.95:
            settlement_velocity = "T+12h"
        elif speed >= 0.90:
            settlement_velocity = "T+1 Day"
        elif speed >= 0.75:
            settlement_velocity = "T+2 Days"
        else:
            settlement_velocity = "T+3 Days"

    feedback_rows = db.query(models.Partnership.feedback_rating).filter(
        models.Partnership.snp_id == snp_id,
        models.Partnership.feedback_rating.isnot(None)
    ).all()
    feedback_count = len(feedback_rows)
    avg_feedback = (
        sum([(row[0] or 0) for row in feedback_rows]) / feedback_count
        if feedback_count > 0 else 0.0
    )

    capacity = snp.capacity or 0
    current_load = snp.current_load or 0
    capacity_pct = (current_load / capacity * 100) if capacity > 0 else 0

    return {
        "total_volume": total_volume,
        "active_mses": mses_onboarded,
        "growth_rate": growth_rate,
        "fulfillment_index": fulfillment_index,
        "settlement_velocity": settlement_velocity,
        "capacity": capacity,
        "current_load": current_load,
        "capacity_pct": round(capacity_pct, 1),
        "rating": snp.rating,
        "type": snp.type,
        "commission_rate": snp.commission_rate,
        "supported_sectors": snp.supported_sectors,
        "avg_feedback": round(avg_feedback, 2),
        "feedback_count": feedback_count
    }

@router.get("/recent-activity", dependencies=[Depends(auth.RoleChecker(["nsic", "admin"]))])
def get_recent_activity(current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        # Interleave MSEs, Transactions, and Claims
        activities = []
        
        # Recent MSEs
        mses = db.query(models.MSE).order_by(models.MSE.created_at.desc()).limit(3).all()
        for mse in mses:
            activities.append({
                "type": "registration",
                "title": "Business Onboarded",
                "content": f"{mse.name} joined the network.",
                "timestamp": mse.created_at
            })
            
        # Recent Transactions
        txs = db.query(models.Transaction).order_by(models.Transaction.transaction_date.desc()).limit(3).all()
        for tx in txs:
            activities.append({
                "type": "transaction",
                "title": "Sale Recorded",
                "content": f"Transaction of ₹{tx.amount} processed.",
                "timestamp": tx.transaction_date
            })
            
        # Recent Claims
        claims_data = db.query(models.Claim).order_by(models.Claim.created_at.desc()).limit(3).all()
        for claim in claims_data:
            activities.append({
                "type": "claim",
                "title": "Audit Update",
                "content": f"Verification for {claim.claim_type} is {claim.status}.",
                "timestamp": claim.created_at
            })
            
        # Sort by timestamp
        activities.sort(key=lambda x: x["timestamp"] if x["timestamp"] else datetime.min, reverse=True)
        return activities[:5]
    except Exception as e:
        print(f"Error in get_recent_activity: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/national", dependencies=[Depends(auth.RoleChecker(["nsic", "admin"]))])
def get_national_analytics(current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        total_mses = db.query(models.MSE).count()
        approved_mses = db.query(models.MSE).filter(models.MSE.status == "approved").count()
        total_snps = db.query(models.SNP).count()
        total_transactions = db.query(models.Transaction).count()
        total_volume = sum([tx.amount for tx in db.query(models.Transaction).all()]) or 0
        
        # Average AI Match Score
        partnerships = db.query(models.Partnership).all()
        # Defensive normalization to ensure 0-1 range
        raw_avg = sum([p.match_score for p in partnerships]) / len(partnerships) if partnerships else 0
        avg_score = raw_avg if raw_avg <= 1.0 else raw_avg / 100.0
        
        # Sectoral Distribution
        sectors = db.query(models.MSE.sector).all()
        sector_counts = {}
        for (s,) in sectors:
            if s:
                sector_counts[s] = sector_counts.get(s, 0) + 1
        
        return {
            "total_mses": total_mses,
            "approved_mses": approved_mses,
            "total_snps": total_snps,
            "total_transactions": total_transactions,
            "total_volume": total_volume,
            "avg_match_score": round(avg_score * 100, 1),
            "sector_distribution": sector_counts,
            "network_health": "Optimal" if avg_score > 0.7 else "Degraded"
        }
    except Exception as e:
        print(f"Error in get_national_analytics: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
