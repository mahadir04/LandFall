"""
Landfall Gemini Flash Integration Adapter
Bridges conversational financial questions to Google's Gemini models with context awareness.
Follows the core design principle: 'Model plans & explains; code decides.'

If GOOGLE_API_KEY / GEMINI_API_KEY is available, generates grounded AI explanations.
If no key is present or on network timeout, falls back to an intelligent, context-aware deterministic engine.
"""
import os
import re
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
    # Also load from parent dirs if needed
    for env_path in [
        os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
        os.path.join(os.path.dirname(__file__), "..", ".env"),
    ]:
        if os.path.exists(env_path):
            load_dotenv(env_path)
except ImportError:
    pass

API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

# Candidate models in order of latency and availability
CANDIDATE_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-latest",
]

def is_gemini_active() -> bool:
    """Return True if Gemini is configured with a valid API key."""
    return bool(API_KEY and len(API_KEY.strip()) > 10)

def _extract_profile_info(context: Optional[str]) -> Dict[str, str]:
    """Parse profile information from the context string."""
    info = {
        "name": "Student",
        "home_city": "Origin",
        "home_country": "Home",
        "home_currency": "USD",
        "home_symbol": "$",
        "host_university": "Shenzhen University",
        "host_city": "Shenzhen",
        "budget_cny": "50000",
    }
    if not context:
        return info

    name_m = re.search(r"Student:\s*([^,\n(]+)", context)
    if name_m:
        info["name"] = name_m.group(1).replace("from", "").strip()

    city_m = re.search(r"from\s*([^,\n]+)", context)
    if city_m:
        info["home_city"] = city_m.group(1).strip()

    country_m = re.search(r"from\s*[^,]+,\s*([^,\n(]+)", context)
    if country_m:
        info["home_country"] = country_m.group(1).strip()

    cur_m = re.search(r"Currency:\s*([A-Z]{3})\s*([^)\n]*)", context)
    if cur_m:
        info["home_currency"] = cur_m.group(1).strip()
        info["home_symbol"] = cur_m.group(2).strip() or cur_m.group(1)

    dest_m = re.search(r"Destination:\s*([^,\n]+)", context)
    if dest_m:
        info["host_university"] = dest_m.group(1).strip()

    budget_m = re.search(r"Budget:\s*(?:¥|CNY)?\s*(\d[\d,]*)", context)
    if budget_m:
        info["budget_cny"] = budget_m.group(1).replace(",", "").strip()

    return info

def _call_gemini_rest(prompt: str, system_instruction: str, timeout: float = 9.0) -> Optional[Dict[str, Any]]:
    """Call Gemini REST API directly with candidate model fallback."""
    if not is_gemini_active():
        return None

    key = API_KEY.strip()
    
    for model in CANDIDATE_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "systemInstruction": {
                "parts": [{"text": system_instruction}]
            },
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 900
            }
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        text = "".join(p.get("text", "") for p in parts if "text" in p).strip()
                        if text:
                            return {
                                "text": text,
                                "model": model,
                                "is_live_llm": True
                            }
        except Exception:
            # Try next model in candidate list
            continue

    return None

