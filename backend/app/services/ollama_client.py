import json
import logging
import httpx
from typing import List, Dict, Any, Optional

from app.core.config import settings
from app.models.schemas import AIExplanation
from app.services.prompts import (
    ADVISOR_SYSTEM_PROMPT,
    build_eligibility_explanation_prompt,
    generate_template_fallback_explanation
)

logger = logging.getLogger(__name__)


async def call_ollama_chat(
    messages: List[Dict[str, str]],
    format_json: bool = False,
    max_retries: int = 2,
    timeout_seconds: float = 30.0
) -> Optional[str]:
    """
    Calls Ollama Cloud/Local API with retries and timeout.
    Returns response text or None if unreachable.
    """
    if not settings.OLLAMA_BASE_URL:
        return None

    url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/chat"
    headers = {"Content-Type": "application/json"}
    if settings.OLLAMA_API_KEY:
        headers["Authorization"] = f"Bearer {settings.OLLAMA_API_KEY}"

    payload: Dict[str, Any] = {
        "model": settings.OLLAMA_MODEL,
        "messages": messages,
        "stream": False
    }
    if format_json:
        payload["format"] = "json"

    for attempt in range(max_retries + 1):
        try:
            async with httpx.AsyncClient(timeout=timeout_seconds) as client:
                resp = await client.post(url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    msg = data.get("message", {}).get("content", "")
                    if msg:
                        return msg
                else:
                    logger.warning(f"Ollama API returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.warning(f"Ollama call attempt {attempt + 1} failed: {e}")

    return None


async def explain_scheme_eligibility(
    scheme_data: Dict[str, Any],
    repayment_data: Dict[str, Any]
) -> AIExplanation:
    """
    Generates plain-language explanation for scheme match/rejection.
    Validates output with Pydantic; falls back to template if unreachable or invalid.
    """
    prompt = build_eligibility_explanation_prompt(scheme_data, repayment_data)
    messages = [
        {"role": "system", "content": ADVISOR_SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]

    raw_response = await call_ollama_chat(messages, format_json=True)
    if raw_response:
        try:
            parsed = json.loads(raw_response)
            return AIExplanation(**parsed)
        except Exception as e:
            logger.warning(f"Failed to parse LLM structured explanation: {e}. Using fallback.")

    # Fallback template
    return generate_template_fallback_explanation(scheme_data, repayment_data)


async def chat_with_advisor(
    user_message: str,
    chat_history: List[Dict[str, str]],
    user_context: Optional[Dict[str, Any]] = None
) -> str:
    """
    Generates response for conversational AI financial advisor.
    Includes sanitized context (no sensitive PII) and system guidelines.
    """
    context_prefix = ""
    if user_context:
        context_prefix = (
            f"User Context: {user_context.get('gender', 'Female')}, {user_context.get('area', 'rural')}, "
            f"State: {user_context.get('state', 'India')}, Monthly Income: Rs. {user_context.get('monthly_income', 0)}, "
            f"Business: {user_context.get('business_type', 'enterprise')}.\n"
        )

    messages = [{"role": "system", "content": ADVISOR_SYSTEM_PROMPT}]
    if context_prefix:
        messages.append({"role": "system", "content": context_prefix})

    # Append recent chat history (up to last 6 messages)
    for msg in chat_history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": user_message})

    response = await call_ollama_chat(messages)
    if response:
        return response

    # Friendly offline fallback
    return (
        "Namaste! I am your financial guide. I can help you understand your budget, savings goals, "
        "and government loan schemes like MUDRA and Stand-Up India. Remember, final approval is always "
        "given by the official bank branch. How may I support your business journey today?"
    )
