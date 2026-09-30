import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

db_manager = DatabaseManager()

async def connect_to_mongo():
    print("\n" + "=" * 65)
    print(f"[*] CONNECTING TO MONGODB...")
    print(f"[*] Target URI : {settings.MONGODB_URI}")
    print(f"[*] Database   : {settings.DB_NAME}")
    print("=" * 65)
    
    try:
        import certifi
        db_manager.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000
        )
        db_manager.db = db_manager.client[settings.DB_NAME]
        # Test connection ping
        await db_manager.client.admin.command('ping')
        
        print("\n" + "=" * 65)
        print(">>> [SUCCESS] MONGODB IS CONNECTED SUCCESSFULLY! <<<")
        print(f"[*] Connected to: {settings.MONGODB_URI}")
        print(f"[*] Active DB   : {settings.DB_NAME}")
        print("=" * 65 + "\n")
        logger.info("MongoDB connected successfully.")
    except Exception as e:
        print("\n" + "!" * 65)
        print(">>> [STATUS] MONGODB SERVER NOT REACHABLE OR ACCESS REJECTED! <<<")
        print(f"[*] Attempted URI: {settings.MONGODB_URI}")
        print(f"[*] Error Details: {e}")
        if "tlsv1 alert internal error" in str(e).lower() or "ssl" in str(e).lower():
            print("\n[IMPORTANT ATLAS TIP]:")
            print("  If using MongoDB Atlas, go to cloud.mongodb.com:")
            print("  1. Click 'Network Access' in the left menu")
            print("  2. Click 'Add IP Address'")
            print("  3. Choose 'Allow Access from Anywhere' (0.0.0.0/0) and Save.")
        print("\n[*] Action: Initializing local AsyncMongoMockClient fallback.")
        print("!" * 65 + "\n")
        logger.warning(f"Could not connect to MongoDB server ({e}). Initializing fallback in-memory database mock for local testing/development.")
        
        try:
            from mongomock_motor import AsyncMongoMockClient
            db_manager.client = AsyncMongoMockClient()
            db_manager.db = db_manager.client[settings.DB_NAME]
            print("[INFO] Fallback AsyncMongoMockClient active. All API operations will work in-memory.\n")
        except Exception as mock_err:
            logger.error(f"Fallback to mock failed: {mock_err}")
            raise e

    await init_db_indexes()

async def close_mongo_connection():
    if db_manager.client:
        db_manager.client.close()
        logger.info("MongoDB connection closed.")

def get_database() -> AsyncIOMotorDatabase:
    return db_manager.db

