from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, EmailStr, field_validator

# --- Common Helper ---
def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    res = dict(doc)
    if "_id" in res:
        res["id"] = str(res["_id"])
        del res["_id"]
    return res

# --- User & Auth Schemas ---
class UserBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    language: str = "en"

class UserRegister(UserBase):
    password: str

class UserLogin(BaseModel):
    identifier: str  # email or phone
    password: str

class UserOut(UserBase):
    id: str
    role: str = "user"
    onboarding_complete: bool = False
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# --- Profile Schemas ---
class ExistingLoan(BaseModel):
    lender: str = "Bank"
    outstanding: float = 0.0
    monthly_emi: float = 0.0
    remaining_months: int = 12

    @field_validator("outstanding", "monthly_emi", mode="before")
    @classmethod
    def parse_loan_float(cls, v):
        if v == "" or v is None:
            return 0.0
        try:
            return float(v)
        except (ValueError, TypeError):
            return 0.0

    @field_validator("remaining_months", mode="before")
    @classmethod
    def parse_loan_int(cls, v):
        if v == "" or v is None:
            return 12
        try:
            return int(v)
        except (ValueError, TypeError):
            return 12

class BusinessProfile(BaseModel):
    type: str = "dairy"  # "dairy"|"tailoring"|"retail"|"agri"|"food_processing"|"handicraft"|"other"
    stage: str = "idea"  # "idea"|"new"|"running"
    is_new_business: bool = True
    is_micro_enterprise: bool = True
    required_amount: float = 0.0
    own_contribution: float = 0.0
    expected_monthly_revenue: float = 0.0
    expected_monthly_cost: float = 0.0

    @field_validator("required_amount", "own_contribution", "expected_monthly_revenue", "expected_monthly_cost", mode="before")
    @classmethod
    def parse_biz_float(cls, v):
        if v == "" or v is None:
            return 0.0
        try:
            return float(v)
        except (ValueError, TypeError):
            return 0.0

class ProfileModel(BaseModel):
    user_id: Optional[str] = None
    age: int = 25
    gender: str = "female"
    state: str = ""
    district: str = ""
    area: str = "rural"  # "rural"|"semi_urban"|"urban"
    social_category: str = "general"  # "general"|"obc"|"sc"|"st"|"minority"
    education_level: str = "secondary"
    marital_status: str = "married"
    dependents: int = 0
    is_shg_member: bool = False
    shg_name: Optional[str] = None
    shg_tenure_months: int = 0
    has_bank_account: bool = True
    has_aadhaar: bool = True
    has_pan: bool = False
    has_land_or_assets: bool = False
    asset_value: float = 0.0
    monthly_income: float = 0.0
    income_stability: str = "regular"  # "regular"|"seasonal"|"irregular"
    monthly_household_expense: float = 0.0
    monthly_other_expense: float = 0.0
    existing_loans: List[ExistingLoan] = []
    has_default_history: bool = False
    credit_score: Optional[int] = None
    business: BusinessProfile = Field(default_factory=BusinessProfile)
    updated_at: Optional[datetime] = None

    @field_validator("credit_score", mode="before")
    @classmethod
    def parse_credit_score(cls, v):
        if v == "" or v is None:
            return None
        try:
            return int(v)
        except (ValueError, TypeError):
            return None

    @field_validator("age", "dependents", "shg_tenure_months", mode="before")
    @classmethod
    def parse_int_fields(cls, v):
        if v == "" or v is None:
            return 0
        try:
            return int(v)
        except (ValueError, TypeError):
            return 0

    @field_validator("monthly_income", "monthly_household_expense", "monthly_other_expense", "asset_value", mode="before")
    @classmethod
    def parse_float_fields(cls, v):
        if v == "" or v is None:
            return 0.0
        try:
            return float(v)
        except (ValueError, TypeError):
            return 0.0

    @field_validator("shg_name", mode="before")
    @classmethod
    def parse_shg_name(cls, v):
        if v == "" or v is None:
            return None
        return str(v).strip()

# --- Scheme Schemas ---
class SchemeEligibilityRules(BaseModel):
    genders: List[str] = ["female"]
    min_age: Optional[int] = 18
    max_age: Optional[int] = 65
    categories: List[str] = ["general", "obc", "sc", "st", "minority"]
    areas: List[str] = ["rural", "semi_urban", "urban"]
    requires_shg_membership: bool = False
    min_shg_tenure_months: int = 0
    requires_bank_account: bool = True
    requires_aadhaar: bool = True
    allows_existing_default: bool = False
    new_business_allowed: bool = True
    existing_business_required: bool = False
    min_credit_score: Optional[int] = None
    max_annual_income: Optional[float] = None

class SchemeModel(BaseModel):
    id: Optional[str] = None
    name: str
    short_name: str
    provider: str
    level: str = "central"  # "central"|"state"|"bank"|"ngo"
    applicable_states: List[str] = ["ALL"]
    purpose: List[str] = ["business", "dairy"]
    description: str
    loan_min: float
    loan_max: float
    interest_rate_min: float
    interest_rate_max: Optional[float] = None
    interest_subvention: Optional[str] = None
    collateral_required: bool = False
    tenure_months_min: int = 12
    tenure_months_max: int = 60
    processing_fee_note: Optional[str] = None
    eligibility: SchemeEligibilityRules
    documents_required: List[str] = []
    how_to_apply: str
    source_url: str
    last_verified: Optional[datetime] = None
    is_active: bool = True

