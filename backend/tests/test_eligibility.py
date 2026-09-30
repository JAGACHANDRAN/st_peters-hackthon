import pytest
from app.services.finance.eligibility import evaluate_scheme_eligibility


@pytest.fixture
def lakshmi_profile():
    return {
        "age": 32,
        "gender": "female",
        "state": "Odisha",
        "district": "Puri",
        "area": "rural",
        "social_category": "obc",
        "is_shg_member": True,
        "shg_name": "Maa Tarini SHG",
        "shg_tenure_months": 18,
        "has_bank_account": True,
        "has_aadhaar": True,
        "has_default_history": False,
        "monthly_income": 8000.0,
        "monthly_household_expense": 5000.0,
        "monthly_other_expense": 1000.0,
        "business": {
            "type": "dairy",
            "stage": "idea",
            "is_new_business": True,
            "expected_monthly_revenue": 5000.0,
            "expected_monthly_cost": 2000.0
        }
    }


@pytest.fixture
def rural_women_dairy_scheme():
    return {
        "id": "scheme-101",
        "name": "NABARD Dairy Entrepreneurship Scheme",
        "short_name": "NABARD Dairy",
        "provider": "NABARD",
        "applicable_states": ["ALL"],
        "loan_min": 10000.0,
        "loan_max": 200000.0,
        "interest_rate_min": 7.0,
        "eligibility": {
            "genders": ["female"],
            "min_age": 18,
            "max_age": 60,
            "categories": ["general", "obc", "sc", "st", "minority"],
            "areas": ["rural", "semi_urban"],
            "requires_shg_membership": True,
            "min_shg_tenure_months": 6,
            "requires_bank_account": True,
            "requires_aadhaar": True,
            "allows_existing_default": False,
            "new_business_allowed": True
        }
    }


def test_lakshmi_qualifies_for_dairy_scheme(lakshmi_profile, rural_women_dairy_scheme):
    result = evaluate_scheme_eligibility(
        profile=lakshmi_profile,
        scheme=rural_women_dairy_scheme,
        requested_amount=50000.0,
        tenure_months=24
    )
    assert result["verdict"] == "ELIGIBLE"
    assert len(result["failed_rules"]) == 0
    assert len(result["matched_rules"]) > 0


def test_disqualification_due_to_default_history(lakshmi_profile, rural_women_dairy_scheme):
    profile_with_default = dict(lakshmi_profile)
    profile_with_default["has_default_history"] = True

    result = evaluate_scheme_eligibility(
        profile=profile_with_default,
        scheme=rural_women_dairy_scheme,
        requested_amount=50000.0,
        tenure_months=24
    )
    assert result["verdict"] == "NOT_ELIGIBLE"
    assert any("default" in rule.lower() for rule in result["failed_rules"])


def test_disqualification_due_to_no_shg_membership(lakshmi_profile, rural_women_dairy_scheme):
    profile_no_shg = dict(lakshmi_profile)
    profile_no_shg["is_shg_member"] = False

    result = evaluate_scheme_eligibility(
        profile=profile_no_shg,
        scheme=rural_women_dairy_scheme,
        requested_amount=50000.0,
        tenure_months=24
    )
    assert result["verdict"] == "NOT_ELIGIBLE"
    assert any("shg" in rule.lower() for rule in result["failed_rules"])


def test_disqualification_due_to_state_mismatch(lakshmi_profile, rural_women_dairy_scheme):
    state_specific_scheme = dict(rural_women_dairy_scheme)
    state_specific_scheme["applicable_states"] = ["Gujarat", "Maharashtra"]

    result = evaluate_scheme_eligibility(
        profile=lakshmi_profile,
        scheme=state_specific_scheme,
        requested_amount=50000.0,
        tenure_months=24
    )
    assert result["verdict"] == "NOT_ELIGIBLE"
    assert any("state" in rule.lower() for rule in result["failed_rules"])
