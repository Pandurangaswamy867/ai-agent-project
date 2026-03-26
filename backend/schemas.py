from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum
import re

class MSESector(str, Enum):
    handicrafts = "Handicrafts"
    textiles = "Textiles"
    agri = "Agri"
    food_processing = "Food Processing"
    leather = "Leather"
    other = "Other"

class MSEStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class MSEBase(BaseModel):
    name: str = Field(..., max_length=100)
    contact_person: Optional[str] = Field(None, max_length=100)
    email: EmailStr
    phone: str = Field(..., pattern=r"^[6-9]\d{9}$")
    address: str = Field(..., max_length=255)
    city: str = Field(..., max_length=100)
    state: str = Field(..., max_length=100)
    pincode: str = Field(..., pattern=r"^\d{6}$")
    sector: MSESector
    description: str = Field(..., max_length=1000)

class MSESubmit(MSEBase):
    password: str = Field(..., min_length=8)

class MSEUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    contact_person: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, pattern=r"^[6-9]\d{9}$")
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    pincode: Optional[str] = Field(None, pattern=r"^\d{6}$")
    sector: Optional[MSESector] = None
    description: Optional[str] = Field(None, max_length=1000)
    password: Optional[str] = Field(None, min_length=8)

class MSEProfileCreate(BaseModel):
    name: str = Field(..., max_length=100)
    contact_person: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, pattern=r"^[6-9]\d{9}$")
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    pincode: Optional[str] = Field(None, pattern=r"^\d{6}$")
    sector: Optional[MSESector] = None
    description: Optional[str] = Field(None, max_length=1000)

class VoiceParseRequest(BaseModel):
    transcript: Optional[str] = None
    audio_content: Optional[str] = None # Base64 encoded audio
    language: str = "en" # Default to English

class MSEResponse(BaseModel):
    mse_id: int
    user_id: Optional[int] = None
    name: str
    contact_person: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    sector: Optional[MSESector] = None
    description: Optional[str] = None
    status: MSEStatus
    created_at: datetime

    class Config:
        from_attributes = True

class RegistrationResponse(BaseModel):
    mse: MSEResponse
    access_token: str
    token_type: str

class SNPRegistrationResponse(BaseModel):
    snp: "SNPResponse"
    access_token: str
    token_type: str

class TransactionStatus(str, Enum):
    completed = "completed"
    pending = "pending"
    verified = "verified"
    failed = "failed"

class TransactionBase(BaseModel):
    mse_id: int
    snp_id: int
    order_id: str
    amount: float
    status: TransactionStatus = TransactionStatus.pending

class TransactionSubmit(TransactionBase):
    transaction_date: datetime

class TransactionResponse(TransactionBase):
    transaction_id: int
    transaction_date: datetime

    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    category_name: str
    description: Optional[str] = None
    parent_category_id: Optional[int] = None

class CategoryResponse(CategoryBase):
    category_id: int
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    product_name: str = Field(..., max_length=100)
    description: str = Field(..., max_length=1000)
    category_id: Optional[int] = None
    attributes: Optional[str] = None # JSON string
    price: float = Field(..., ge=0)
    unit: str = Field(..., max_length=20)

class ProductSubmit(ProductBase):
    mse_id: int

class ProductResponse(ProductBase):
    product_id: int
    mse_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class CategorySuggestion(BaseModel):
    category_id: int
    category_name: str
    confidence: float
    attributes: Optional[dict] = None

class CategorizeResponse(BaseModel):
    suggestions: List[CategorySuggestion]

class SNPBase(BaseModel):
    name: str = Field(..., max_length=100)
    type: str = Field(..., max_length=50) # Logistics, Seller App, Payments
    contact_person: Optional[str] = Field(None, max_length=100)
    email: EmailStr
    phone: str = Field(..., pattern=r"^[6-9]\d{9}$")
    city: str = Field(..., max_length=100)
    onboarding_fee: float = Field(0.0, ge=0)
    commission_rate: float = Field(0.0, ge=0)
    rating: float = Field(4.0, ge=0, le=5)
    supported_sectors: Optional[str] = None # JSON string
    pincode_expertise: Optional[str] = None # JSON string
    capacity: int = Field(100, gt=0)
    current_load: int = Field(0, ge=0)
    settlement_speed: float = Field(0.95, ge=0, le=1)
    fulfillment_reliability: float = Field(0.98, ge=0, le=1)

class SNPSubmit(SNPBase):
    password: str = Field(..., min_length=8)

