"""
Landfall Gemini 2.0 Flash Integration Adapter
Bridges conversational financial questions to Google's Gemini 2.0 Flash model.
Follows the core design principle: 'Model plans & explains; code decides.'

If GOOGLE_API_KEY / GEMINI_API_KEY is available, generates grounded AI explanations.
If no key is present or in offline demo mode, falls back to deterministic rulebook responses.
"""
import os
import re
from typing import Dict, Any, Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Check for API key in environment
API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
_model_instance = None
_genai_available = False

try:
    import google.generativeai as genai
    _genai_available = True
    if API_KEY and len(API_KEY.strip()) > 5:
        genai.configure(api_key=API_KEY.strip(), transport="rest")
        _model_instance = genai.GenerativeModel(
            model_name="models/gemini-3.8-flash",
            system_instruction=(
                "You are Landfall AI, a specialized cross-border financial landing assistant for "
                "international students arriving in mainland China (specifically Priya, 22, Master's student "
                "from Mumbai arriving at Shenzhen University). "
                "All payments in this environment are simulated. Never claim real money moves. "
                "Always cite relevant China rulebook codes in brackets, such as [RB-CN-PSB-01] for PSB alien registration, "
                "[RB-CN-BANK-01] for bank account onboarding, [RB-CN-TUI-01] for CNAPS tuition settlement, "
                "[RB-CN-SAFE-01] for SAFE inbound remittance limits, and [RB-CN-SCAM-01] for fraud defense. "
                "Be encouraging, concise, highly structured, and grounded."
            )
        )
except Exception as e:
    _model_instance = None

def is_gemini_active() -> bool:
    """Return True if Gemini is configured with an API key."""
    return bool(_genai_available and _model_instance is not None and API_KEY)

async def generate_response(message: str, context: Optional[str] = None) -> Dict[str, Any]:
    """
    Generate conversational advice using Gemini 3.8 Flash, with seamless fallback
    to deterministic rule responses in offline/demo mode or on network timeout.
    """
    global _model_instance

    # 1. If Gemini is configured and active, invoke Gemini with short timeout
    if is_gemini_active():
        try:
            prompt = f"Student message: {message}"
            if context:
                prompt += f"\nContext: {context}"
            
            response = _model_instance.generate_content(prompt, request_options={"timeout": 3.5})
            if response and response.text:
                return {
                    "text": response.text,
                    "model": "gemini-3.8-flash",
                    "is_live_llm": True
                }
        except Exception:
            # Seamless fallback to deterministic responses on network/quota/timeout issues
            pass

    # 2. Deterministic Fallback Mode (100% reliable offline demo)
    name = "Priya"
    if context and "Student: " in context:
        try:
            name = context.split("Student: ")[1].split(" ")[0].strip()
        except Exception:
            name = "Priya"

    msg = message.lower()
    if any(w in msg for w in ["scam", "suspicious", "discount", "agent offer"]):
        text = "🛡 **Scam Shield activated.** I've analyzed the message. Please paste the suspicious text and I'll run a full signal analysis. Every payment must go directly to the university's official CNAPS account. [RB-CN-SCAM-01] [RB-CN-TUI-01]"
    elif any(w in msg for w in ["tuition", "pay", "transfer", "send money"]):
        text = "💳 **Tuition Payment Flow.** I'll verify the payee first, then compare routes (SWIFT, UnionPay, WeChat Pay) and build your transfer ladder. Payee must be verified in the registry before any payment can proceed. [RB-CN-TUI-01]"
    elif any(w in msg for w in ["bank", "account", "icbc", "boc", "cmb"]):
        text = "🏦 **Bank Account Setup.** You'll need: Passport, X1 Student Visa, PSB Registration Certificate (within 30 days of arrival), and Enrollment Certificate. ICBC minimum deposit: ¥20. Bank of China: ¥0. [RB-CN-BANK-01] [RB-CN-PSB-01]"
    elif any(w in msg for w in ["credit", "pboc", "history", "card"]):
        text = "📈 **Credit Path.** 6 steps from debit card to your first PBOC Credit Reference Report. Step 1: Open bank account. Step 4: Secured credit card after 3 months. No score predictions — only cited milestones. [RB-CN-CR-01]"
    elif any(w in msg for w in ["fx", "rate", "exchange", "inr", "cny", "myr", "usd", "eur"]):
        text = "💱 **FX & Routes.** Current mid-market rates loaded. I can compare international routes and build a transfer ladder to minimize regret across FX scenarios. I do not predict exchange rates. [RB-CN-FX-01]"
    elif any(w in msg for w in ["plan", "critical", "timeline", "deadline"]):
        text = "📋 **Critical Path Plan generated.** 8 milestones from arrival to your first PBOC report. PSB registration is time-critical (30 days). Tuition has 7 days slack. [RB-CN-PSB-01]"
    elif any(w in msg for w in ["safe", "limit", "50000", "report"]):
        text = "⚠️ **SAFE Reporting.** Inbound remittances above USD 50,000/year equivalent require SAFE reporting. I'll track your cumulative inbound and warn you before you cross the threshold. [RB-CN-SAFE-01]"
    elif any(w in msg for w in ["hello", "hi", "start", "priya", "begin", "hey"]):
        text = f"👋 **Welcome to Landfall, {name}!** I've built your financial landing plan for Shenzhen. We've got 6 weeks before arrival. Your critical path has 8 milestones. PSB registration is the first critical task — it unlocks everything else. Shall we look at your tuition payment or set up your bank account first?"
    else:
        text = "🤖 **Landfall AI Agent** — I can help with: tuition payee verification, remittance route comparison, FX shock planning, bank account setup, document checklist, credit milestones, and scam detection. What would you like to explore?"

    return {
        "text": text,
        "model": "deterministic-engine (gemini-ready)",
        "is_live_llm": False
    }
