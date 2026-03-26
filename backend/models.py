from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
import enum
import datetime
from database import Base

class MSEStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class MSE(Base):
    __tablename__ = "mse"

    mse_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(100), index=True, nullable=False)
    contact_person = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(15), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)
    sector = Column(String(100), nullable=False)
    description = Column(String(1000))
    status = Column(Enum(MSEStatus), default=MSEStatus.pending, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="mse_profile")
    products = relationship("Product", back_populates="mse", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="mse", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="mse", cascade="all, delete-orphan")
    ocr_documents = relationship("OCRDocument", back_populates="mse", cascade="all, delete-orphan")
    partnerships = relationship("Partnership", back_populates="mse", cascade="all, delete-orphan")

class SNPStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"

class SNP(Base):
    __tablename__ = "snp"

    snp_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(100), index=True, nullable=False)
    type = Column(String(100), nullable=False) # Logistics, Seller App, Payments
    contact_person = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(15), nullable=False)
    city = Column(String(100), nullable=False)
    onboarding_fee = Column(Float, default=0.0, nullable=False)
    commission_rate = Column(Float, default=0.0, nullable=False)
    rating = Column(Float, default=4.0, nullable=False)
    supported_sectors = Column(String, nullable=False) # JSON
    pincode_expertise = Column(String, nullable=False) # JSON
    capacity = Column(Integer, default=100, nullable=False)
    current_load = Column(Integer, default=0, nullable=False) # Available = Capacity - Current Load
    settlement_speed = Column(Float, default=0.95, nullable=False) # 0.0 to 1.0 (Higher is faster)
    fulfillment_reliability = Column(Float, default=0.98, nullable=False) # 0.0 to 1.0 (Higher is more reliable)
    status = Column(Enum(SNPStatus), default=SNPStatus.active, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="snp_profile")
    transactions = relationship("Transaction", back_populates="snp", cascade="all, delete-orphan")
    partnerships = relationship("Partnership", back_populates="snp", cascade="all, delete-orphan")

class TransactionStatus(str, enum.Enum):
    completed = "completed"
    pending = "pending"
    verified = "verified"
    failed = "failed"

class Transaction(Base):
    __tablename__ = "transaction"

    transaction_id = Column(Integer, primary_key=True, index=True)
    mse_id = Column(Integer, ForeignKey("mse.mse_id", ondelete="CASCADE"))
    snp_id = Column(Integer, ForeignKey("snp.snp_id", ondelete="CASCADE"))
    order_id = Column(String, index=True)
    amount = Column(Float)
    transaction_date = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.pending)

    mse = relationship("MSE", back_populates="transactions")
    snp = relationship("SNP", back_populates="transactions")

class Category(Base):
    __tablename__ = "product_category"

    category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String, nullable=False)
    parent_category_id = Column(Integer, ForeignKey("product_category.category_id"), nullable=True)
    description = Column(String)
    sectoral_attributes = Column(String) # JSON

    parent = relationship("Category", remote_side=[category_id])

class Product(Base):
    __tablename__ = "mse_product"

    product_id = Column(Integer, primary_key=True, index=True)
    mse_id = Column(Integer, ForeignKey("mse.mse_id", ondelete="CASCADE"), nullable=False)
    product_name = Column(String(100), nullable=False)
    description = Column(String(1000))
    category_id = Column(Integer, ForeignKey("product_category.category_id"), nullable=True)
    attributes = Column(String) # JSON
    price = Column(Float)
    unit = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    mse = relationship("MSE", back_populates="products")
    category = relationship("Category")
    versions = relationship("ProductVersion", back_populates="product", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint('mse_id', 'product_name', name='_mse_product_uc'),)

class ProductVersion(Base):
    __tablename__ = "product_version"

    version_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("mse_product.product_id", ondelete="CASCADE"))
    version_number = Column(Integer)
    product_data = Column(String) # JSON containing previous snapshot
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    product = relationship("Product", back_populates="versions")

class ClaimStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"

