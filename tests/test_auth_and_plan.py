import pytest
from httpx import AsyncClient, ASGITransport
import sys
import os
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.api.main import app

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.mark.anyio
async def test_auth_and_individual_plan():
    uid_a = uuid.uuid4().hex[:6]
    uid_b = uuid.uuid4().hex[:6]
    email_a = f"ahmad_{uid_a}@student.my"
    email_b = f"lukas_{uid_b}@berlin.de"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Register Student A (from Malaysia, going to SUSTech)
        reg_a = await client.post("/auth/register", json={
            "email": email_a,
            "password": "mypassword123",
            "name": "Ahmad Faris",
            "home_country": "Malaysia",
            "home_city": "Kuala Lumpur",
            "home_currency": "MYR",
            "home_currency_symbol": "RM",
            "host_university": "Southern University of Science and Technology (SUSTech)",
            "arrival_date": "2026-11-20",
            "program_end": "2028-06-30",
            "monthly_budget_cny": 48000.0,
            "funding_source": "Scholarship (MYR)"
        })
        assert reg_a.status_code == 200
        data_a = reg_a.json()
        assert data_a["status"] == "ok"
        token_a = data_a["token"]
        assert data_a["user"]["email"] == email_a
        assert data_a["profile"]["host_university"] == "Southern University of Science and Technology (SUSTech)"
        
        # Verify custom plan for Student A
        plan_a = data_a["plan"]
        assert plan_a["university"] == "Southern University of Science and Technology (SUSTech)"
        m4 = next(m for m in plan_a["milestones"] if m["id"] == "M4")
        assert "SUSTech" in m4["name"] or "SUSTech" in m4["description"]
        assert m4["status"] == "pending"

        # 2. Student A completes Milestone M1 (PSB Registration)
        headers_a = {"Authorization": f"Bearer {token_a}"}
        m_update = await client.post("/plan/milestone", json={"milestone_id": "M1", "status": "done"}, headers=headers_a)
        assert m_update.status_code == 200
        updated_plan_a = m_update.json()["plan"]
        m1_a = next(m for m in updated_plan_a["milestones"] if m["id"] == "M1")
        assert m1_a["status"] == "done"

        # 3. Register Student B (from Germany, going to Shenzhen University)
        reg_b = await client.post("/auth/register", json={
            "email": email_b,
            "password": "securepass123",
            "name": "Lukas Weber",
            "home_country": "Germany",
            "home_city": "Berlin",
            "home_currency": "EUR",
            "home_currency_symbol": "€",
            "host_university": "Shenzhen University",
            "arrival_date": "2026-12-01",
            "program_end": "2028-06-30",
            "monthly_budget_cny": 55000.0,
            "funding_source": "Self-Funded"
        })
        assert reg_b.status_code == 200
        token_b = reg_b.json()["token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # 4. Check Student B's plan: M1 must still be 'pending' (isolated per student profile!)
        get_plan_b = await client.get("/plan", headers=headers_b)
        assert get_plan_b.status_code == 200
        plan_b = get_plan_b.json()
        assert plan_b["university"] == "Shenzhen University"
        m1_b = next(m for m in plan_b["milestones"] if m["id"] == "M1")
        assert m1_b["status"] == "pending"

        # 5. Check Student A's plan again: M1 is still 'done'!
        get_plan_a_again = await client.get("/plan", headers=headers_a)
        assert get_plan_a_again.status_code == 200
        m1_a_again = next(m for m in get_plan_a_again.json()["milestones"] if m["id"] == "M1")
        assert m1_a_again["status"] == "done"

        # 6. Test Demo Login with priya@szu.edu.cn
        login_priya = await client.post("/auth/login", json={
            "email": "priya@szu.edu.cn",
            "password": "password123"
        })
        assert login_priya.status_code == 200
        assert login_priya.json()["user"]["name"] == "Priya Sharma"
