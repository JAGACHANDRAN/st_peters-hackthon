import pytest
from app.services.finance.emi import calculate_emi, max_loan_for_emi


def test_calculate_emi_standard():
    # Principal: 50,000, Rate: 12% p.a., Tenure: 24 months
    # r = 1% per month = 0.01
    # factor = (1.01)^24 = 1.2697346
    # EMI = 50000 * 0.01 * 1.2697346 / 0.2697346 = 2353.67
    emi = calculate_emi(50000.0, 12.0, 24)
    assert round(emi, 1) == 2353.7


def test_calculate_emi_zero_interest():
    # 0% subsidized loan: 24,000 over 24 months -> 1000/month
    emi = calculate_emi(24000.0, 0.0, 24)
    assert emi == 1000.0


def test_calculate_emi_invalid_inputs():
    assert calculate_emi(0, 10.0, 12) == 0.0
    assert calculate_emi(50000, 10.0, 0) == 0.0
    assert calculate_emi(-1000, 10.0, 12) == 0.0


def test_max_loan_for_emi_roundtrip():
    principal = 60000.0
    rate = 9.0
    tenure = 36
    emi = calculate_emi(principal, rate, tenure)
    derived_principal = max_loan_for_emi(emi, rate, tenure)
    # Check derived principal is within 1 rupee due to rounding
    assert abs(derived_principal - principal) < 2.0


def test_max_loan_for_emi_zero_rate():
    safe_emi = 1500.0
    tenure = 20
    derived = max_loan_for_emi(safe_emi, 0.0, tenure)
    assert derived == 30000.0
