# Finance Empowerment Platform

An accessible, mobile-first web platform empowering rural women entrepreneurs in India (example persona: **Lakshmi Devi**, who is building a dairy enterprise in Puri, Odisha) to find eligible government and bank loan schemes, evaluate safe EMI repayment capacities, build monthly savings, and receive plain-language guidance from an AI financial advisor.

---

## Key Features

1. **Deterministic Finance Engine**:
   - Standard EMI calculations with interest subvention and 0% interest handling.
   - Comprehensive multi-factor scheme eligibility rules matching (Gender, Age, State, Area, SHG membership & tenure, Bank account, Aadhaar, Default history, Business stage).
   - Cash-flow repayment affordability engine with 30% business gestation haircut, income stability weighting, and clear verdicts: `COMFORTABLE`, `TIGHT`, `RISKY`, `NOT_AFFORDABLE`.
2. **Explainable AI Integration**:
   - Integrated with Ollama Cloud (`gpt-oss:120b`).
   - Plain-language low-literacy explanations for scheme matches, rejections, and financial concepts.
   - Strict Pydantic JSON output validation with automatic deterministic template fallback if AI is unreachable or offline.
3. **Interactive Financial Tools**:
   - **Loan Finder & Calculator**: Live slider adjustments for loan amount and tenure with instant EMI and repayment verdict updates.
   - **Monthly Budget & Expenses**: Recharts visual split and automatic suggested savings calculation (20-25% of net surplus).
   - **Savings Goals**: Milestone tracking with months-to-target countdown and progress bars.
   - **Demo Savings Wallet**: Simulated gateway transactions with 3-step state machine (`INITIATED -> PENDING -> SUCCESS | FAILED`), failure simulation toggle, retry support, and strict idempotency protection.
   - **Financial Literacy Hub**: 8 micro-lessons with one-click "Explain simply with AI" translation.
   - **Admin Schemes Manager**: Protected admin console to add, edit, toggle, and verify government schemes.

---

## Project Structure

```
finance-platform/
  backend/
    app/
      main.py                  # FastAPI application entrypoint with CORS & Lifespan
      core/                    # config.py, security.py (JWT & bcrypt), db.py (Motor async + indexes)
      models/                  # Pydantic schemas (User, Profile, Scheme, Budget, Goal, Transaction)
      routers/                 # auth, profile, budget, goals, schemes, eligibility, advisor, payments, learn, admin
      services/
        finance/               # emi.py, eligibility.py, repayment.py, budget.py, payments.py, simulated_provider.py, config.py
        ollama_client.py       # Ollama chat client with timeout, retries, and fallback
        prompts.py             # System prompts and deterministic fallback templates
      scripts/
        seed.py                # Database seed script (Admin, Lakshmi, 6 Government Schemes)
    tests/                     # test_emi.py, test_eligibility.py, test_repayment.py, test_payments.py
    requirements.txt
    .env.example
  frontend/
    src/
      api/                     # Axios client + modular API callers
      components/              # Navbar, BottomNav, StatCard, ProgressBar, SchemeCard, EligibilityBadge, Loader, ErrorBox
      pages/                   # Landing, Login, Register, Onboarding, Dashboard, Budget, Goals, Loans, LoanDetail, Advisor, Payments, Learn, AdminSchemes, NotFound
      context/                 # AuthContext (JWT, user state, onboarding tracking)
      routes/                  # ProtectedRoute, AdminRoute
      i18n/                    # en.json localization dictionary + lookup utility
      App.jsx, main.jsx
    package.json, .env.example
  README.md
```

---

## Quickstart & Run Commands

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv

# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run unit test suite
pytest tests

# Seed initial database (Admin, Lakshmi, and 6 government schemes)
python -m app.scripts.seed

# Start backend dev server on port 8000
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start frontend dev server on port 5173
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 4-Minute Demo Script

Follow this walkthrough to showcase all 12 platform features during evaluations or presentations:

### Minute 1: Persona Introduction & Landing (`/`)
1. Open `http://localhost:5173/`.
2. Notice the clean, high-contrast, accessible landing page designed for rural entrepreneurs.
3. Read **Lakshmi's Story**: A rural woman in Puri, Odisha with an ₹8,000 monthly income looking to buy a dairy cow & shed (₹20,000-₹50,000 goal).
4. Click **"Sign In (Try Lakshmi Demo)"** or navigate to `/login`.