class Claim(Base):
    __tablename__ = "claim"

    claim_id = Column(Integer, primary_key=True, index=True)
    mse_id = Column(Integer, ForeignKey("mse.mse_id", ondelete="CASCADE"))
    claim_type = Column(String) # registration, product, subsidy
    claim_data = Column(String) # JSON
    status = Column(Enum(ClaimStatus), default=ClaimStatus.pending)
    comments = Column(String)
    verified_by = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    mse = relationship("MSE", back_populates="claims")
    documents = relationship("OCRDocument", back_populates="claim", cascade="all, delete-orphan")

class OCRDocument(Base):
    __tablename__ = "ocr_document"

    document_id = Column(Integer, primary_key=True, index=True)
    mse_id = Column(Integer, ForeignKey("mse.mse_id", ondelete="CASCADE"))
    claim_id = Column(Integer, ForeignKey("claim.claim_id", ondelete="SET NULL"), nullable=True)
    document_type = Column(String) # aadhar, pan, udyam
    file_path = Column(String)
    ocr_status = Column(String) # processing, completed, failed
    ocr_text = Column(String)
    extracted_data = Column(String) # JSON
    confidence_score = Column(Float, default=1.0) # OCR-05
    is_verified = Column(Boolean, default=False)
    verified_by = Column(String, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    mse = relationship("MSE", back_populates="ocr_documents")
    claim = relationship("Claim", back_populates="documents")

class TransactionConflict(Base):
    __tablename__ = "transaction_conflict"

    conflict_id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transaction.transaction_id", ondelete="CASCADE"))
    conflict_type = Column(String) # amount_mismatch, duplicate, unauthorized
    description = Column(String)
    status = Column(String, default="resolved") # active, resolved
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    transaction = relationship("Transaction", backref="conflicts")

class PartnershipStatus(str, enum.Enum):
    pending = "pending"
    active = "active"
    rejected = "rejected"
    closed = "closed"

class Partnership(Base):
    __tablename__ = "partnership"

    partnership_id = Column(Integer, primary_key=True, index=True)
    mse_id = Column(Integer, ForeignKey("mse.mse_id", ondelete="CASCADE"))
    snp_id = Column(Integer, ForeignKey("snp.snp_id", ondelete="CASCADE"))
    match_score = Column(Float)
    status = Column(Enum(PartnershipStatus), default=PartnershipStatus.pending)
    ai_reasoning = Column(String)
    mse_consent = Column(Boolean, default=False)
    snp_consent = Column(Boolean, default=False)
    
    # Audit Trail for Proof of Partnership
    initiated_by = Column(String) # 'mse' or 'snp'
    initiated_at = Column(DateTime, default=datetime.datetime.utcnow)
    approved_by = Column(String, nullable=True) # 'mse' or 'snp' or 'admin'
    approved_at = Column(DateTime, nullable=True)
    
    feedback_rating = Column(Float, nullable=True)
    feedback_text = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    mse = relationship("MSE", back_populates="partnerships")
    snp = relationship("SNP", back_populates="partnerships")

class Notification(Base):
    __tablename__ = "notification"

    notification_id = Column(Integer, primary_key=True, index=True)
    user_role = Column(String) # mse, snp, nsic
    user_id = Column(Integer, nullable=True) # mse_id or snp_id
    title = Column(String)
    message = Column(String)
    type = Column(String) # info, success, warning, error
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SystemAuditLog(Base):
    __tablename__ = "system_audit_log"

    log_id = Column(Integer, primary_key=True, index=True)
    user_role = Column(String)
    user_id = Column(Integer, nullable=True)
    action = Column(String)
    details = Column(String)
    ip_address = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False) # mse, snp, nsic
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    mse_profile = relationship("MSE", back_populates="user", uselist=False, cascade="all, delete-orphan")
    snp_profile = relationship("SNP", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notification_preferences = relationship("NotificationPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")

class OTPVerification(Base):
    __tablename__ = "otp_verification"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), index=True)
    otp_code = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime)

class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    email_enabled = Column(Boolean, default=True)
    sms_enabled = Column(Boolean, default=False)
    in_app_enabled = Column(Boolean, default=True)
    marketing_enabled = Column(Boolean, default=False)

    user = relationship("User", back_populates="notification_preferences")
