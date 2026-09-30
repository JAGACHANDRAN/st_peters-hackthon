def calculate_emi(principal: float, annual_rate: float, tenure_months: int) -> float:
    """
    Standard Equated Monthly Installment (EMI) Formula:
    EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
    where:
      P = principal loan amount
      r = monthly interest rate = annual_rate / 12 / 100
      n = tenure in months
    Handles r = 0 (interest-free / subsidized loans) gracefully.
    """
    if principal <= 0 or tenure_months <= 0:
        return 0.0

    if annual_rate <= 0:
        return round(principal / tenure_months, 2)

    r = annual_rate / 12.0 / 100.0
    factor = (1.0 + r) ** tenure_months
    emi = principal * r * factor / (factor - 1.0)
    return round(emi, 2)


def max_loan_for_emi(safe_emi: float, annual_rate: float, tenure_months: int) -> float:
    """
    Inverts the EMI formula to find maximum loan principal for a given safe EMI:
    P = safe_emi * ((1 + r)^n - 1) / (r * (1 + r)^n)
    """
    if safe_emi <= 0 or tenure_months <= 0:
        return 0.0

    if annual_rate <= 0:
        return round(safe_emi * tenure_months, 2)

    r = annual_rate / 12.0 / 100.0
    factor = (1.0 + r) ** tenure_months
    principal = safe_emi * (factor - 1.0) / (r * factor)
    return round(principal, 2)
