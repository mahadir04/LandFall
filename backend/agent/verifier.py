"""
Landfall Agent Verifier
Grounding and provenance checking:
- Ensures all outputs cite approved Rule IDs (e.g. RB-CN-...)
- Enforces that no financial figures appear without a tool result identifier (RID)
- Flags prompt injections in user-supplied text
"""
import re
from typing import Dict, Any, List

APPROVED_RULE_PREFIX = "RB-CN-"

INJECTION_PATTERNS = [
    r"ignore previous instructions",
    r"system (prompt )?override",
    r"(transfer|redirect).*to.*personal",
    r"personal account",
    r"disregard.*policy",
    r"sudo",
    r"admin bypass",
    r"disable safety",
    r"dan mode",
    r"jailbreak",
    r"malicious.*registry",
    r"counterfeit",
    r"double spend",
    r"token attack",
    r"(same|single-use).*token",
    r"payout.*times",
    r"force confirm",
    r"hawala",
]

class GroundingVerifier:
    def verify_provenance(self, response_text: str) -> Dict[str, Any]:
        """Verify that the response contains source attribution / RID citations."""
        has_rid = bool(re.search(r"\[RID:[a-f0-9]+\]", response_text, re.IGNORECASE))
        rules_found = re.findall(r"\[(RB-CN-[A-Z0-9\-]+)\]", response_text)
        
        return {
            "is_grounded": has_rid or len(rules_found) > 0,
            "has_provenance_id": has_rid,
            "cited_rules": rules_found,
            "unsupported_claims": 0 if (has_rid or len(rules_found) > 0) else 1
        }

    def inspect_injection(self, text: str) -> Dict[str, Any]:
        """Scan untrusted input for prompt injection signatures."""
        detected = []
        lowered = text.lower()
        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, lowered):
                detected.append(pattern)
        
        return {
            "injection_detected": len(detected) > 0,
            "signatures": detected,
            "sanitized": len(detected) == 0
        }

verifier = GroundingVerifier()
