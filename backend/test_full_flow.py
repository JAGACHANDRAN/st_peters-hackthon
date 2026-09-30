import urllib.request
import urllib.error
import json
import asyncio
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

BASE_URL = "http://127.0.0.1:8000/api"

def api_post(endpoint, data, token=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        },
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def api_put(endpoint, data, token=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        },
        method="PUT"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def api_get(endpoint, token=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        },
        method="GET"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def test_flow():
    print("\n--- 1. Testing Registration ---")
    user_payload = {
        "name": "Ananya Sen",
        "email": "ananya.sen@example.com",
        "phone": "9830098300",
        "password": "Password@123",
        "language": "en"
    }
    try:
        reg_res = api_post("/auth/register", user_payload)
        token = reg_res["access_token"]
        user_id = reg_res["user"]["id"]
        print(f"Registered user ID: {user_id}, Token received.")
    except urllib.error.HTTPError as e:
        print(f"Registration error {e.code}: {e.read().decode()}")
        print("Attempting login instead...")
        login_res = api_post("/auth/login", {"identifier": user_payload["email"], "password": user_payload["password"]})
        token = login_res["access_token"]
        user_id = login_res["user"]["id"]
        print(f"Logged in user ID: {user_id}")

    print("\n--- 2. Testing Profile Update (Onboarding) ---")
    profile_payload = {
        "age": 28,
        "gender": "female",
        "state": "West Bengal",
        "district": "Kolkata",
        "area": "semi_urban",
        "social_category": "general",
        "education_level": "graduate",
        "marital_status": "married",
        "dependents": 1,
        "is_shg_member": False,
        "shg_name": None,
        "shg_tenure_months": 0,
        "has_bank_account": True,
        "has_aadhaar": True,
        "has_pan": True,
        "has_land_or_assets": True,
        "asset_value": 50000.0,
        "monthly_income": 25000.0,
        "income_stability": "regular",
        "monthly_household_expense": 12000.0,
        "monthly_other_expense": 3000.0,
        "existing_loans": [],
        "has_default_history": False,
        "credit_score": 720,
        "business": {
            "type": "retail",
            "stage": "new",
            "is_new_business": True,
            "is_micro_enterprise": True,
            "required_amount": 100000.0,
            "own_contribution": 20000.0,
            "expected_monthly_revenue": 35000.0,
            "expected_monthly_cost": 15000.0
        }
    }
    try:
        prof_res = api_put("/profile", profile_payload, token=token)
        print(f"Profile updated successfully for state: {prof_res.get('state')}")
    except urllib.error.HTTPError as e:
        print(f"Profile update error {e.code}: {e.read().decode()}")

    print("\n--- 3. Testing Budget Creation ---")
    budget_payload = {
        "income": 25000.0,
        "month": "2026-09",
        "expenses": [
            {"category": "Food", "amount": 8000.0},
            {"category": "Utilities", "amount": 2000.0},
            {"category": "Education", "amount": 2000.0}
        ]
    }
    try:
        budget_res = api_post("/budget", budget_payload, token=token)
        print(f"Budget saved successfully! Suggested savings: {budget_res.get('suggested_savings')}")
    except urllib.error.HTTPError as e:
        print(f"Budget save error {e.code}: {e.read().decode()}")

    print("\n--- 4. Testing Goal Creation ---")
    goal_payload = {
        "name": "Emergency Fund",
        "target_amount": 50000.0,
        "monthly_contribution": 3000.0,
        "deadline": "2027-09-30"
    }
    try:
        goal_res = api_post("/goals", goal_payload, token=token)
        print(f"Goal created successfully with ID: {goal_res.get('id')}")
    except urllib.error.HTTPError as e:
        print(f"Goal create error {e.code}: {e.read().decode()}")

    print("\n--- 5. Checking Data directly in MongoDB Atlas ---")
    async def check_atlas():
        client = AsyncIOMotorClient(settings.MONGODB_URI, tlsCAFile=certifi.where())
        db = client[settings.DB_NAME]
        
        users_count = await db.users.count_documents({"email": "ananya.sen@example.com"})
        profiles_count = await db.profiles.count_documents({"user_id": user_id})
        budgets_count = await db.budgets.count_documents({"user_id": user_id})
        goals_count = await db.goals.count_documents({"user_id": user_id})
        
        print(f"MongoDB Atlas Verification for user {user_id}:")
        print(f"  * users collection count       : {users_count}")
        print(f"  * profiles collection count    : {profiles_count}")
        print(f"  * budgets collection count     : {budgets_count}")
        print(f"  * goals collection count       : {goals_count}")
        client.close()

    asyncio.run(check_atlas())

if __name__ == "__main__":
    test_flow()