# --- Budget Schemas ---
class ExpenseItem(BaseModel):
    category: str = "General"
    amount: float = 0.0

    @field_validator("amount", mode="before")
    @classmethod
    def parse_exp_amount(cls, v):
        if v == "" or v is None:
            return 0.0
        try:
            return float(v)
        except (ValueError, TypeError):
            return 0.0

class BudgetModel(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    month: str  # YYYY-MM
    income: float = 0.0
    expenses: List[ExpenseItem] = []
    suggested_savings: float = 0.0
    created_at: Optional[datetime] = None

    @field_validator("income", "suggested_savings", mode="before")
    @classmethod
    def parse_budget_amounts(cls, v):
        if v == "" or v is None:
            return 0.0
        try:
            return float(v)
        except (ValueError, TypeError):
            return 0.0

class BudgetCalculateRequest(BaseModel):
    income: float = 0.0
    expenses: List[ExpenseItem] = []

    @field_validator("income", mode="before")
    @classmethod
    def parse_calc_income(cls, v):
        if v == "" or v is None:
            return 0.0
        try:
            return float(v)
        except (ValueError, TypeError):
            return 0.0

# --- Goal Schemas ---
class GoalModel(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    name: str
    target_amount: float
    saved_amount: float = 0.0
    monthly_contribution: float = 0.0
    deadline: Optional[str] = None  # YYYY-MM-DD
    status: str = "active"  # "active"|"completed"
    created_at: Optional[datetime] = None

class GoalCreate(BaseModel):
    name: str
    target_amount: float
    monthly_contribution: float = 0.0
    deadline: Optional[str] = None

    @field_validator("target_amount", "monthly_contribution", mode="before")
    @classmethod
    def parse_goal_create(cls, v):
        if v == "" or v is None:
            return 0.0
        try:
            return float(v)
        except (ValueError, TypeError):
            return 0.0

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    monthly_contribution: Optional[float] = None
    saved_amount: Optional[float] = None
    deadline: Optional[str] = None
    status: Optional[str] = None

    @field_validator("target_amount", "monthly_contribution", "saved_amount", mode="before")
    @classmethod
    def parse_goal_update(cls, v):
        if v == "" or v is None:
            return None
        try:
            return float(v)
        except (ValueError, TypeError):
            return None

# --- Transaction Schemas ---
class TransactionInitiateRequest(BaseModel):
    goal_id: Optional[str] = None
    amount: float
    type: str = "SAVINGS_TRANSFER"  # "SAVINGS_TRANSFER"|"INVESTMENT_TRANSFER"
    destination: str = "Demo Goal Wallet"
    idempotency_key: str
    simulate_failure: bool = False

    @field_validator("amount", mode="before")
    @classmethod
    def parse_txn_amount(cls, v):
        if v == "" or v is None:
            return 0.0
        try:
            return float(v)
        except (ValueError, TypeError):
            return 0.0

class TransactionModel(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    goal_id: Optional[str] = None
    type: str = "SAVINGS_TRANSFER"
    amount: float
    destination: str
    status: str = "INITIATED"  # "INITIATED"|"PENDING"|"SUCCESS"|"FAILED"
    provider_ref: Optional[str] = None
    idempotency_key: str
    failure_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None

# --- Eligibility & Repayment Schemas ---
class EligibilityCheckRequest(BaseModel):
    scheme_id: Optional[str] = None
    requested_amount: float
    tenure_months: int

class RepaymentResult(BaseModel):
    verdict: str  # "COMFORTABLE"|"TIGHT"|"RISKY"|"NOT_AFFORDABLE"
    ratio: float
    emi: float
    safe_max_emi: float
    safe_max_loan: float
    disposable_income: float
    business_net: float
    available_for_emi: float
    suggestions: List[str] = []

class AIExplanation(BaseModel):
    summary: str
    why: List[str] = []
    next_steps: List[str] = []
    warning: Optional[str] = None

class SchemeEligibilityItem(BaseModel):
    scheme_id: str
    scheme_name: str
    short_name: str
    provider: str
    verdict: str  # "ELIGIBLE"|"MAYBE"|"NOT_ELIGIBLE"
    matched_rules: List[str] = []
    failed_rules: List[str] = []
    missing_info: List[str] = []
    suggested_amount: Optional[float] = None
    interest_rate_used: float
    emi: float
    repayment: RepaymentResult
    ai_explanation: Optional[AIExplanation] = None

class EligibilityCheckResponse(BaseModel):
    results: List[SchemeEligibilityItem]

# --- Advisor Schemas ---
class ChatMessageModel(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    role: str  # "user"|"assistant"
    content: str
    created_at: Optional[datetime] = None

class AdvisorChatRequest(BaseModel):
    message: str

class LearnExplainRequest(BaseModel):
    topic: str
