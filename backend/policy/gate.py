"""
Policy Gate - Permission Tiers and Enforcement
Implements Landfall's 4-tier permission model:
- T1 (Query/Explain): Read-only, no authorization needed
- T2 (Draft/Recommend): Non-binding drafts, low risk
- T3 (Execute Simulated): Single-use confirmation token required, bounded parameters
- T4 (Execute Real): STRICTLY FORBIDDEN (No real money moves)
"""
from typing import Dict, Any, Optional
import uuid
from datetime import datetime, timedelta

class PolicyGateError(Exception):
    def __init__(self, message: str, tier: str, code: int = 403):
        super().__init__(message)
        self.message = message
        self.tier = tier
        self.code = code

class PolicyGate:
    def __init__(self):
        self.tokens: Dict[str, Dict[str, Any]] = {}

    def issue_token(self, payee_id: str, amount: float, currency: str, date: str, ttl_minutes: int = 15) -> str:
        """Issue single-use cryptographic confirmation token for T3 execution."""
        token = f"T3-{str(uuid.uuid4())[:8].upper()}"
        expires_at = datetime.utcnow() + timedelta(minutes=ttl_minutes)
        self.tokens[token] = {
            "token": token,
            "payee_id": payee_id,
            "amount": amount,
            "currency": currency,
            "date": date,
            "used": False,
            "expires_at": expires_at,
            "created_at": datetime.utcnow()
        }
        return token

    def verify_token(self, token: str) -> Dict[str, Any]:
        """Validate single-use token; enforce that it has not been used or expired."""
        record = self.tokens.get(token)
        if not record:
            raise PolicyGateError("Invalid or non-existent confirmation token.", tier="T3", code=403)
        if record["used"]:
            raise PolicyGateError("Confirmation token has already been consumed (single-use policy).", tier="T3", code=403)
        if datetime.utcnow() > record["expires_at"]:
            raise PolicyGateError("Confirmation token has expired.", tier="T3", code=403)
        
        record["used"] = True
        return record

    def check_execution_tier(self, action: str, is_real_money: bool = False) -> str:
        """Enforce strict prevention of real money execution (T4 Forbidden)."""
        if is_real_money:
            raise PolicyGateError("T4 Real execution is strictly prohibited by Landfall policy gate.", tier="T4", code=403)
        return "T3_ALLOWED"

gate = PolicyGate()
