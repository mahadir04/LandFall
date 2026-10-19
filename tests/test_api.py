import pytest
from httpx import AsyncClient, ASGITransport
import sys
import os

# Ensure backend can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.api.main import app

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.mark.anyio
async def test_root():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "Landfall API" in data["message"]

@pytest.mark.anyio
async def test_profile_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        profile_payload = {
            "home_currency": "INR",
            "host_currency": "CNY",
            "host_country": "CN",
            "arrival_date": "2026-09-01",
            "program_end": "2028-06-30",
            "monthly_budget_cny": 50000.0,
            "funding_source": "Family (INR)"
        }
        post_res = await client.post("/profile", json=profile_payload)
        assert post_res.status_code == 200
        assert post_res.json()["status"] == "ok"
        
        get_res = await client.get("/profile")
        assert get_res.status_code == 200
        assert get_res.json()["home_currency"] == "INR"
        assert get_res.json()["monthly_budget_cny"] == 50000.0

@pytest.mark.anyio
async def test_plan_and_replan():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        plan_res = await client.get("/plan")
        assert plan_res.status_code == 200
        milestones = plan_res.json()["milestones"]
        assert len(milestones) >= 8
        assert milestones[0]["id"] == "M1"
        assert "PSB Registration" in milestones[0]["name"]

        replan_res = await client.post("/plan/replan", json={"scenario": "shock_week3"})
        assert replan_res.status_code == 200
        replan_data = replan_res.json()
        assert replan_data["scenario"] == "shock_week3"
        assert "adjusted_budget_cny" in replan_data

@pytest.mark.anyio
async def test_quotes():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/quotes", json={"target_cny": 28000})
        assert res.status_code == 200
        quotes = res.json()["quotes"]
        assert len(quotes) > 0
        assert quotes[0]["total_cost_inr"] <= quotes[-1]["total_cost_inr"]

@pytest.mark.anyio
async def test_payee_verification():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Verified payee
        v_res = await client.post("/payee/verify", json={"institution": "Shenzhen University"})
        assert v_res.status_code == 200
        assert v_res.json()["status"] == "VERIFIED"
        assert v_res.json()["risk"] == "LOW"

        # Mismatch payee account
        m_res = await client.post("/payee/verify", json={"institution": "Shenzhen University", "account_ref": "INVALID-123"})
        assert m_res.status_code == 200
        assert m_res.json()["status"] == "MISMATCH"
        assert m_res.json()["risk"] == "HIGH"

        # Unverified payee
        u_res = await client.post("/payee/verify", json={"institution": "Unknown Fake University"})
        assert u_res.status_code == 200
        assert u_res.json()["status"] == "UNVERIFIED"
        assert u_res.json()["risk"] == "HIGH"

@pytest.mark.anyio
async def test_scam_shield():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # High risk scam
        scam_res = await client.post("/scam/check", json={"text": "Transfer tuition to our authorized agent personal account with 20% discount urgent!"})
        assert scam_res.status_code == 200
        assert scam_res.json()["decision"] == "BLOCK"
        assert scam_res.json()["color"] == "red"

        # Safe message
        safe_res = await client.post("/scam/check", json={"text": "Hello, please find attached the official syllabus for orientation."})
        assert safe_res.status_code == 200
        assert safe_res.json()["decision"] == "ALLOW"
        assert safe_res.json()["color"] == "green"

@pytest.mark.anyio
async def test_confirmation_and_payment_simulation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Confirm payment for verified payee PAY-001
        conf_res = await client.post("/confirm", json={
            "payee_id": "PAY-001",
            "amount": 28000,
            "currency": "CNY",
            "date": "2026-09-01"
        })
        assert conf_res.status_code == 200
        token = conf_res.json()["token"]
        assert token.startswith("T3-")

        # Simulate payment with valid token
        pay_res = await client.post("/simulate/pay", json={"token": token})
        assert pay_res.status_code == 200
        assert pay_res.json()["transaction"]["status"] == "SIMULATED_COMPLETE"

        # Re-using the same token should fail (403 single-use)
        reuse_res = await client.post("/simulate/pay", json={"token": token})
        assert reuse_res.status_code == 403

        # Confirm payment for unverified payee PAY-SCAM-001 should fail with 403
        bad_conf_res = await client.post("/confirm", json={
            "payee_id": "PAY-SCAM-001",
            "amount": 10000,
            "currency": "CNY",
            "date": "2026-09-01"
        })
        assert bad_conf_res.status_code == 403

@pytest.mark.anyio
async def test_audit_hash_chain():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        audit_res = await client.get("/audit")
        assert audit_res.status_code == 200
        events = audit_res.json()["events"]
        assert len(events) > 0

        verify_res = await client.get("/audit/verify")
        assert verify_res.status_code == 200
        assert verify_res.json()["integrity"] is True

@pytest.mark.anyio
async def test_docs_and_credit_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        docs_res = await client.get("/docs/check")
        assert docs_res.status_code == 200
        assert "ICBC" in docs_res.json()["banks"]

        credit_res = await client.get("/credit/path")
        assert credit_res.status_code == 200
        assert len(credit_res.json()["milestones"]) == 6

        eval_res = await client.get("/eval/report")
        assert eval_res.status_code == 200
        assert "scenario_pass_rate" in eval_res.json()

@pytest.mark.anyio
async def test_chat_interaction():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        chat_res = await client.post("/chat", json={"message": "What do I need for an ICBC bank account?"})
        assert chat_res.status_code == 200
        assert "ICBC" in chat_res.json()["response"]
