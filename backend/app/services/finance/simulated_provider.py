import uuid
from typing import Dict, Any


class SimulatedPaymentProvider:
    @staticmethod
    def process_payment(amount: float, destination: str, simulate_failure: bool = False) -> Dict[str, Any]:
        """
        Simulates payment gateway transaction verification.
        Default is SUCCESS; returns FAILED if simulate_failure is True.
        """
        if simulate_failure:
            return {
                "status": "FAILED",
                "code": "ERR_SIMULATED_REJECTION",
                "reason": "Simulated payment failure triggered by user for testing."
            }

        ref = f"SIM_PAY_{uuid.uuid4().hex[:10].upper()}"
        return {
            "status": "SUCCESS",
            "provider_ref": ref,
            "reason": None
        }