### Minute 2: Instant Login & Personalized Dashboard (`/dashboard`)
1. On `/login`, click the quick **"👩 Lakshmi Devi"** one-click button (fills `lakshmi@example.com` / `Lakshmi@123`).
2. Land on `/dashboard`:
   - View Lakshmi's personalized stats: ₹8,000 income, ₹2,000 surplus, ₹2,050 safe EMI capacity, and ₹4,500 saved towards her **"Dairy Buffalo & Shed Fund"**.
   - Check the **Top Loan Matches** card showing tailored recommendations like DAY-NRLM and PM MUDRA.
   - Observe the **AI Advisor Tip** advising on keeping an emergency buffer.

### Minute 3: Loan Finder & Repayment Affordability Check (`/loans` & `/loans/:id`)
1. Click **"Find Loans"** in the navigation bar.
2. Notice the mandatory disclaimer: *"Guidance only. Final eligibility, interest rate and approval are decided by the bank or scheme authority."*
3. Move the **Requested Borrowing Amount** slider to ₹50,000 and **Tenure** to 24 months. Notice the **EligibilityBadge** (Eligible, Maybe, Not Eligible) and specific rule reasons on each card.
4. Click **"Check Repayment"** on **DAY-NRLM SHG** or **PM MUDRA**:
   - Notice the live EMI computation (₹2,284/month).
   - See the repayment verdict banner: **RISKY** (because ₹2,284 is above Lakshmi's ₹2,050 safe limit).
   - Now slide the tenure from **24 months to 36 months**: the EMI drops to ~₹1,589/month and the verdict automatically switches to **COMFORTABLE & SAFE**!
   - Review the AI Plain-Language explanation and required document checklist.

### Minute 4: AI Advisor Chat & Demo Wallet Practice (`/advisor` & `/payments`)
1. Navigate to **"AI Advisor"** (`/advisor`):
   - Click a suggestion chip: *"Can I afford ₹50,000 for a dairy cow?"*
   - See the plain-language response with everyday farming/milk analogies, free of financial jargon.
2. Navigate to **"Demo Wallet"** (`/payments`):
   - Make a simulated ₹1,500 deposit to Lakshmi's Dairy Goal.
   - Observe the 3-step state machine: `INITIATED` -> `PENDING` -> `SUCCESS`.
   - See the goal balance update instantly in the header and transaction history table.
   - Turn ON **"Simulate Bank Payment Failure"** and click deposit: see the transaction fail gracefully with `FAILED`, leaving the savings balance unchanged, and offering an instant **"Retry Payment"** button.
3. (Bonus) Admin Access: Log out and click **"🛡️ System Admin"** (`admin@finance.gov.in` / `Admin@123`) to view and edit schemes in `/admin/schemes`. Non-admin accounts visiting this route receive a clear 403 access restriction.

---

## Seed Data & Credentials

| Role | Username / Identifier | Password | Description |
|---|---|---|---|
| **Demo User** | `lakshmi@example.com` (or `9876543210`) | `Lakshmi@123` | Rural woman entrepreneur in Puri, Odisha; SHG member; ₹8k income; Dairy goal |
| **Admin** | `admin@finance.gov.in` | `Admin@123` | Scheme administrator with access to `/admin/schemes` |

### Seeded Loan Schemes
1. **Pradhan Mantri MUDRA Yojana (Shishu & Kishor)** - Central Government
2. **Stand-Up India Scheme for Women Entrepreneurs** - SIDBI / Central Government
3. **Deendayal Antyodaya Yojana - DAY-NRLM SHG Bank Linkage** - Ministry of Rural Development
4. **NABARD Dairy Entrepreneurship Development Scheme** - NABARD / Animal Husbandry
5. **Odisha Mission Shakti Women SHG Credit Support** - Department of Mission Shakti, Odisha
6. **Generic Microfinance Bank Joint Liability Loan** - Small Finance Banks / NBFC-MFIs

*All seeded schemes are initially marked with `last_verified: null` and link directly to official government portals.*

---

## Golden Rules Followed

1. **Deterministic Calculations**: All EMI math, eligibility matching, and cash-flow affordability calculations are executed in Python (`app/services/finance/`), fully tested with `pytest`. The LLM only explains results produced by the code.
2. **Pydantic Validation**: All structured outputs and API payloads are validated with Pydantic v2.
3. **No Hard-coded Schemes**: All schemes live in MongoDB and can be managed via API and Admin console.
4. **Resilience & Privacy**: Passwords hashed with bcrypt; secrets never logged or sent to LLM; AI client includes retries with automatic deterministic template fallback if offline.
