from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
import models, schemas, auth
from database import get_db, SessionLocal
import json
import os
import datetime
from ocr_utils import extract_fields

router = APIRouter()

def process_ocr_task(document_id: int):
    """
    Background worker for asynchronous OCR document processing.
    Uses Hugging Face LayoutLM for extraction.
    """
    db = SessionLocal()
    try:
        db_doc = db.query(models.OCRDocument).filter(models.OCRDocument.document_id == document_id).first()
        if not db_doc:
            return

        # Perform extraction using Hugging Face
        # Note: image_path is db_doc.file_path, which is relative to the backend root
        extracted_data, confidence = extract_fields(db_doc.file_path, db_doc.document_type)

        db_doc.ocr_text = f"Hugging Face Extraction @ {datetime.datetime.now()}"
        db_doc.extracted_data = json.dumps(extracted_data)
        db_doc.ocr_status = "completed"
        db_doc.confidence_score = confidence
        db.commit()
    except Exception as e:
        print(f"Async OCR Error: {e}")
        try:
            db_doc = db.query(models.OCRDocument).filter(models.OCRDocument.document_id == document_id).first()
            if db_doc:
                db_doc.ocr_status = "failed"
                db.commit()
        except:
            pass
    finally:
        db.close()

import uuid

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf"}
ALLOWED_MIME_TYPES = {"image/png", "image/jpeg", "application/pdf"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@router.post("/upload", response_model=schemas.OCRDocumentResponse, dependencies=[Depends(auth.RoleChecker(["mse", "admin"]))])
async def upload_document(
    background_tasks: BackgroundTasks,
    mse_id: int = Form(...),
    claim_id: Optional[int] = Form(None),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # RBAC: MSEs can only upload for themselves
    # Use profile_id from token if available, fallback to id (which was used previously)
    user_profile_id = current_user.get("profile_id") or current_user.get("id")
    if current_user["role"] == "mse" and user_profile_id != mse_id:
        raise HTTPException(status_code=403, detail="Not authorized to upload documents for another MSE")

    # MIME type validation
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PNG, JPG, and PDF are allowed.")

    # Extension validation
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file extension.")

    # File size validation (read content to check size)
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

    # Ensure uploads directory exists
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
        
    # Generate unique sanitized filename to prevent path traversal and collisions
    safe_filename = f"{uuid.uuid4()}_{os.path.basename(file.filename)}"
    file_path = os.path.join("uploads", safe_filename)
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(content)
    
    db_doc = models.OCRDocument(
        mse_id=mse_id,
        claim_id=claim_id,
        document_type=document_type,
        file_path=file_path,
        ocr_status="processing",
        ocr_text=None,
        extracted_data=None,
        confidence_score=0.0
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    background_tasks.add_task(process_ocr_task, db_doc.document_id)
    return db_doc

from fastapi.responses import FileResponse

@router.get("/view/{document_id}", dependencies=[Depends(auth.RoleChecker(["mse", "nsic", "admin"]))])
def view_document(
    document_id: int,
    current_user: dict = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Securely serve uploaded documents with access control.
    """
    db_doc = db.query(models.OCRDocument).filter(models.OCRDocument.document_id == document_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # RBAC: MSEs can only view their own documents
    if current_user["role"] == "mse" and current_user["id"] != db_doc.mse_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this document")
    
    if not os.path.exists(db_doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
        
    return FileResponse(db_doc.file_path)

@router.get("/{document_id}/ocr-data", response_model=schemas.OCRDocumentResponse, dependencies=[Depends(auth.RoleChecker(["mse", "nsic", "admin"]))])
def get_ocr_data(document_id: int, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_doc = db.query(models.OCRDocument).filter(models.OCRDocument.document_id == document_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return db_doc

@router.post("/{document_id}/verify", response_model=schemas.OCRDocumentResponse, dependencies=[Depends(auth.RoleChecker(["nsic", "admin"]))])
def manual_verify_ocr(
    document_id: int, 
    verification: schemas.OCRManualVerify,
    current_user: dict = Depends(auth.get_current_user), 
    db: Session = Depends(get_db)
):
    """
    OCR-05: Manual review pipeline for low-confidence or high-risk documents.
    """
    db_doc = db.query(models.OCRDocument).filter(models.OCRDocument.document_id == document_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db_doc.extracted_data = verification.extracted_data
    db_doc.is_verified = True
    db_doc.verified_by = verification.verified_by
    db_doc.verified_at = datetime.datetime.utcnow()
    db_doc.confidence_score = 1.0 # Authority bit
    
    db.commit()
    db.refresh(db_doc)
    return db_doc

@router.post("/{document_id}/re-ocr", response_model=schemas.OCRDocumentResponse, dependencies=[Depends(auth.RoleChecker(["mse", "nsic", "admin"]))])
def re_process_ocr(
    document_id: int,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Re-trigger OCR processing for a failed or low-confidence document.
    """
    db_doc = db.query(models.OCRDocument).filter(models.OCRDocument.document_id == document_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Ownership check
    if current_user["role"] == "mse" and current_user["id"] != db_doc.mse_id:
        raise HTTPException(status_code=403, detail="Not authorized to re-process this document")

    db_doc.ocr_status = "processing"
    db.commit()
    
    background_tasks.add_task(process_ocr_task, db_doc.document_id)
    return db_doc

@router.get("/", response_model=List[schemas.OCRDocumentResponse], dependencies=[Depends(auth.RoleChecker(["nsic", "admin", "mse"]))])
def list_documents(
    mse_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    List and filter documents.
    """
    query = db.query(models.OCRDocument)
    
    if current_user["role"] == "mse":
        # MSE can only see their own documents
        user_profile_id = current_user.get("profile_id") or current_user.get("id")
        query = query.filter(models.OCRDocument.mse_id == user_profile_id)
        if mse_id and mse_id != user_profile_id:
            raise HTTPException(status_code=403, detail="Not authorized to filter by this MSE ID")
    elif mse_id:
        query = query.filter(models.OCRDocument.mse_id == mse_id)
        
    if status:
        query = query.filter(models.OCRDocument.ocr_status == status)
        
    return query.all()

@router.get("/mse/{mse_id}/latest", response_model=schemas.OCRDocumentResponse, dependencies=[Depends(auth.RoleChecker(["mse", "nsic", "admin"]))])
def get_latest_mse_document(mse_id: int, current_user: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_doc = db.query(models.OCRDocument).filter(models.OCRDocument.mse_id == mse_id).order_by(models.OCRDocument.created_at.desc()).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="No verification documents found for this MSE")
    return db_doc
