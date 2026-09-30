import asyncio
import certifi
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.security import get_password_hash

COLLECTIONS = [
    "users",
    "profiles",
    "schemes",
    "budgets",
    "goals",
    "transactions",
    "eligibility_results",
    "chat_messages"
]

SCHEMES_CATALOG = [
    {
        "name": "Pradhan Mantri MUDRA Yojana (Shishu & Kishor)",
        "short_name": "PM MUDRA",
        "provider": "Ministry of Finance, Govt of India",
        "level": "central",
        "applicable_states": ["ALL"],
        "purpose": ["business", "dairy", "retail", "tailoring", "agri"],
        "description": "Collateral-free micro loans up to Rs 5 Lakhs for non-corporate micro enterprises.",
        "loan_min": 10000.0,
        "loan_max": 500000.0,
        "interest_rate_min": 8.5,
        "interest_rate_max": 11.5,
        "interest_subvention": "Interest rate subsidy under special state schemes may apply.",
        "collateral_required": False,
        "tenure_months_min": 12,
        "tenure_months_max": 60,
        "processing_fee_note": "Zero processing fee for Shishu loans up to Rs 50,000.",
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
        "description": "Facilitates bank loans between Rs 10 Lakhs and Rs 1 Crore to at least one woman or SC/ST borrower per bank branch for setting up greenfield enterprises.",
        "loan_min": 1000000.0,
        "loan_max": 10000000.0,
        "interest_rate_min": 7.5,
        "interest_rate_max": 9.5,
        "interest_subvention": "Low interest rate linked to MCLR + 3%.",
        "collateral_required": False,
        "tenure_months_min": 36,
        "tenure_months_max": 84,
        "processing_fee_note": "Nominal bank processing fee.",
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
        "description": "Credit linkage and interest subvention for rural women organized in Self Help Groups. Brings effective interest down to 7% or 4% on prompt repayment.",
        "loan_min": 50000.0,
        "loan_max": 600000.0,
        "interest_rate_min": 7.0,
        "interest_rate_max": 7.0,
        "interest_subvention": "3% subvention available on prompt monthly repayment reducing cost to 4% p.a.",
        "collateral_required": False,
        "tenure_months_min": 24,
        "tenure_months_max": 60,
        "processing_fee_note": "Zero processing fee for SHG credit linkage.",
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
        "description": "Special capital subsidy and credit for setting up small dairy units (2 to 10 milch animals) and milk product processing.",
        "loan_min": 20000.0,
        "loan_max": 300000.0,
        "interest_rate_min": 8.0,
        "interest_rate_max": 10.5,
        "interest_subvention": "Back-ended capital subsidy up to 25% (33.3% for SC/ST).",
        "collateral_required": False,
        "tenure_months_min": 18,
        "tenure_months_max": 60,
        "processing_fee_note": "Bank standard charges apply.",
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
        "name": "State Women SHG Low-Interest Enterprise Credit",
        "short_name": "State SHG Credit Support",
        "provider": "State Rural Livelihoods Mission",
        "level": "state",
        "applicable_states": ["ALL"],
        "purpose": ["dairy", "handicraft", "tailoring", "food_processing", "retail", "business"],
        "description": "Subsidized low-interest enterprise loans up to Rs 5 Lakhs for women SHGs.",
        "loan_min": 25000.0,
        "loan_max": 500000.0,
        "interest_rate_min": 4.0,
        "interest_rate_max": 7.0,
        "interest_subvention": "Interest subvention reimbursed directly to SHG bank accounts on regular repayment.",
        "collateral_required": False,
        "tenure_months_min": 12,
        "tenure_months_max": 48,
        "processing_fee_note": "No processing fee for registered women SHGs.",
        "eligibility": {
            "genders": ["female"],
            "min_age": 18,
            "max_age": 60,
            "categories": ["general", "obc", "sc", "st", "minority"],
            "areas": ["rural", "semi_urban", "urban"],
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
            "SHG registration certificate",
            "SHG bank passbook",
            "Aadhaar card of borrower",
            "Business proposal approved by SHG"
        ],
        "how_to_apply": "Apply through your Block Livelihood coordinator and partner bank branches.",
        "source_url": "https://aajeevika.gov.in/",
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
        "description": "Fast-disbursing collateral-free group loans for micro enterprise activities.",
        "loan_min": 15000.0,
        "loan_max": 100000.0,
        "interest_rate_min": 18.0,
        "interest_rate_max": 24.0,
        "interest_subvention": "No government subvention. Higher market interest rate.",
        "collateral_required": False,
        "tenure_months_min": 12,
        "tenure_months_max": 24,
        "processing_fee_note": "1% to 2% processing fee plus GST.",
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

async def setup_mongodb_cloud():
    print("=" * 70)
    print(">>> MONGODB CLOUD DATABASE INITIALIZATION SCRIPT <<<")
    print(f"Target URI : {settings.MONGODB_URI}")
    print(f"Target DB  : {settings.DB_NAME}")
    print("=" * 70)

    try:
        client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000
        )
        db = client[settings.DB_NAME]
        
        # Test connection ping
        print("\n[*] Pinging MongoDB Cloud server...")
        await client.admin.command('ping')
        print("[+] SUCCESS: Connected to MongoDB Cloud!")

        # 1. Create each collection explicitly
        print("\n[*] Ensuring collections exist in database...")
        existing_collections = await db.list_collection_names()
        for col_name in COLLECTIONS:
            if col_name not in existing_collections:
                await db.create_collection(col_name)
                print(f"  [+] Created collection: {col_name}")
            else:
                print(f"  [.] Already exists   : {col_name}")

        # 2. Create indexes
        print("\n[*] Creating indexes on collections...")
        await db.users.create_index("email", unique=True, sparse=True)
        await db.users.create_index("phone", unique=True, sparse=True)
        await db.profiles.create_index("user_id", unique=True)
        await db.schemes.create_index("short_name")
        await db.schemes.create_index("is_active")
        await db.budgets.create_index("user_id")
        await db.budgets.create_index([("user_id", 1), ("month", 1)], unique=True)
        await db.goals.create_index("user_id")
        await db.transactions.create_index("idempotency_key", unique=True)
        await db.transactions.create_index("user_id")
        await db.eligibility_results.create_index("user_id")
        await db.chat_messages.create_index("user_id")
        print("[+] All collection indexes successfully configured.")

        # 3. Seed schemes if empty
        schemes_count = await db.schemes.count_documents({})
        if schemes_count == 0:
            print("\n[*] Seeding initial government schemes catalog...")
            await db.schemes.insert_many(SCHEMES_CATALOG)
            print(f"[+] Inserted {len(SCHEMES_CATALOG)} schemes.")
        else:
            print(f"\n[.] Schemes catalog already contains {schemes_count} documents.")

        # 4. Seed admin user if not present
        now = datetime.now(timezone.utc)
        admin = await db.users.find_one({"email": "admin@finance.gov.in"})
        if not admin:
            admin_user = {
                "name": "System Administrator",
                "email": "admin@finance.gov.in",
                "phone": "9999999999",
                "password_hash": get_password_hash("Admin@123"),
                "role": "admin",
                "language": "en",
                "onboarding_complete": True,
                "created_at": now
            }
            await db.users.insert_one(admin_user)
            print("[+] Seeded default admin: admin@finance.gov.in (Admin@123)")

        print("\n" + "=" * 70)
        print(">>> MONGODB CLOUD DATABASE SETUP COMPLETE! <<<")
        print("=" * 70 + "\n")
        client.close()

    except Exception as e:
        print("\n" + "!" * 70)
        print("[!] ERROR CONNECTING TO MONGODB CLOUD:")
        print(f"    {e}")
        print("\n[RESOLUTION STEPS FOR MONGODB ATLAS]:")
        print("  1. Log into https://cloud.mongodb.com")
        print("  2. In the left sidebar, click 'Network Access' (under Security)")
        print("  3. Click the green '+ ADD IP ADDRESS' button")
        print("  4. Click 'ALLOW ACCESS FROM ANYWHERE' (or enter 0.0.0.0/0)")
        print("  5. Click 'Confirm' and wait 30 seconds for it to become Active.")
        print("  6. Re-run: python -m app.scripts.setup_cloud_db")
        print("!" * 70 + "\n")

if __name__ == "__main__":
    asyncio.run(setup_mongodb_cloud())
