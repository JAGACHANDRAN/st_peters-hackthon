from typing import List, Dict, Any
from app.services.finance.config import SUGGESTED_SAVINGS_MIN_PCT, SUGGESTED_SAVINGS_MAX_PCT


def calculate_budget_analysis(income: float, expenses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes total expenses, category breakdown percentages, surplus/deficit,
    and suggested monthly savings (20-25% of positive surplus, never more than available).
    """
    income = float(income or 0.0)
    total_expense = sum(float(item.get("amount") or 0.0) for item in expenses)
    remaining = income - total_expense

    breakdown = []
    for item in expenses:
        cat = item.get("category", "General")
        amt = float(item.get("amount") or 0.0)
        pct = round((amt / income * 100.0), 1) if income > 0 else 0.0
        breakdown.append({
            "category": cat,
            "amount": amt,
            "percentage": pct
        })

    if remaining > 0:
        suggested = round(remaining * SUGGESTED_SAVINGS_MIN_PCT, 2)
        # Cap at available surplus
        suggested = min(suggested, remaining)
    else:
        suggested = 0.0

    return {
        "income": round(income, 2),
        "total_expense": round(total_expense, 2),
        "remaining": round(remaining, 2),
        "suggested_savings": suggested,
        "expenses": breakdown,
        "savings_rate_pct": round((suggested / income * 100.0), 1) if income > 0 else 0.0
    }
