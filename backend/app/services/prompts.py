from typing import Dict, Any, List
from app.models.schemas import AIExplanation

ADVISOR_SYSTEM_PROMPT = (
    "You are a friendly financial guide for rural women entrepreneurs in India. "
    "Use very simple words and short sentences. You only explain the numbers and results given to you; "
    "never invent interest rates, scheme names or eligibility. If information is missing, say what is missing. "
    "Never promise approval or guaranteed returns. Never ask for a PIN, OTP, Aadhaar number or password. "
    "Tell the user that the bank or scheme authority makes the final decision. "
    "Warn gently about fraud and unauthorised lenders. "
    "If the question is unrelated to money, business or these schemes, politely redirect."
)

def build_eligibility_explanation_prompt(scheme_data: Dict[str, Any], repayment_data: Dict[str, Any]) -> str:
    return f"""
Explain this loan scheme eligibility and EMI result for a rural woman entrepreneur in simple, encouraging words.
Scheme: {scheme_data.get('scheme_name')}
Verdict: {scheme_data.get('verdict')}
Monthly EMI: Rs. {repayment_data.get('emi')}
Repayment Affordability: {repayment_data.get('verdict')}
Matched Points: {scheme_data.get('matched_rules', [])[:3]}
Failed Points: {scheme_data.get('failed_rules', [])[:3]}
Missing Information: {scheme_data.get('missing_info', [])}
Suggestions: {repayment_data.get('suggestions', [])[:2]}

Respond with strict JSON adhering to this schema:
{{
  "summary": "1 or 2 very simple sentences summarizing whether this loan fits her situation",
  "why": ["up to 3 short bullet points in plain words explaining why"],
  "next_steps": ["up to 3 concrete next action steps"],
  "warning": "Short cautionary note about official bank approval or null if none"
}}
"""

def generate_template_fallback_explanation(scheme_data: Dict[str, Any], repayment_data: Dict[str, Any]) -> AIExplanation:
    verdict = scheme_data.get("verdict", "MAYBE")
    repay_verdict = repayment_data.get("verdict", "TIGHT")
    emi = repayment_data.get("emi", 0)

    if verdict == "ELIGIBLE":
        summary = f"You match the key criteria for {scheme_data.get('scheme_name')}. The estimated EMI is ₹{emi:,.0f} per month ({repay_verdict.lower()})."
        why = scheme_data.get("matched_rules", [])[:3] or ["You meet the criteria for this scheme."]
        next_steps = [
            "Collect your Aadhaar, bank passbook, and business plan.",
            "Visit your nearest public sector bank branch or SHG federation.",
            "Confirm current interest rates and submit the scheme application."
        ]
    elif verdict == "MAYBE":
        summary = f"You may qualify for {scheme_data.get('scheme_name')}, but some details in your profile are incomplete."
        why = scheme_data.get("missing_info", [])[:3] or ["A few profile details need to be completed."]
        next_steps = [
            "Update missing profile details in the platform.",
            "Speak with your SHG secretary or bank mitro.",
            "Verify documentation requirements before applying."
        ]
    else:  # NOT_ELIGIBLE
        summary = f"You do not currently meet the official guidelines for {scheme_data.get('scheme_name')}."
        why = scheme_data.get("failed_rules", [])[:3] or ["Criteria requirements not satisfied."]
        next_steps = [
            "Review alternative schemes suited for your profile.",
            "Focus on strengthening your business track record.",
            "Consult with local district enterprise officers or SHG leaders."
        ]

    warning = "Guidance only. Final eligibility, interest rate and approval are decided by the bank or scheme authority."
    return AIExplanation(
        summary=summary,
        why=why,
        next_steps=next_steps,
        warning=warning
    )
