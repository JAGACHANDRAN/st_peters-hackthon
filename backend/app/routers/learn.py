from fastapi import APIRouter, HTTPException
from app.models.schemas import LearnExplainRequest
from app.services.ollama_client import call_ollama_chat
from app.services.prompts import ADVISOR_SYSTEM_PROMPT

router = APIRouter(prefix="/learn", tags=["learn"])

OFFLINE_TOPIC_EXPLANATIONS = {
    "emi": "An EMI is a fixed amount you pay back to the bank every month. Part of it clears your borrowed loan, and part covers interest. Always keep EMIs below half of your safe income.",
    "cibil": "A credit score (like CIBIL) is a report card showing if you repay loans on time. Paying before the due date gives you a high score, unlocking cheaper loans in the future.",
    "shg": "A Self Help Group (SHG) is a group of 10 to 20 local women who save small money together. Banks trust SHGs and provide low-interest business loans with government support.",
    "interest_subvention": "Interest subvention is a government discount. For example, if the bank loan is 10% interest, the government pays 3%, so you only have to pay 7%.",
    "collateral": "Collateral is an asset (like land or gold) pledged to a bank. Schemes like MUDRA offer collateral-free loans, meaning you do not have to mortgage your property.",
    "emergency_fund": "An emergency fund is a small bucket of savings (equal to 2-3 months of expenses) kept untouched for medical needs or bad monsoon days so you never default.",
    "budget": "A budget is simply writing down money coming in and money going out each week so you never run out of cash before the month ends.",
    "dbt": "Direct Benefit Transfer (DBT) sends government subsidies and scheme funds directly into your verified bank account with no middlemen taking a cut."
}

@router.post("/explain")
async def explain_topic(req: LearnExplainRequest):
    topic_key = req.topic.lower().replace(" ", "_").replace("-", "_")
    
    # Try calling AI for personalized simple explanation
    prompt = (
        f"Explain the financial concept '{req.topic}' to a rural woman entrepreneur in 3 very simple, "
        f"friendly sentences using plain everyday examples (like farming, milk sales, or village markets). "
        f"Keep language encouraging and free of banking jargon."
    )
    messages = [
        {"role": "system", "content": ADVISOR_SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]
    ai_text = await call_ollama_chat(messages, timeout_seconds=15.0)
    if ai_text:
        return {"topic": req.topic, "explanation": ai_text}

    # Fallback to local simplified dictionary
    for k, explanation in OFFLINE_TOPIC_EXPLANATIONS.items():
        if k in topic_key or topic_key in k:
            return {"topic": req.topic, "explanation": explanation}

    return {
        "topic": req.topic,
        "explanation": f"{req.topic} is an important financial term. Managing it wisely helps you grow your enterprise safely and build trust with your local bank branch."
    }
