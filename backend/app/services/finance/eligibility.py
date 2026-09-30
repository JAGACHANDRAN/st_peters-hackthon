from typing import Dict, Any, List, Tuple
from app.services.finance.repayment import evaluate_repayment_capacity


def evaluate_scheme_eligibility(
    profile: Dict[str, Any],
    scheme: Dict[str, Any],
    requested_amount: float,
    tenure_months: int
) -> Dict[str, Any]:
    """
    Checks all eligibility rules of a loan scheme against a user's financial and personal profile.
    Returns:
    - verdict: ELIGIBLE | MAYBE | NOT_ELIGIBLE
    - matched_rules: List[str]
    - failed_rules: List[str]
    - missing_info: List[str]
    - suggested_amount: float
    - repayment: repayment evaluation dictionary
    """
    matched_rules: List[str] = []
    failed_rules: List[str] = []
    missing_info: List[str] = []

    # 1. State check
    applicable_states = scheme.get("applicable_states", ["ALL"])
    user_state = profile.get("state")
    if not user_state:
        missing_info.append("State of residence is missing in your profile.")
    elif "ALL" in applicable_states or user_state in applicable_states:
        matched_rules.append(f"Applicable in your state ({user_state}).")
    else:
        failed_rules.append(f"Scheme is available only in state(s): {', '.join(applicable_states)}, but your profile is registered in state {user_state}.")

    # Scheme eligibility config
    rules = scheme.get("eligibility", {})

    # 2. Gender check
    allowed_genders = rules.get("genders", [])
    user_gender = profile.get("gender")
    if not user_gender:
        missing_info.append("Gender is not specified.")
    elif allowed_genders and user_gender.lower() not in [g.lower() for g in allowed_genders]:
        failed_rules.append(f"Scheme is reserved for {', '.join(allowed_genders)} entrepreneurs.")
    else:
        matched_rules.append(f"Matches gender criteria ({user_gender}).")

    # 3. Age check
    min_age = rules.get("min_age", 18)
    max_age = rules.get("max_age", 65)
    user_age = profile.get("age")
    if not user_age:
        missing_info.append("Applicant age is missing.")
    elif user_age < min_age or user_age > max_age:
        failed_rules.append(f"Applicant age ({user_age}) must be between {min_age} and {max_age} years.")
    else:
        matched_rules.append(f"Applicant age ({user_age}) is within the eligible range ({min_age}-{max_age}).")

    # 4. Social Category check
    allowed_categories = rules.get("categories", [])
    user_category = profile.get("social_category")
    if not user_category:
        missing_info.append("Social category is missing.")
    elif allowed_categories and user_category.lower() not in [c.lower() for c in allowed_categories]:
        failed_rules.append(f"Scheme targets {', '.join(allowed_categories)} categories.")
    else:
        matched_rules.append(f"Category ({user_category}) is eligible.")

    # 5. Geographic Area check
    allowed_areas = rules.get("areas", [])
    user_area = profile.get("area")
    if not user_area:
        missing_info.append("Residential area type (rural/urban) is missing.")
    elif allowed_areas and user_area.lower() not in [a.lower() for a in allowed_areas]:
        failed_rules.append(f"Scheme is limited to {', '.join(allowed_areas)} areas.")
    else:
        matched_rules.append(f"Location area ({user_area}) matches scheme criteria.")

    # 6. SHG Membership check
    requires_shg = rules.get("requires_shg_membership", False)
    is_shg = profile.get("is_shg_member", False)
    min_shg_tenure = rules.get("min_shg_tenure_months", 0)
    user_shg_tenure = profile.get("shg_tenure_months", 0)

    if requires_shg:
        if not is_shg:
            failed_rules.append("Requires active Self Help Group (SHG) membership.")
        else:
            if min_shg_tenure > 0 and user_shg_tenure < min_shg_tenure:
                failed_rules.append(f"Requires at least {min_shg_tenure} months SHG membership (current: {user_shg_tenure} months).")
            else:
                matched_rules.append("Meets SHG membership and tenure requirements.")
    else:
        matched_rules.append("No mandatory SHG requirement.")

    # 7. Bank Account check
    requires_bank = rules.get("requires_bank_account", True)
    if requires_bank:
        if not profile.get("has_bank_account", False):
            failed_rules.append("Active savings bank account is mandatory for loan direct-disbursement.")
        else:
            matched_rules.append("Possesses active bank account for DBT/disbursement.")

    # 8. Aadhaar check
    requires_aadhaar = rules.get("requires_aadhaar", True)
    if requires_aadhaar:
        if not profile.get("has_aadhaar", False):
            failed_rules.append("Aadhaar identity card is required.")
        else:
            matched_rules.append("Aadhaar verification available.")

    # 9. Default history check
    allows_default = rules.get("allows_existing_default", False)
    has_default = profile.get("has_default_history", False)
    if not allows_default and has_default:
        failed_rules.append("Applicants with previous unresolved default history cannot qualify.")
    else:
        matched_rules.append("No disqualifying loan defaults on record.")

    # 10. Business stage & type check
    business = profile.get("business") or {}
    biz_stage = business.get("stage", "idea")
    is_new = business.get("is_new_business", True)

    existing_required = rules.get("existing_business_required", False)
    new_allowed = rules.get("new_business_allowed", True)

    if existing_required and (biz_stage == "idea" or is_new):
        failed_rules.append("Scheme requires an established, operational enterprise. Idea-stage projects not accepted.")
    elif not new_allowed and is_new:
        failed_rules.append("Scheme is reserved for existing enterprise modernization or expansion.")
    else:
        matched_rules.append("Business stage is accepted under scheme guidelines.")

    # 11. Credit score check (if applicable)
    min_credit_score = rules.get("min_credit_score")
    user_credit_score = profile.get("credit_score")
    if min_credit_score:
        if user_credit_score is None:
            missing_info.append("Credit score (CIBIL) is not provided.")
        elif user_credit_score < min_credit_score:
            failed_rules.append(f"Credit score ({user_credit_score}) is below minimum requirement of {min_credit_score}.")
        else:
            matched_rules.append(f"Credit score ({user_credit_score}) meets threshold.")

    # 12. Income Ceiling check
    max_annual_income = rules.get("max_annual_income")
    annual_income = float(profile.get("monthly_income") or 0.0) * 12.0
    if max_annual_income:
        if annual_income > max_annual_income:
            failed_rules.append(f"Annual household income (₹{annual_income:,.0f}) exceeds the cap of ₹{max_annual_income:,.0f}.")
        else:
            matched_rules.append(f"Household income is below the maximum limit of ₹{max_annual_income:,.0f}.")

    # 13. Loan Amount Range
    loan_min = float(scheme.get("loan_min", 10000.0))
    loan_max = float(scheme.get("loan_max", 1000000.0))
    suggested_amount = requested_amount
    if requested_amount < loan_min:
        suggested_amount = loan_min
        failed_rules.append(f"Requested amount ₹{requested_amount:,.0f} is below scheme minimum of ₹{loan_min:,.0f}.")
    elif requested_amount > loan_max:
        suggested_amount = loan_max
        failed_rules.append(f"Requested amount ₹{requested_amount:,.0f} exceeds scheme maximum of ₹{loan_max:,.0f}.")
    else:
        matched_rules.append(f"Requested loan amount is within scheme limits (₹{loan_min:,.0f} - ₹{loan_max:,.0f}).")

    # Final Verdict Logic
    if len(failed_rules) > 0:
        verdict = "NOT_ELIGIBLE"
    elif len(missing_info) > 0:
        verdict = "MAYBE"
    else:
        verdict = "ELIGIBLE"

    # Repayment assessment
    interest_rate_used = float(scheme.get("interest_rate_min", 9.0))
    repayment = evaluate_repayment_capacity(
        profile=profile,
        requested_amount=requested_amount,
        tenure_months=tenure_months,
        annual_rate=interest_rate_used
    )

    return {
        "scheme_id": str(scheme.get("_id") or scheme.get("id") or ""),
        "scheme_name": scheme.get("name", ""),
        "short_name": scheme.get("short_name", ""),
        "provider": scheme.get("provider", ""),
        "verdict": verdict,
        "matched_rules": matched_rules,
        "failed_rules": failed_rules,
        "missing_info": missing_info,
        "suggested_amount": suggested_amount,
        "interest_rate_used": interest_rate_used,
        "emi": repayment["emi"],
        "repayment": repayment
    }