async def generate_response(message: str, context: Optional[str] = None) -> Dict[str, Any]:
    """
    Generate conversational advice using Gemini Flash, with seamless fallback
    to an intelligent, context-aware rulebook engine.
    """
    prof = _extract_profile_info(context)
    name = prof["name"]
    cur = prof["home_currency"]
    sym = prof["home_symbol"]
    univ = prof["host_university"]
    city = prof["host_city"]
    origin = f"{prof['home_city']}, {prof['home_country']}"

    # 1. Attempt live LLM generation with personalized system prompt
    if is_gemini_active():
        system_instruction = (
            f"You are Landfall AI, a specialized cross-border financial landing assistant for international students in China. "
            f"Current user profile: {name} traveling from {origin} to {univ} in {city}, China. "
            f"Home Currency: {cur} ({sym}). "
            f"All payments and transfers in this application are simulated sandbox operations. Never claim real money is moving. "
            f"Always cite relevant China rulebook codes in brackets where applicable: "
            f"[RB-CN-PSB-01] for PSB Foreigner Accommodation Registration (within 24h of arrival/new residence), "
            f"[RB-CN-BANK-01] for Chinese bank account setup (ICBC, Bank of China, CMB), "
            f"[RB-CN-TUI-01] for university CNAPS tuition settlement, "
            f"[RB-CN-SAFE-01] for SAFE inbound remittance threshold ($50,000/yr), "
            f"[RB-CN-CR-01] for PBOC credit path milestones, "
            f"[RB-CN-SCAM-01] for scam defense against unofficial FX swaps and payment brokers. "
            f"When discussing budgets or expenses, provide realistic amounts in both CNY (¥) and the student's home currency {cur} ({sym}). "
            f"Be encouraging, highly structured, concise, and practically grounded."
        )

        full_prompt = f"Student Profile & Situation Context:\n{context or 'No additional context'}\n\nStudent Question:\n{message}"
        llm_result = _call_gemini_rest(full_prompt, system_instruction, timeout=9.0)
        if llm_result and llm_result.get("text"):
            return llm_result

    # 2. Context-Aware Deterministic Fallback Engine
    msg = message.lower()

    if any(w in msg for w in ["next big cost", "big cost", "upcoming cost", "next cost", "hidden cost", "what cost", "expensive", "how much will it cost"]):
        text = (
            f"💰 **Next Big Financial Outlays for {name} at {univ}:**\n\n"
            f"After your initial tuition fee, the most significant immediate expenses upon landing in {city} are:\n\n"
            f"1. **Accommodation & Security Deposit (押一付三):**\n"
            f"   • On-campus dorms: ¥3,000 – ¥8,000/semester.\n"
            f"   • Off-campus apartments standardly require **1 month deposit + 3 months rent upfront**: approx. ¥6,000 – ¥15,000 (≈ {sym}2.5x–5x in {cur}). [RB-CN-PSB-01]\n\n"
            f"2. **Physical Examination & Residence Permit:**\n"
            f"   • Shenzhen International Travel Healthcare Center medical check: ≈ ¥400 – ¥600.\n"
            f"   • Exit-Entry PSB 1–2 Year Student Residence Permit fee: ≈ ¥400 – ¥800. [RB-CN-PSB-01]\n\n"
            f"3. **Living Setup & Tech Essentials:**\n"
            f"   • China Mobile/Unicom SIM card package: ≈ ¥100 – ¥200/month.\n"
            f"   • Bedding, appliances & campus card deposit: ≈ ¥600 – ¥1,200.\n\n"
            f"💡 *Recommendation:* Keep an emergency buffer of at least ¥4,000–¥6,000 in your ICBC/BOC account before committing to optional purchases. [RB-CN-BANK-01]"
        )
    elif any(w in msg for w in ["scam", "suspicious", "discount", "agent offer", "broker", "black market", "telegram"]):
        text = (
            f"🛡 **Scam Shield Alert for {name}:**\n\n"
            f"Never use unofficial agents, Telegram groups, or social media brokers offering 'discounted tuition' or 'cheap CNY exchange'. "
            f"Official university tuition settlement must only be dispatched to the verified CNAPS account of **{univ}**. "
            f"Third-party cross-border transfers risk having your Chinese bank account frozen under China's Anti-Telecom Fraud Law. [RB-CN-SCAM-01] [RB-CN-TUI-01]"
        )
    elif any(w in msg for w in ["tuition", "pay tuition", "transfer tuition", "cnaps", "settle"]):
        text = (
            f"🎓 **Tuition Settlement for {univ}:**\n\n"
            f"1. **Payee Verification:** Confirm university CNAPS bank routing code in the registry. [RB-CN-TUI-01]\n"
            f"2. **Route Comparison:** Compare SWIFT Wire, UnionPay Cross-Border, and Flywire/WeChat Outbound.\n"
            f"3. **FX Tranche Ladder:** Disperse large transfers across multiple tranches to minimize FX volatility shock from {cur} to CNY. [RB-CN-SAFE-01]"
        )
    elif any(w in msg for w in ["bank", "account", "icbc", "boc", "cmb", "debit"]):
        text = (
            f"🏦 **Bank Account Onboarding ({city}):**\n\n"
            f"To open an account at ICBC or Bank of China near {univ}, you must present:\n"
            f"• Original Passport with valid X1/X2 student visa\n"
            f"• Admission Notice & JW201/JW202 Certificate\n"
            f"• PSB Accommodation Registration Slip (issued within 24h of checking into your dorm/apartment) [RB-CN-PSB-01]\n"
            f"• Registered Chinese mobile number (+86) linked to your legal name. [RB-CN-BANK-01]"
        )
    elif any(w in msg for w in ["credit", "pboc", "history", "card", "score"]):
        text = (
            f"📈 **PBOC Credit Path for {name}:**\n\n"
            f"China's credit reference is managed by the People's Bank of China (PBOC). International students build credit through 6 milestones:\n"
            f"1. Open tier-1 debit account (ICBC/BOC)\n"
            f"2. Link to WeChat Pay & Alipay Real-Name identity\n"
            f"3. Maintain 3+ months of on-time utility and telecom payments\n"
            f"4. Apply for a secured student credit card with your host branch. [RB-CN-CR-01]"
        )
    elif any(w in msg for w in ["fx", "rate", "exchange", "convert", "inr", "bdt", "myr", "usd", "cny"]):
        text = (
            f"💱 **FX Strategy ({cur} ➔ CNY):**\n\n"
            f"Current live rates and 30-day volatility metrics are loaded. For large expenses like tuition and rent, avoid converting your entire semester budget in one day. "
            f"Use a multi-tranche ladder to smooth out exchange rate shocks. Remittances under USD 50,000/year equivalent do not require special SAFE approval. [RB-CN-FX-01] [RB-CN-SAFE-01]"
        )
    elif any(w in msg for w in ["psb", "police", "registration", "24 hours", "residence permit"]):
        text = (
            f"📋 **PSB Registration Requirement [RB-CN-PSB-01]:**\n\n"
            f"Under Article 39 of the Exit and Entry Administration Law of the PRC, foreigners must register accommodation within **24 hours** of arrival. "
            f"If staying in {univ}'s international dormitory, the front desk automatically submits this. If renting off-campus, you and your landlord must register at the local police station or via the Shenzhen Municipal Public Security Bureau online mini-program."
        )
    elif any(w in msg for w in ["budget", "monthly", "living cost", "food", "dining"]):
        text = (
            f"📊 **Monthly Living Budget at {univ}:**\n\n"
            f"Average student expenses in Shenzhen:\n"
            f"• Campus Canteen: ¥800 – ¥1,500/month\n"
            f"• Off-campus Dining & Social: ¥1,000 – ¥2,000/month\n"
            f"• Metro / Transit (Shenzhen Tong): ¥150 – ¥300/month\n"
            f"• Mobile Data & Utilities: ¥120 – ¥250/month\n"
            f"Total estimated baseline: **¥2,500 – ¥4,500/month** (excluding rent). [RB-CN-BANK-01]"
        )
    elif any(w in msg for w in ["hello", "hi", "start", "begin", "hey"]):
        text = (
            f"👋 **Welcome to Landfall, {name}!**\n\n"
            f"I have initialized your financial landing plan for **{univ}** in {city}. "
            f"Your origin currency is **{cur} ({sym})**. "
            f"How can I assist you today? I can help with upcoming expenses, tuition CNAPS verification, ICBC bank setup, or scam detection."
        )
    else:
        text = (
            f"🤖 **Landfall AI Advisor for {name} ({univ}):**\n\n"
            f"I'm calibrated to your profile (traveling from {origin}, budget in {cur} & CNY). "
            f"I can provide detailed guidance on:\n"
            f"• **Upcoming landing costs & budget allocation** [RB-CN-BANK-01]\n"
            f"• **Tuition CNAPS payee verification & route comparison** [RB-CN-TUI-01]\n"
            f"• **PSB 24-hour accommodation registration** [RB-CN-PSB-01]\n"
            f"• **Opening ICBC / Bank of China student accounts** [RB-CN-BANK-01]\n"
            f"• **Scam Shield & payment link safety checks** [RB-CN-SCAM-01]\n\n"
            f"Feel free to ask any question about your arrival in {city}!"
        )

    return {
        "text": text,
        "model": "context-deterministic-engine",
        "is_live_llm": False
    }
