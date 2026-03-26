export type UserRole = 'mse' | 'snp' | 'nsic' | 'admin';

export type User = {
    id: number;
    email: string;
    role: UserRole;
    is_active: number;
    profile_id?: number;
};

export type MSE = {
    mse_id: number;
    user_id?: number;
    name: string;
    contact_person: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    sector: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
};

export type SNP = {
    snp_id: number;
    user_id?: number;
    name: string;
    type: string;
    contact_person: string;
    email: string;
    phone: string;
    city: string;
    onboarding_fee: number;
    commission_rate: number;
    rating: number;
    supported_sectors: string; // JSON string
    pincode_expertise: string; // JSON string
    capacity: number;
    current_load: number;
    settlement_speed: number;
    fulfillment_reliability: number;
    status: 'active' | 'inactive';
    created_at: string;
};

export type Product = {
    product_id: number;
    mse_id: number;
    product_name: string;
    description: string;
    category_id: number | null;
    attributes: string | null; // JSON string
    price: number;
    unit: string;
    is_active: number;
    created_at: string;
};

export type Category = {
    category_id: number;
    category_name: string;
    parent_category_id: number | null;
    description: string | null;
    sectoral_attributes: string | null; // JSON string
};

export type Transaction = {
    transaction_id: number;
    mse_id: number;
    snp_id: number;
    order_id: string;
    amount: number;
    transaction_date: string;
    updated_at: string;
    status: 'completed' | 'pending' | 'verified' | 'failed';
    mse?: MSE;
    snp?: SNP;
};

export type Partnership = {
    partnership_id: number;
    mse_id: number;
    snp_id: number;
    match_score: number;
    status: 'pending' | 'active' | 'rejected' | 'closed';
    ai_reasoning: string;
    mse_consent: boolean;
    snp_consent: boolean;
    initiated_by?: string;
    initiated_at?: string;
    approved_by?: string;
    approved_at?: string;
    feedback_rating: number | null;
    feedback_text: string | null;
    created_at: string;
    mse?: MSE;
    snp?: SNP;
};

export type MatchingScore = {
    snp_id: number;
    snp_name: string;
    score: number;
    reason: string;
    partnership_status: PartnershipStatus | null;
    partnership_id: number | null;
    mse_consent: boolean;
    snp_consent: boolean;
    initiated_by?: string;
    initiated_at?: string;
    approved_by?: string;
    approved_at?: string;
};

export type Claim = {
    claim_id: number;
    mse_id: number;
    claim_type: string;
    claim_data: string; // JSON
    status: 'pending' | 'verified' | 'rejected';
    comments: string | null;
    verified_by: string | null;
    created_at: string;
};

export type OCRDocument = {
    document_id: number;
    mse_id: number;
    claim_id: number | null;
    document_type: string;
    file_path: string;
    ocr_status: string;
    ocr_text: string | null;
    extracted_data: string | null; // JSON string
    confidence_score: number;
    is_verified: boolean;
    verified_by: string | null;
    verified_at: string | null;
    created_at: string;
};

export type ProductVersion = {
    version_id: number;
    product_id: number;
    version_number: number;
    product_data: string; // JSON
    created_at: string;
};

export type SystemAuditLog = {
    log_id: number;
    user_role: string;
    user_id: number | null;
    action: string;
    details: string;
    ip_address: string;
    timestamp: string;
};

export type SNPPerformanceData = {
    total_volume: number;
    active_mses: number;
    growth_rate: string;
    fulfillment_index: string;
    settlement_velocity: string;
    capacity: number;
    current_load: number;
    capacity_pct: number;
    rating: number;
    type: string;
    commission_rate: number;
    supported_sectors: string;
    avg_feedback: number;
    feedback_count: number;
};

export type SNPTrendDay = {
    date: string;
    volume: number;
    count: number;
};

export type MSEActivity = {
    type: string;
    title: string;
    content: string;
    timestamp: string;
};

export type MSEPerformance = {
    revenue: number;
    orders: number;
    avg_value: number;
    settlement_delay: string;
};

export type MSECompliance = {
    overall_status: 'compliant' | 'partial' | 'non_compliant';
    registration: { status: string; label: string };
    documents: { total: number; verified: number; pending: number; failed: number };
    claims: { total: number; verified: number; pending: number; rejected: number };
};