class SNPProfileCreate(BaseModel):
    name: str = Field(..., max_length=100)
    type: str = Field(..., max_length=50)
    contact_person: Optional[str] = Field(None, max_length=100)
    phone: str = Field(..., pattern=r"^[6-9]\d{9}$")
    city: str = Field(..., max_length=100)
    onboarding_fee: float = Field(0.0, ge=0)
    commission_rate: float = Field(0.0, ge=0)
    rating: float = Field(4.0, ge=0, le=5)
    supported_sectors: Optional[str] = None
    pincode_expertise: Optional[str] = None
    capacity: int = Field(100, gt=0)
    current_load: int = Field(0, ge=0)
    settlement_speed: float = Field(0.95, ge=0, le=1)
    fulfillment_reliability: float = Field(0.98, ge=0, le=1)

class SNPResponse(SNPBase):
    snp_id: int
    status: str
    class Config:
        from_attributes = True

class MatchingScore(BaseModel):
    snp_id: int
    snp_name: str
    score: float
    reason: str
    partnership_status: Optional[str] = None
    partnership_id: Optional[int] = None
    mse_consent: bool = False
    snp_consent: bool = False

class MatchingResponse(BaseModel):
    matches: List[MatchingScore]

class ClaimStatus(str, Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"

class ClaimBase(BaseModel):
    mse_id: int
    claim_type: str
    claim_data: Optional[str] = None

class ClaimSubmit(ClaimBase):
    pass

class ClaimResponse(ClaimBase):
    claim_id: int
    status: ClaimStatus
    comments: Optional[str] = None
    verified_by: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class OCRDocumentBase(BaseModel):
    mse_id: int
    claim_id: Optional[int] = None
    document_type: str
    file_path: str

class OCRDocumentResponse(OCRDocumentBase):
    document_id: int
    ocr_status: str
    ocr_text: Optional[str] = None
    extracted_data: Optional[str] = None
    confidence_score: float
    is_verified: bool
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True

class PartnershipFeedback(BaseModel):
    rating: float = Field(..., ge=1, le=5)
    feedback_text: Optional[str] = Field(None, max_length=1000)

class ProductVersionResponse(BaseModel):
    version_id: int
    product_id: int
    version_number: int
    product_data: str
    created_at: datetime
    class Config:
        from_attributes = True

class TransactionAuditTrail(BaseModel):
    log_id: int
    action: str
    details: str
    timestamp: datetime
    class Config:
        from_attributes = True

class OCRManualVerify(BaseModel):
    extracted_data: str # Updated JSON
    verified_by: str

class ProductCreate(ProductBase):
    pass

class TransactionConflictBase(BaseModel):
    transaction_id: int
    conflict_type: str
    description: str
    status: str = "active"

class NotificationPreferenceBase(BaseModel):
    email_enabled: bool = True
    sms_enabled: bool = False
    in_app_enabled: bool = True
    marketing_enabled: bool = False

class NotificationPreferenceResponse(NotificationPreferenceBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class TransactionConflictResponse(TransactionConflictBase):
    conflict_id: int
    created_at: datetime
    class Config:
        from_attributes = True
class PartnershipStatus(str, Enum):
    pending = "pending"
    active = "active"
    rejected = "rejected"
    closed = "closed"

class PartnershipResponse(BaseModel):
    partnership_id: int
    mse_id: int
    snp_id: int
    match_score: float
    status: PartnershipStatus
    ai_reasoning: Optional[str] = None
    mse_consent: bool = False
    snp_consent: bool = False
    initiated_by: Optional[str] = None
    initiated_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    mse: Optional[MSEResponse] = None
    snp: Optional[SNPResponse] = None

    class Config:
        from_attributes = True
class NotificationResponse(BaseModel):
    notification_id: int
    user_role: str
    user_id: Optional[int] = None
    title: str
    message: str
    type: Optional[str] = None
    is_read: int
    created_at: datetime

    class Config:
        from_attributes = True

class SystemAuditLogBase(BaseModel):
    user_role: str
    user_id: Optional[int] = None
    action: str
    details: str
    ip_address: str

class SystemAuditLogSubmit(SystemAuditLogBase):
    pass

class SystemAuditLogResponse(SystemAuditLogBase):
    log_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    is_active: int

    class Config:
        from_attributes = True

class UserRegisterRequest(BaseModel):
    email: str
    password: str
    role: str  # "mse" or "snp"

class OTPRequest(BaseModel):
    email: str

class LoginRequest(BaseModel):
    email: str # Allow 'admin' or 'nsic' usernames as well as emails
    password: Optional[str] = None
    otp_code: Optional[str] = None
