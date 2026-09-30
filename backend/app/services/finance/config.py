# Financial Engine Configuration & Thresholds

HAIRCUT_NEW_OR_IDEA_BUSINESS = 0.30  # 30% haircut on projected business profit for new/idea stage

STABILITY_FACTOR_MAP = {
    "regular": 1.0,
    "seasonal": 0.8,
    "irregular": 0.6
}

SAFE_EMI_SHARE_OF_AVAILABLE = 0.50  # Max 50% of available cash flow after stability adjustment
COMFORTABLE_EMI_RATIO = 0.60         # EMI <= 60% of safe max EMI is COMFORTABLE

SUGGESTED_SAVINGS_MIN_PCT = 0.20     # 20% of net surplus
SUGGESTED_SAVINGS_MAX_PCT = 0.25     # 25% of net surplus
