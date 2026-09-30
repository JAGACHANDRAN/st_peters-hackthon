import asyncio
from datetime import datetime, timezone
from app.core.config import settings
from app.core.db import connect_to_mongo, get_database, close_mongo_connection
from app.core.security import get_password_hash

async def seed_database():
    print("Connecting to database for seeding...")
    await connect_to_mongo()
    db = get_database()
    now = datetime.now(timezone.utc)

    # 1. Seed Admin User
    admin_email = "admin@finance.gov.in"
    await db.users.delete_many({"email": admin_email})
    admin_user = {
        "name": "System Administrator",
        "email": admin_email,
        "phone": "9999999999",
        "password_hash": get_password_hash("Admin@123"),
        "role": "admin",
        "language": "en",
        "onboarding_complete": True,
        "created_at": now
    }
    await db.users.insert_one(admin_user)
    print("Seeded admin user: admin@finance.gov.in (Admin@123)")

    # 2. Seed Lakshmi Demo User
    lakshmi_email = "lakshmi@example.com"
    lakshmi_phone = "9876543210"
    await db.users.delete_many({"email": lakshmi_email})
    await db.users.delete_many({"phone": lakshmi_phone})
    
    lakshmi_user = {
        "name": "Lakshmi Devi",
        "email": lakshmi_email,
        "phone": lakshmi_phone,
        "password_hash": get_password_hash("Lakshmi@123"),
        "role": "user",
        "language": "en",
        "onboarding_complete": True,
        "created_at": now
    }
    lakshmi_res = await db.users.insert_one(lakshmi_user)
    lakshmi_id = str(lakshmi_res.inserted_id)
    print(f"Seeded demo user Lakshmi: {lakshmi_email} (Lakshmi@123), ID: {lakshmi_id}")

    # Seed Lakshmi's Profile
    await db.profiles.delete_many({"user_id": lakshmi_id})
    lakshmi_profile = {
        "user_id": lakshmi_id,
        "age": 32,
        "gender": "female",
        "state": "Odisha",
        "district": "Puri",
        "area": "rural",
        "social_category": "obc",
        "education_level": "secondary",
        "marital_status": "married",
        "dependents": 2,
        "is_shg_member": True,
        "shg_name": "Maa Tarini SHG",
        "shg_tenure_months": 18,
        "has_bank_account": True,
        "has_aadhaar": True,
        "has_pan": False,
        "has_land_or_assets": True,
        "asset_value": 25000.0,
        "monthly_income": 8000.0,
        "income_stability": "regular",
        "monthly_household_expense": 5000.0,
        "monthly_other_expense": 1000.0,
        "existing_loans": [],
        "has_default_history": False,
        "credit_score": 680,
        "business": {
            "type": "dairy",
            "stage": "idea",
            "is_new_business": True,
            "is_micro_enterprise": True,
            "required_amount": 50000.0,
            "own_contribution": 10000.0,
            "expected_monthly_revenue": 5000.0,
            "expected_monthly_cost": 2000.0
        },
        "updated_at": now
    }
    await db.profiles.insert_one(lakshmi_profile)

    # Seed Lakshmi's Goal
    await db.goals.delete_many({"user_id": lakshmi_id})
    lakshmi_goal = {
        "user_id": lakshmi_id,
        "name": "Dairy Buffalo & Shed Fund",
        "target_amount": 20000.0,
        "saved_amount": 4500.0,
        "monthly_contribution": 1500.0,
        "deadline": "2026-12-31",
        "status": "active",
        "created_at": now
    }
    g_res = await db.goals.insert_one(lakshmi_goal)

    # Seed Lakshmi's Budget
    await db.budgets.delete_many({"user_id": lakshmi_id})
    lakshmi_budget = {
        "user_id": lakshmi_id,
        "month": "2026-09",
        "income": 8000.0,
        "expenses": [
            {"category": "Food & Groceries", "amount": 3500.0},
            {"category": "Children Schooling", "amount": 1500.0},
            {"category": "Household Utilities & Health", "amount": 1000.0}
        ],
        "suggested_savings": 400.0,
        "created_at": now
    }
    await db.budgets.insert_one(lakshmi_budget)

    # 3. Seed Schemes (6 schemes with last_verified: null and TODO_VERIFY notes)
    await db.schemes.delete_many({})
    schemes = [
        {
            "name": "Pradhan Mantri MUDRA Yojana (Shishu & Kishor)",
            "short_name": "PM MUDRA",
            "provider": "Ministry of Finance, Govt of India",
            "level": "central",
            "applicable_states": ["ALL"],
            "purpose": ["business", "dairy", "retail", "tailoring", "agri"],
            "description": "Collateral-free micro loans up to Rs 5 Lakhs for non-corporate micro enterprises. [TODO_VERIFY: Confirm latest Kishor interest rate cap and CGTMSE guarantee fee with national portal]",
            "loan_min": 10000.0,
            "loan_max": 500000.0,
            "interest_rate_min": 8.5,
            "interest_rate_max": 11.5,
            "interest_subvention": "Interest rate subsidy under special state schemes may apply. [TODO_VERIFY]",
            "collateral_required": False,
            "tenure_months_min": 12,
            "tenure_months_max": 60,
            "processing_fee_note": "Zero processing fee for Shishu loans up to Rs 50,000. [TODO_VERIFY]",
            "eligibility": {
                "genders": ["female", "male", "other"],
                "min_age": 18,
                "max_age": 65,
                "categories": ["general", "obc", "sc", "st", "minority"],
                "areas": ["rural", "semi_urban", "urban"],
                "requires_shg_membership": False,
                "min_shg_tenure_months": 0,
                "requires_bank_account": True,
                "requires_aadhaar": True,
                "allows_existing_default": False,
                "new_business_allowed": True,
                "existing_business_required": False,
                "min_credit_score": None,
                "max_annual_income": None
            },
            "documents_required": [
                "Aadhaar Card",
                "Bank Passbook (6 months)",
                "Proof of Business Address",
                "Passport size photo"
            ],
            "how_to_apply": "Apply through any scheduled commercial bank, RRB, MFI, or via the Udyamimitra portal.",
            "source_url": "https://www.mudra.org.in/",
            "last_verified": None,
            "is_active": True
        },
        {
            "name": "Stand-Up India Scheme for Women Entrepreneurs",
            "short_name": "Stand-Up India",
            "provider": "SIDBI / Ministry of Finance",
            "level": "central",
            "applicable_states": ["ALL"],
            "purpose": ["business", "dairy", "retail", "food_processing", "manufacturing"],
            "description": "Facilitates bank loans between Rs 10 Lakhs and Rs 1 Crore to at least one woman or SC/ST borrower per bank branch for setting up greenfield enterprises. [TODO_VERIFY: Verify margin money subsidy changes]",
            "loan_min": 1000000.0,
            "loan_max": 10000000.0,
            "interest_rate_min": 7.5,
            "interest_rate_max": 9.5,
            "interest_subvention": "Low interest rate linked to MCLR + 3%. [TODO_VERIFY]",
            "collateral_required": False,
            "tenure_months_min": 36,
            "tenure_months_max": 84,
            "processing_fee_note": "Nominal bank processing fee. [TODO_VERIFY]",
            "eligibility": {
                "genders": ["female"],
                "min_age": 18,
                "max_age": 65,
                "categories": ["general", "obc", "sc", "st", "minority"],
                "areas": ["rural", "semi_urban", "urban"],
                "requires_shg_membership": False,
                "min_shg_tenure_months": 0,
                "requires_bank_account": True,
                "requires_aadhaar": True,
                "allows_existing_default": False,
                "new_business_allowed": True,
                "existing_business_required": False,
                "min_credit_score": 650,
                "max_annual_income": None
            },
            "documents_required": [
                "Identity & Address Proof (Aadhaar/Voter ID)",
                "PAN Card",
                "Project Report for Greenfield Enterprise",
                "Bank statement for last 6 months"
            ],
            "how_to_apply": "Apply online at standupmitra.in or directly at any Commercial Bank branch.",
            "source_url": "https://www.standupmitra.in/",
            "last_verified": None,
            "is_active": True
        },
        {
            "name": "Deendayal Antyodaya Yojana - DAY-NRLM SHG Bank Linkage",
            "short_name": "DAY-NRLM SHG",
            "provider": "Ministry of Rural Development",
            "level": "central",
            "applicable_states": ["ALL"],
            "purpose": ["dairy", "agri", "tailoring", "retail", "handicraft", "business"],
            "description": "Credit linkage and interest subvention for rural women organized in Self Help Groups. Brings effective interest down to 7% or 4% on prompt repayment. [TODO_VERIFY: Check state-wise subvention disbursal terms]",
            "loan_min": 50000.0,
            "loan_max": 600000.0,
            "interest_rate_min": 7.0,
            "interest_rate_max": 7.0,
            "interest_subvention": "3% subvention available on prompt monthly repayment reducing cost to 4% p.a. [TODO_VERIFY]",
            "collateral_required": False,
            "tenure_months_min": 24,
            "tenure_months_max": 60,
            "processing_fee_note": "Zero processing fee for SHG credit linkage. [TODO_VERIFY]",
            "eligibility": {
                "genders": ["female"],
                "min_age": 18,
                "max_age": 65,
                "categories": ["general", "obc", "sc", "st", "minority"],
                "areas": ["rural"],
                "requires_shg_membership": True,
                "min_shg_tenure_months": 6,
                "requires_bank_account": True,
                "requires_aadhaar": True,
                "allows_existing_default": False,
                "new_business_allowed": True,
                "existing_business_required": False,
                "min_credit_score": None,
                "max_annual_income": None
            },
            "documents_required": [
                "SHG Resolution copy",
                "Inter-se agreement of SHG members",
                "Group Savings Bank Passbook",
                "Aadhaar of individual applicant"
            ],
            "how_to_apply": "Route through your Gram Panchayat SHG Village Organization (VO) and local bank branch.",
            "source_url": "https://aajeevika.gov.in/",
            "last_verified": None,
            "is_active": True
        },
        {
            "name": "NABARD Dairy Entrepreneurship Development Scheme",
            "short_name": "NABARD Dairy",
            "provider": "NABARD & Dept of Animal Husbandry",
            "level": "central",
            "applicable_states": ["ALL"],
            "purpose": ["dairy"],
            "description": "Special capital subsidy and credit for setting up small dairy units (2 to 10 milch animals) and milk product processing. [TODO_VERIFY: Check active state allocation windows and subsidy limits]",
            "loan_min": 20000.0,
            "loan_max": 300000.0,
            "interest_rate_min": 8.0,
            "interest_rate_max": 10.5,
            "interest_subvention": "Back-ended capital subsidy up to 25% (33.3% for SC/ST). [TODO_VERIFY]",
            "collateral_required": False,
            "tenure_months_min": 18,
            "tenure_months_max": 60,
            "processing_fee_note": "Bank standard charges apply. [TODO_VERIFY]",
            "eligibility": {
                "genders": ["female", "male", "other"],
                "min_age": 18,
                "max_age": 65,
                "categories": ["general", "obc", "sc", "st", "minority"],
                "areas": ["rural", "semi_urban"],
                "requires_shg_membership": False,
                "min_shg_tenure_months": 0,
                "requires_bank_account": True,
                "requires_aadhaar": True,
                "allows_existing_default": False,
                "new_business_allowed": True,
                "existing_business_required": False,
                "min_credit_score": None,
                "max_annual_income": None
            },
            "documents_required": [
                "Aadhaar Card",
                "Land holding or shed lease document / agreement",
                "Dairy project proposal quotation for animals",
                "Bank statement"
            ],
            "how_to_apply": "Submit dairy project plan to commercial bank, RRB, or District Cooperative Bank.",
            "source_url": "https://www.nabard.org/",
            "last_verified": None,
            "is_active": True
        },
        {
            "name": "Odisha Mission Shakti Women SHG Credit Support",
            "short_name": "Mission Shakti Loan",
            "provider": "Department of Mission Shakti, Govt of Odisha",
            "level": "state",
            "applicable_states": ["Odisha"],
            "purpose": ["dairy", "handicraft", "tailoring", "food_processing", "retail", "business"],
            "description": "Zero interest loans up to Rs 5 Lakhs for women SHGs in Odisha under the Mission Shakti 0% interest subvention scheme. [TODO_VERIFY: Confirm current financial year 0% interest ceiling]",
            "loan_min": 25000.0,
            "loan_max": 500000.0,
            "interest_rate_min": 0.0,
            "interest_rate_max": 0.0,
            "interest_subvention": "100% interest subvention reimbursed directly to SHG bank accounts on regular repayment. [TODO_VERIFY]",
            "collateral_required": False,
            "tenure_months_min": 12,
            "tenure_months_max": 48,
            "processing_fee_note": "No processing fee for Mission Shakti women SHGs. [TODO_VERIFY]",
            "eligibility": {
                "genders": ["female"],
                "min_age": 18,
                "max_age": 60,
                "categories": ["general", "obc", "sc", "st", "minority"],
                "areas": ["rural", "semi_urban", "urban"],
                "requires_shg_membership": True,
                "min_shg_tenure_months": 12,
                "requires_bank_account": True,
                "requires_aadhaar": True,
                "allows_existing_default": False,
                "new_business_allowed": True,
                "existing_business_required": False,
                "min_credit_score": None,
                "max_annual_income": None
            },
            "documents_required": [
                "Odisha Mission Shakti registration number",
                "SHG bank passbook",
                "Aadhaar card of borrower",
                "Business proposal approved by SHG"
            ],
            "how_to_apply": "Apply through Block Mission Shakti coordinator and partner bank branches across Odisha.",
            "source_url": "https://missionshakti.odisha.gov.in/",
            "last_verified": None,
            "is_active": True
        },
        {
            "name": "Generic Microfinance Bank Joint Liability Loan",
            "short_name": "MFI Group Loan",
            "provider": "Small Finance Banks & NBFC-MFIs",
            "level": "bank",
            "applicable_states": ["ALL"],
            "purpose": ["business", "dairy", "retail", "tailoring", "other"],
            "description": "Fast-disbursing collateral-free group loans for micro enterprise activities. [TODO_VERIFY: Check RBI regulated ceiling on NBFC-MFI interest rates]",
            "loan_min": 15000.0,
            "loan_max": 100000.0,
            "interest_rate_min": 18.0,
            "interest_rate_max": 24.0,
            "interest_subvention": "No government subvention. Higher market interest rate. [TODO_VERIFY]",
            "collateral_required": False,
            "tenure_months_min": 12,
            "tenure_months_max": 24,
            "processing_fee_note": "1% to 2% processing fee plus GST. [TODO_VERIFY]",
            "eligibility": {
                "genders": ["female"],
                "min_age": 18,
                "max_age": 58,
                "categories": ["general", "obc", "sc", "st", "minority"],
                "areas": ["rural", "semi_urban", "urban"],
                "requires_shg_membership": False,
                "min_shg_tenure_months": 0,
                "requires_bank_account": True,
                "requires_aadhaar": True,
                "allows_existing_default": False,
                "new_business_allowed": True,
                "existing_business_required": False,
                "min_credit_score": 600,
                "max_annual_income": 300000.0
            },
            "documents_required": [
                "Aadhaar Card",
                "Voter ID / Address proof",
                "Bank account statement",
                "Group member guarantee"
            ],
            "how_to_apply": "Visit any local Small Finance Bank branch or MFI loan officer in your village.",
            "source_url": "https://www.rbi.org.in/",
            "last_verified": None,
            "is_active": True
        }
    ]

    await db.schemes.insert_many(schemes)
    print(f"Successfully seeded {len(schemes)} loan schemes with TODO_VERIFY notes and last_verified: None.")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed_database())
