from typing import Dict, Any, List
from app.services.finance.config import (
    HAIRCUT_NEW_OR_IDEA_BUSINESS,
    STABILITY_FACTOR_MAP,
    SAFE_EMI_SHARE_OF_AVAILABLE,
    COMFORTABLE_EMI_RATIO
)
from app.services.finance.emi import calculate_emi, max_loan_for_emi


def evaluate_repayment_capacity(
    profile: Dict[str, Any],
    requested_amount: float,
    tenure_months: int,
    annual_rate: float
) -> Dict[str, Any]:
    """
    Evaluates whether the user can safely afford the loan EMI based on:
    - Disposable income from current household earnings
    - Net profit from business (with 30% haircut for new/idea business)
    - Stability factor (regular 1.0, seasonal 0.8, irregular 0.6)
    - Existing EMI burdens
    """
    monthly_income = float(profile.get("monthly_income") or 0.0)
    hh_expense = float(profile.get("monthly_household_expense") or 0.0)
    other_expense = float(profile.get("monthly_other_expense") or 0.0)

    existing_loans = profile.get("existing_loans") or []
    existing_emi_sum = sum(float(l.get("monthly_emi") or 0.0) for l in existing_loans)

    disposable = monthly_income - hh_expense - other_expense - existing_emi_sum

    # Business earnings evaluation
    business = profile.get("business") or {}
    biz_revenue = float(business.get("expected_monthly_revenue") or 0.0)
    biz_cost = float(business.get("expected_monthly_cost") or 0.0)
    biz_stage = business.get("stage", "idea")
    is_new_biz = business.get("is_new_business", True)

    raw_biz_net = biz_revenue - biz_cost
    if biz_stage in ["idea", "new"] or is_new_biz:
        biz_net = raw_biz_net * (1.0 - HAIRCUT_NEW_OR_IDEA_BUSINESS)
    else:
        biz_net = raw_biz_net

    available_for_emi = max(0.0, disposable + biz_net)

    income_stability = profile.get("income_stability", "regular")
    stability_factor = STABILITY_FACTOR_MAP.get(income_stability, 0.6)

    safe_max_emi = available_for_emi * SAFE_EMI_SHARE_OF_AVAILABLE * stability_factor
    safe_max_loan = max_loan_for_emi(safe_max_emi, annual_rate, tenure_months)

    emi = calculate_emi(requested_amount, annual_rate, tenure_months)

    # Verdict determination
    if emi <= (COMFORTABLE_EMI_RATIO * safe_max_emi) and emi > 0:
        verdict = "COMFORTABLE"
    elif emi <= safe_max_emi and emi > 0:
        verdict = "TIGHT"
    elif emi <= available_for_emi and emi > 0:
        verdict = "RISKY"
    else:
        verdict = "NOT_AFFORDABLE"

    ratio = round(emi / monthly_income, 3) if monthly_income > 0 else 1.0

    # Deterministic suggestions
    suggestions: List[str] = []
    if verdict == "COMFORTABLE":
        suggestions.append("Your income and expected business surplus easily support this monthly EMI.")
        suggestions.append("Pay EMIs on time via bank auto-debit to build a stellar credit score.")
    elif verdict == "TIGHT":
        suggestions.append("This EMI is manageable, but leaves little margin for household emergencies.")
        suggestions.append("We recommend setting aside a 2-month emergency reserve before borrowing.")
        if not profile.get("is_shg_member"):
            suggestions.append("Consider joining a local Self Help Group (SHG) to access emergency community funds.")
    elif verdict == "RISKY":
        if safe_max_loan > 0:
            suggestions.append(f"Consider reducing the loan amount to ₹{int(safe_max_loan):,} to lower your risk.")
        suggestions.append(f"Increasing tenure to {min(60, tenure_months + 12)} months will lower the monthly EMI.")
        excess_expense = max(500, int(emi - safe_max_emi))
        suggestions.append(f"Cutting non-essential expenses by approximately ₹{excess_expense:,}/month will make this EMI safer.")
    else:  # NOT_AFFORDABLE
        if safe_max_loan > 0:
            suggestions.append(f"Your safe borrowing limit right now is ₹{int(safe_max_loan):,}.")
        else:
            suggestions.append("Your current living expenses exceed your earnings. Prioritize stabilizing cash flow before taking new debt.")
        suggestions.append("Increase your own contribution to reduce the required loan size.")
        suggestions.append("Explore government grant or interest subvention schemes through local SHG federation.")

    return {
        "verdict": verdict,
        "ratio": ratio,
        "emi": round(emi, 2),
        "safe_max_emi": round(safe_max_emi, 2),
        "safe_max_loan": round(safe_max_loan, 2),
        "disposable_income": round(disposable, 2),
        "business_net": round(biz_net, 2),
        "available_for_emi": round(available_for_emi, 2),
        "suggestions": suggestions[:3]
    }
