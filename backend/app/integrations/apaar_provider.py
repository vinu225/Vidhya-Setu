import time
from typing import Dict, Any, Optional
from pydantic import BaseModel

class APAARIdentityProfile(BaseModel):
    apaar_id: str
    name: str
    dob: str
    gender: str
    abc_account_id: str
    is_active: bool
    mock_provider: str = "SYNTHETIC_APAAR_SANDBOX_ADAPTER_v1"

class APAARVerificationProvider:
    """
    Mock adapter for Ministry of Education / Digilocker APAAR Authority API.
    Clearly marked as synthetic mock adapter for hackathon & pre-production testing.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or "MOCK_APAAR_DEMO_KEY"

    def fetch_identity(self, apaar_id: str) -> Dict[str, Any]:
        time.sleep(0.05)  # Simulate network hop
        clean = apaar_id.replace(" ", "").strip()
        # Deterministic synthetic mock profiles
        return {
            "success": True,
            "provider": "SYNTHETIC_APAAR_SANDBOX_ADAPTER_v1",
            "apaar_id": clean,
            "abc_account_id": f"ABC-{clean[-6:]}",
            "is_authoritative_verified": True,
            "disclaimer": "MOCK IMPLEMENTATION: Authorized production credentials must be supplied via APAAR Gateway API."
        }
