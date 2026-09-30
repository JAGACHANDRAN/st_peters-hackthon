import pytest
from app.services.finance.repayment import evaluate_repayment_capacity


@pytest.fixture
def lakshmi_profile():
    return {
        "monthly_income": 8000.0,
        "monthly_household_expense": 5000.0,
        "monthly_other_expense": 1000.0,
        "existing_loans": [],
        "income_stability": "regular",
        "is_shg_member": True,
        "business": {
            "type": "dairy",
            "stage": "idea",
            "is_new_business": True,
            "expected_monthly_revenue": 5000.0,
            "expected_monthly_cost": 2000.0
        }
    }


def test_lakshmi_repayment_evaluation(lakshmi_profile):
    # Disposable: 8000 - 5000 - 1000 = 2000
    # Business net: (5000 - 2000) * 0.7 = 2100
    # Available for EMI: 2000 + 2100 = 4100
    # Safe max EMI: 4100 * 0.5 * 1.0 = 2050
    # Request: 50,000 for 24 months at 9%
    result = evaluate_repayment_capacity(
        profile=lakshmi_profile,
        requested_amount=50000.0,
        tenure_months=24,
        annual_rate=9.0
    )
    assert result["disposable_income"] == 2000.0
    assert result["business_net"] == 2100.0
    assert result["available_for_emi"] == 4100.0
    assert result["safe_max_emi"] == 2050.0
    # EMI for 50k @ 9% for 24m is ~2284.24, which is > 2050 and <= 4100 -> RISKY
    assert result["verdict"] == "RISKY"
    assert len(result["suggestions"]) > 0


def test_changing_income_changes_verdict(lakshmi_profile):
    # Increase Lakshmi's income to 15,000
    high_income_profile = dict(lakshmi_profile)
    high_income_profile["monthly_income"] = 15000.0

    result = evaluate_repayment_capacity(
        profile=high_income_profile,
        requested_amount=50000.0,
        tenure_months=24,
        annual_rate=9.0
    )
    # Available for EMI is significantly higher -> COMFORTABLE
    assert result["verdict"] == "COMFORTABLE"


def test_unaffordable_loan(lakshmi_profile):
    # Lakshmi requests 3,00,000 over 12 months -> EMI ~ 26,000 > 4100 available -> NOT_AFFORDABLE
    result = evaluate_repayment_capacity(
        profile=lakshmi_profile,
        requested_amount=300000.0,
        tenure_months=12,
        annual_rate=12.0
    )
    assert result["verdict"] == "NOT_AFFORDABLE"