async def init_db_indexes():
    db = get_database()
    if db is None:
        return
    try:
        # users indexes
        await db.users.create_index("email", unique=True, sparse=True)
        await db.users.create_index("phone", unique=True, sparse=True)
        # profiles
        await db.profiles.create_index("user_id", unique=True)
        # schemes
        await db.schemes.create_index("short_name")
        await db.schemes.create_index("is_active")
        # budgets
        await db.budgets.create_index("user_id")
        await db.budgets.create_index([("user_id", 1), ("month", 1)], unique=True)
        # goals
        await db.goals.create_index("user_id")
        # transactions
        await db.transactions.create_index("idempotency_key", unique=True)
        await db.transactions.create_index("user_id")
        # eligibility_results
        await db.eligibility_results.create_index("user_id")
        # chat_messages
        await db.chat_messages.create_index("user_id")
        logger.info("MongoDB indexes verified/created.")

        # Seed only system admin and loan schemes catalog if empty (NO hardcoded Lakshmi user!)
        scheme_count = await db.schemes.count_documents({})
        if scheme_count == 0:
            logger.info("Database is empty. Populating government scheme catalog...")
            from app.core.security import get_password_hash
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            
            # Seed admin user only
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

            # Insert government loan schemes catalog
            cursor_schemes = [
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
                        "min_age": 18, "max_age": 65,
                        "categories": ["general", "obc", "sc", "st", "minority"],
                        "areas": ["rural", "semi_urban", "urban"],
                        "requires_shg_membership": False, "min_shg_tenure_months": 0,
                        "requires_bank_account": True, "requires_aadhaar": True,
                        "allows_existing_default": False, "new_business_allowed": True,
                        "existing_business_required": False, "min_credit_score": None, "max_annual_income": None
                    },
                    "documents_required": ["Aadhaar Card", "Bank Passbook (6 months)", "Proof of Business Address", "Passport size photo"],
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
                        "genders": ["female"], "min_age": 18, "max_age": 65,
                        "categories": ["general", "obc", "sc", "st", "minority"],
                        "areas": ["rural", "semi_urban", "urban"],
                        "requires_shg_membership": False, "min_shg_tenure_months": 0,
                        "requires_bank_account": True, "requires_aadhaar": True,
                        "allows_existing_default": False, "new_business_allowed": True,
                        "existing_business_required": False, "min_credit_score": 650, "max_annual_income": None
                    },
                    "documents_required": ["Identity & Address Proof (Aadhaar/Voter ID)", "PAN Card", "Project Report for Greenfield Enterprise", "Bank statement for last 6 months"],
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
                        "genders": ["female"], "min_age": 18, "max_age": 65,
                        "categories": ["general", "obc", "sc", "st", "minority"],
                        "areas": ["rural"],
                        "requires_shg_membership": True, "min_shg_tenure_months": 6,
                        "requires_bank_account": True, "requires_aadhaar": True,
                        "allows_existing_default": False, "new_business_allowed": True,
                        "existing_business_required": False, "min_credit_score": None, "max_annual_income": None
                    },
                    "documents_required": ["SHG Resolution copy", "Inter-se agreement of SHG members", "Group Savings Bank Passbook", "Aadhaar of individual applicant"],
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
                        "genders": ["female", "male", "other"], "min_age": 18, "max_age": 65,
                        "categories": ["general", "obc", "sc", "st", "minority"],
                        "areas": ["rural", "semi_urban"],
                        "requires_shg_membership": False, "min_shg_tenure_months": 0,
                        "requires_bank_account": True, "requires_aadhaar": True,
                        "allows_existing_default": False, "new_business_allowed": True,
                        "existing_business_required": False, "min_credit_score": None, "max_annual_income": None
                    },
                    "documents_required": ["Aadhaar Card", "Land holding or shed lease document / agreement", "Dairy project proposal quotation for animals", "Bank statement"],
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
                    "description": "Subsidized low-interest enterprise loans up to Rs 5 Lakhs for women SHGs. [TODO_VERIFY: Confirm current financial year interest ceiling in your state]",
                    "loan_min": 25000.0,
                    "loan_max": 500000.0,
                    "interest_rate_min": 4.0,
                    "interest_rate_max": 7.0,
                    "interest_subvention": "Interest subvention reimbursed directly to SHG bank accounts on regular repayment. [TODO_VERIFY]",
                    "collateral_required": False,
                    "tenure_months_min": 12,
                    "tenure_months_max": 48,
                    "processing_fee_note": "No processing fee for registered women SHGs. [TODO_VERIFY]",
                    "eligibility": {
                        "genders": ["female"], "min_age": 18, "max_age": 60,
                        "categories": ["general", "obc", "sc", "st", "minority"],
                        "areas": ["rural", "semi_urban", "urban"],
                        "requires_shg_membership": True, "min_shg_tenure_months": 6,
                        "requires_bank_account": True, "requires_aadhaar": True,
                        "allows_existing_default": False, "new_business_allowed": True,
                        "existing_business_required": False, "min_credit_score": None, "max_annual_income": None
                    },
                    "documents_required": ["SHG registration certificate", "SHG bank passbook", "Aadhaar card of borrower", "Business proposal approved by SHG"],
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
                        "genders": ["female"], "min_age": 18, "max_age": 58,
                        "categories": ["general", "obc", "sc", "st", "minority"],
                        "areas": ["rural", "semi_urban", "urban"],
                        "requires_shg_membership": False, "min_shg_tenure_months": 0,
                        "requires_bank_account": True, "requires_aadhaar": True,
                        "allows_existing_default": False, "new_business_allowed": True,
                        "existing_business_required": False, "min_credit_score": 600, "max_annual_income": 300000.0
                    },
                    "documents_required": ["Aadhaar Card", "Voter ID / Address proof", "Bank account statement", "Group member guarantee"],
                    "how_to_apply": "Visit any local Small Finance Bank branch or MFI loan officer in your village.",
                    "source_url": "https://www.rbi.org.in/",
                    "last_verified": None,
                    "is_active": True
                }
            ]
            await db.schemes.insert_many(cursor_schemes)
            logger.info(f"Seeded {len(cursor_schemes)} schemes and admin user into database.")
    except Exception as e:
        logger.warning(f"Note on index creation: {e}")
