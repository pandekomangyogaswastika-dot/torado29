"""Tests for Owner Daily Briefing + finance aliases (iteration 9)."""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback for tests run from inside the container
    BASE_URL = "http://localhost:8001"


def _login(email: str, password: str = "Torado@2026") -> str:
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": password},
        timeout=20,
    )
    assert r.status_code == 200, f"login failed for {email}: {r.status_code} {r.text}"
    body = r.json()
    data = body.get("data", body)
    token = data.get("access_token") or data.get("token")
    assert token, f"no token in login response: {body}"
    return token


@pytest.fixture(scope="module")
def owner_headers():
    token = _login("owner@torado.id")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def admin_headers():
    token = _login("admin@torado.id")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def briefing_payload(owner_headers):
    r = requests.get(
        f"{BASE_URL}/api/owner/daily-briefing", headers=owner_headers, timeout=60
    )
    assert r.status_code == 200, f"daily-briefing returned {r.status_code}: {r.text[:500]}"
    body = r.json()
    assert body.get("success") is True, f"envelope success false: {body}"
    return body["data"]


# ---------- Daily Briefing ----------
class TestDailyBriefing:
    def test_top_level_fields_present(self, briefing_payload):
        d = briefing_payload
        for k in [
            "greeting", "owner_name", "time_of_day", "today", "yesterday",
            "briefing_text", "voice_text", "llm_used", "highlights",
            "urgent_actions", "yesterday_by_outlet", "computed_at",
        ]:
            assert k in d, f"missing field: {k}"

    def test_briefing_text_non_empty_and_indonesian(self, briefing_payload):
        text = briefing_payload["briefing_text"]
        assert isinstance(text, str) and len(text) > 30, f"briefing_text too short: {text!r}"
        # contains owner name token "Hadi" (default name) OR another Indonesian greeting word
        assert any(w in text for w in ["Hadi", "Pak", "Bapak", "Anda"]), (
            f"briefing_text does not address owner: {text!r}"
        )

    def test_briefing_text_uses_idr_format(self, briefing_payload):
        text = briefing_payload["briefing_text"]
        # Expect formatted IDR like "Rp 44.4 Juta" / "Rp 1.2 Miliar" / "Rp 800 Ribu"
        assert re.search(r"Rp\s*[\d\.,]+\s*(Juta|Miliar|Ribu|0)", text), (
            f"no formatted IDR found: {text!r}"
        )

    def test_greeting_time_aware(self, briefing_payload):
        g = briefing_payload["greeting"]
        assert g.startswith(("Selamat pagi", "Selamat siang", "Selamat sore", "Selamat malam"))
        assert briefing_payload["time_of_day"] in ("pagi", "siang", "sore", "malam")

    def test_llm_used_flag_boolean(self, briefing_payload):
        assert isinstance(briefing_payload["llm_used"], bool)

    def test_highlights_keys(self, briefing_payload):
        h = briefing_payload["highlights"]
        for k in [
            "yesterday_total", "mtd_revenue", "cash_total",
            "ap_due_total", "ap_due_count", "top_outlet", "attention_outlet",
            "low_stock_count", "anomaly_count", "pending_approvals",
        ]:
            assert k in h, f"missing highlight key: {k}"
        assert isinstance(h["yesterday_total"], (int, float))
        assert isinstance(h["mtd_revenue"], (int, float))
        assert isinstance(h["cash_total"], (int, float))

    def test_urgent_actions_shape(self, briefing_payload):
        ua = briefing_payload["urgent_actions"]
        assert isinstance(ua, list)
        for a in ua:
            assert "type" in a and "severity" in a and "title" in a
            assert a["severity"] in ("high", "medium", "low")
            assert "action_link" in a and a["action_link"].startswith("/")

    def test_voice_text_sanitized(self, briefing_payload):
        vt = briefing_payload["voice_text"]
        assert isinstance(vt, str) and len(vt) > 10
        # Rp should be replaced with Rupiah and % with persen
        assert "Rp" not in vt or "Rupiah" in vt  # sanitized, "Rp" should be replaced
        assert "%" not in vt

    def test_yesterday_by_outlet_list(self, briefing_payload):
        rows = briefing_payload["yesterday_by_outlet"]
        assert isinstance(rows, list)
        if rows:
            r0 = rows[0]
            for k in ("outlet_id", "outlet_name", "revenue"):
                assert k in r0


# ---------- Finance aliases (iteration 8 follow-ups) ----------
class TestFinanceAliases:
    def test_ap_ledger_paginated(self, admin_headers):
        r = requests.get(
            f"{BASE_URL}/api/finance/ap-ledger?page=1&per_page=5",
            headers=admin_headers, timeout=30,
        )
        assert r.status_code == 200, f"{r.status_code}: {r.text[:400]}"
        body = r.json()
        # Accept either {data: [...]} or {data: {rows: [...]}} envelopes
        data = body.get("data", body)
        rows = data if isinstance(data, list) else data.get("rows") or data.get("items") or []
        assert isinstance(rows, list)

    def test_journal_entries_alias(self, admin_headers):
        r = requests.get(
            f"{BASE_URL}/api/finance/journal-entries?page=1&per_page=5",
            headers=admin_headers, timeout=30,
        )
        assert r.status_code == 200, f"{r.status_code}: {r.text[:400]}"

    def test_chart_of_accounts_alias(self, admin_headers):
        r = requests.get(
            f"{BASE_URL}/api/finance/chart-of-accounts?page=1&per_page=5",
            headers=admin_headers, timeout=30,
        )
        assert r.status_code == 200, f"{r.status_code}: {r.text[:400]}"

    def test_item_pricing_alias(self, admin_headers):
        r = requests.get(
            f"{BASE_URL}/api/finance/item-pricing?page=1&per_page=5",
            headers=admin_headers, timeout=30,
        )
        assert r.status_code == 200, f"{r.status_code}: {r.text[:400]}"
