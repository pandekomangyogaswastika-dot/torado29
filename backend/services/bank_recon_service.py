"""Bank Reconciliation Service.

Flow:
  1. upload_statement(csv_or_xlsx) -> creates bank_recon_session + statement_rows
  2. auto_match(session_id)        -> fuzzy match each statement row to a candidate PAY / JE line
  3. manual_match(session_id, row_id, target_type, target_id)  -> override
  4. unmatch(session_id, row_id)   -> clear a match
  5. commit(session_id)            -> marks matched PAY/JE as reconciled, session status=committed

Fuzzy match default tolerance: date ±3 days, amount ±Rp 1.000.
Candidates source:
  - payment_requests with status='paid'
  - journal_entries that touch a bank-account COA (with amount direction)
"""
import csv
import io
import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional

from core.audit import log as audit_log
from core.db import get_db, serialize
from core.exceptions import ConflictError, NotFoundError, ValidationError

logger = logging.getLogger("aurora.bank_recon")


DEFAULT_DATE_TOL_DAYS = 3
DEFAULT_AMOUNT_TOL = 1000  # Rp 1.000


def _now() -> str:
    return datetime.now().isoformat()


# ====================== CSV PARSE ======================

def _parse_date(s: str) -> Optional[str]:
    """Accept various Indonesian date formats, return ISO YYYY-MM-DD."""
    if not s:
        return None
    s = str(s).strip()
    fmts = [
        "%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y",
        "%d/%m/%y", "%d-%m-%y",
        "%Y/%m/%d",
    ]
    for f in fmts:
        try:
            return datetime.strptime(s, f).strftime("%Y-%m-%d")
        except Exception:  # noqa: BLE001
            continue
    return None


def _parse_amount(s: str) -> Optional[float]:
    if s is None or s == "":
        return None
    s = str(s).strip()
    # Handle Indonesian number format: "1.234.567,89" or "1,234,567.89" or plain
    neg = False
    if s.startswith("(") and s.endswith(")"):
        neg = True
        s = s[1:-1]
    if s.startswith("-"):
        neg = True
        s = s[1:]
    if "," in s and "." in s:
        # if last separator is comma → Indonesian
        if s.rfind(",") > s.rfind("."):
            s = s.replace(".", "").replace(",", ".")
        else:
            s = s.replace(",", "")
    elif "," in s:
        # Ambiguous; if part after last comma is 2 digits treat as decimal
        parts = s.split(",")
        if len(parts[-1]) == 2:
            s = s.replace(",", ".")
        else:
            s = s.replace(",", "")
    # else just digits and maybe a period
    try:
        v = float(s)
        return -v if neg else v
    except Exception:  # noqa: BLE001
        return None


def parse_statement_csv(content: bytes) -> list[dict]:
    """Parse bank CSV. Expected columns (flexible, case-insensitive):
      date | transaction_date | tanggal
      description | keterangan | note
      amount | nominal | jumlah  (signed: negative=out, positive=in)
      OR debit + credit separately
      reference | ref | no_ref  (optional)
    """
    text = content.decode("utf-8-sig", errors="ignore")
    reader = csv.DictReader(io.StringIO(text))
    rows: list[dict] = []
    field_map: dict[str, set[str]] = {
        "date": {"date", "transaction_date", "tanggal", "tgl", "trx_date"},
        "description": {"description", "keterangan", "note", "remark", "memo", "narasi"},
        "amount": {"amount", "nominal", "jumlah", "value"},
        "debit": {"debit", "dr", "db", "debet"},
        "credit": {"credit", "cr", "kredit"},
        "reference": {"reference", "ref", "ref_no", "no_ref", "reference_no"},
    }

    def find(col_row: dict, keys: set[str]) -> Optional[str]:
        for k in col_row:
            if k and k.strip().lower() in keys:
                return k
        return None

    for raw in reader:
        if not raw:
            continue
        d_col = find(raw, field_map["date"])
        desc_col = find(raw, field_map["description"]) or ""
        amt_col = find(raw, field_map["amount"])
        db_col = find(raw, field_map["debit"])
        cr_col = find(raw, field_map["credit"])
        ref_col = find(raw, field_map["reference"])

        date_iso = _parse_date(raw.get(d_col, "") if d_col else "")
        if not date_iso:
            continue

        amount: Optional[float] = None
        if amt_col:
            amount = _parse_amount(raw.get(amt_col))
        elif db_col or cr_col:
            dr_val = _parse_amount(raw.get(db_col, "") if db_col else "") or 0.0
            cr_val = _parse_amount(raw.get(cr_col, "") if cr_col else "") or 0.0
            amount = cr_val - dr_val  # credit inflow positive, debit outflow negative
        if amount is None or amount == 0:
            continue

        rows.append({
            "id": str(uuid.uuid4()),
            "date": date_iso,
            "description": str(raw.get(desc_col, "") or "").strip(),
            "amount": round(amount, 2),
            "reference": str(raw.get(ref_col, "") or "").strip() if ref_col else None,
            "matched": False,
            "match_type": None,
            "match_target_type": None,
            "match_target_id": None,
            "match_target_doc_no": None,
            "match_confidence": None,
            "match_reason": None,
        })
    return rows


# ====================== MATCH ALGORITHM ======================

def match_score(
    stmt_row: dict, candidate: dict, *,
    date_tol_days: int = DEFAULT_DATE_TOL_DAYS,
    amount_tol: float = DEFAULT_AMOUNT_TOL,
) -> float:
    """Return 0..1 match score, or -1 if not a candidate.

    Candidate shape: {date: 'YYYY-MM-DD', amount: float (positive), doc_no, reference}
    Statement row: {date, amount (signed), description, reference}

    Match rules:
      - Absolute amount within amount_tol of candidate amount (required)
      - Date within ±date_tol_days of candidate date (required)
      - Bonus: doc_no or reference substring in description
    """
    if not stmt_row.get("date") or not candidate.get("date"):
        return -1.0
    try:
        d_stmt = datetime.strptime(stmt_row["date"], "%Y-%m-%d").date()
        d_cand = datetime.strptime(candidate["date"], "%Y-%m-%d").date()
    except Exception:  # noqa: BLE001
        return -1.0
    dd = abs((d_stmt - d_cand).days)
    if dd > date_tol_days:
        return -1.0
    a_stmt = abs(float(stmt_row.get("amount", 0)))
    a_cand = abs(float(candidate.get("amount", 0)))
    da = abs(a_stmt - a_cand)
    if da > amount_tol:
        return -1.0
    # Scoring: exact date & amount = 1.0; each unit decreases
    date_score = 1 - (dd / max(date_tol_days, 1)) * 0.4  # up to -0.4 for date slip
    amount_score = 1 - (da / max(amount_tol, 1)) * 0.3  # up to -0.3 for amount slip
    ref_score = 0.0
    desc = (stmt_row.get("description") or "").lower()
    for token in (candidate.get("doc_no"), candidate.get("reference"), candidate.get("payee_name")):
        if token and str(token).lower() in desc:
            ref_score = 0.15
            break
    return max(0.0, min(1.0, date_score * 0.5 + amount_score * 0.5 + ref_score))


async def _build_candidates(
    *, start_date: str, end_date: str, bank_account_id: Optional[str] = None,
) -> list[dict]:
    """Build match candidates from PAY (paid) within extended date window."""
    db = get_db()
    # Extend window by ±3 days to allow date tolerance
    d_from = (datetime.strptime(start_date, "%Y-%m-%d") - timedelta(days=7)).strftime("%Y-%m-%d")
    d_to = (datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=7)).strftime("%Y-%m-%d")

    q: dict = {
        "deleted_at": None,
        "status": "paid",
        "payment_date": {"$gte": d_from, "$lte": d_to},
    }
    if bank_account_id:
        q["bank_account_id"] = bank_account_id

    vendors: dict = {}
    async for v in db.vendors.find({}):
        vendors[v["id"]] = v

    cands: list[dict] = []
    async for p in db.payment_requests.find(q).sort("payment_date", 1):
        payee_name = None
        if p.get("payee_type") == "vendor" and p.get("payee_id"):
            payee_name = vendors.get(p["payee_id"], {}).get("name")
        elif p.get("payee_text"):
            payee_name = p["payee_text"]
        cands.append({
            "target_type": "payment_request",
            "target_id": p["id"],
            "doc_no": p.get("doc_no"),
            "reference": p.get("payment_ref"),
            "date": p.get("payment_date"),
            "amount": float(p.get("amount", 0) or 0),
            "payee_name": payee_name,
            "description": p.get("description"),
            "reconciled": bool(p.get("reconciled_at")),
        })
    return cands


# ====================== SESSION CRUD ======================

async def list_sessions() -> list[dict]:
    db = get_db()
    items = await db.bank_recon_sessions.find({"deleted_at": None}).sort("created_at", -1).to_list(200)
    return [serialize(d) for d in items]


async def get_session(session_id: str) -> dict:
    db = get_db()
    s = await db.bank_recon_sessions.find_one({"id": session_id, "deleted_at": None})
    if not s:
        raise NotFoundError("Bank recon session tidak ditemukan")
    return serialize(s)


async def upload_statement(
    *, bank_account_id: str, filename: str, content: bytes, user: dict,
    date_tol_days: int = DEFAULT_DATE_TOL_DAYS,
    amount_tol: float = DEFAULT_AMOUNT_TOL,
) -> dict:
    """Parse file, create session, auto-match."""
    db = get_db()
    ba = await db.bank_accounts.find_one({"id": bank_account_id, "deleted_at": None})
    if not ba:
        raise ValidationError("bank_account_id tidak valid")
    rows = parse_statement_csv(content)
    if not rows:
        raise ValidationError("Tidak ada baris valid terdeteksi dari file. Pastikan kolom date+amount (atau debit/credit) ada.")
    dates = sorted(r["date"] for r in rows)
    start_d, end_d = dates[0], dates[-1]
    total_in = round(sum(r["amount"] for r in rows if r["amount"] > 0), 2)
    total_out = round(sum(-r["amount"] for r in rows if r["amount"] < 0), 2)

    session = {
        "id": str(uuid.uuid4()),
        "bank_account_id": bank_account_id,
        "bank_account_name": f"{ba.get('bank', '')} {ba.get('account_number', '')} — {ba.get('name', '')}",
        "filename": filename,
        "status": "pending",
        "start_date": start_d,
        "end_date": end_d,
        "total_rows": len(rows),
        "total_inflow": total_in,
        "total_outflow": total_out,
        "date_tol_days": int(date_tol_days),
        "amount_tol": float(amount_tol),
        "rows": rows,
        "created_at": _now(), "updated_at": _now(), "deleted_at": None,
        "created_by": user["id"],
    }
    await db.bank_recon_sessions.insert_one(session)
    await audit_log(user_id=user["id"], entity_type="bank_recon_session",
                    entity_id=session["id"], action="create",
                    after={"filename": filename, "rows": len(rows)})

    # Immediate auto-match
    await auto_match(session["id"], user=user)
    return await get_session(session["id"])


async def auto_match(session_id: str, *, user: dict) -> dict:
    db = get_db()
    session = await get_session(session_id)
    if session["status"] == "committed":
        raise ConflictError("Session sudah committed, tidak bisa re-match")
    bank_id = session["bank_account_id"]
    cands = await _build_candidates(
        start_date=session["start_date"], end_date=session["end_date"],
        bank_account_id=bank_id,
    )
    # Exclude already-reconciled candidates
    cands = [c for c in cands if not c["reconciled"]]

    matched = 0
    used_target_ids: set[str] = set()
    # Prefer best score per statement row; then prefer candidates already used-first avoidance
    for row in session["rows"]:
        if row.get("matched") and row.get("match_type") == "manual":
            continue  # don't override manual
        best: Optional[dict] = None
        best_score = -1.0
        for c in cands:
            if c["target_id"] in used_target_ids:
                continue
            s = match_score(
                row, c,
                date_tol_days=session.get("date_tol_days", DEFAULT_DATE_TOL_DAYS),
                amount_tol=session.get("amount_tol", DEFAULT_AMOUNT_TOL),
            )
            if s > best_score:
                best_score = s
                best = c
        if best and best_score >= 0:
            row["matched"] = True
            row["match_type"] = "auto"
            row["match_target_type"] = best["target_type"]
            row["match_target_id"] = best["target_id"]
            row["match_target_doc_no"] = best["doc_no"]
            row["match_confidence"] = round(float(best_score), 3)
            row["match_reason"] = "date ±tol + amount ±tol" + (
                " + ref" if best.get("doc_no") and best["doc_no"].lower() in (row.get("description") or "").lower() else ""
            )
            used_target_ids.add(best["target_id"])
            matched += 1
        else:
            row["matched"] = False
            row["match_type"] = None
            row["match_target_type"] = None
            row["match_target_id"] = None
            row["match_target_doc_no"] = None
            row["match_confidence"] = None
            row["match_reason"] = None

    await db.bank_recon_sessions.update_one(
        {"id": session_id}, {"$set": {"rows": session["rows"], "matched_count": matched,
                                        "updated_at": _now(), "status": "pending"}},
    )
    await audit_log(user_id=user["id"], entity_type="bank_recon_session",
                    entity_id=session_id, action="auto_match",
                    after={"matched": matched, "total": len(session["rows"])})
    return await get_session(session_id)


async def set_manual_match(session_id: str, row_id: str, target_type: str, target_id: str,
                            *, user: dict) -> dict:
    db = get_db()
    session = await get_session(session_id)
    if session["status"] == "committed":
        raise ConflictError("Session sudah committed")
    if target_type not in ("payment_request", "journal_entry"):
        raise ValidationError("target_type harus 'payment_request' atau 'journal_entry'")
    # Validate target exists
    if target_type == "payment_request":
        tdoc = await db.payment_requests.find_one({"id": target_id, "deleted_at": None})
    else:
        tdoc = await db.journal_entries.find_one({"id": target_id, "deleted_at": None})
    if not tdoc:
        raise NotFoundError("Target tidak ditemukan")

    found = False
    for row in session["rows"]:
        if row["id"] == row_id:
            row["matched"] = True
            row["match_type"] = "manual"
            row["match_target_type"] = target_type
            row["match_target_id"] = target_id
            row["match_target_doc_no"] = tdoc.get("doc_no")
            row["match_confidence"] = 1.0
            row["match_reason"] = "manual"
            found = True
            break
    if not found:
        raise NotFoundError("Row ID tidak ditemukan di session")
    matched = sum(1 for r in session["rows"] if r.get("matched"))
    await db.bank_recon_sessions.update_one(
        {"id": session_id}, {"$set": {"rows": session["rows"], "matched_count": matched,
                                        "updated_at": _now()}},
    )
    await audit_log(user_id=user["id"], entity_type="bank_recon_session",
                    entity_id=session_id, action="manual_match",
                    after={"row_id": row_id, "target_type": target_type, "target_id": target_id})
    return await get_session(session_id)


async def unmatch_row(session_id: str, row_id: str, *, user: dict) -> dict:
    db = get_db()
    session = await get_session(session_id)
    if session["status"] == "committed":
        raise ConflictError("Session sudah committed")
    found = False
    for row in session["rows"]:
        if row["id"] == row_id:
            row["matched"] = False
            row["match_type"] = None
            row["match_target_type"] = None
            row["match_target_id"] = None
            row["match_target_doc_no"] = None
            row["match_confidence"] = None
            row["match_reason"] = None
            found = True
            break
    if not found:
        raise NotFoundError("Row ID tidak ditemukan")
    matched = sum(1 for r in session["rows"] if r.get("matched"))
    await db.bank_recon_sessions.update_one(
        {"id": session_id}, {"$set": {"rows": session["rows"], "matched_count": matched,
                                        "updated_at": _now()}},
    )
    return await get_session(session_id)


async def commit_session(session_id: str, *, user: dict) -> dict:
    db = get_db()
    session = await get_session(session_id)
    if session["status"] == "committed":
        raise ConflictError("Session sudah committed")
    matched_rows = [r for r in session["rows"] if r.get("matched")]
    if not matched_rows:
        raise ValidationError("Tidak ada baris yang di-match, tidak bisa commit")
    # Mark all matched PAY/JE as reconciled
    for row in matched_rows:
        ttype = row["match_target_type"]
        tid = row["match_target_id"]
        if ttype == "payment_request":
            await db.payment_requests.update_one({"id": tid}, {"$set": {
                "reconciled_at": _now(),
                "reconciled_session_id": session_id,
                "reconciled_row_id": row["id"],
                "updated_at": _now(),
            }})
        elif ttype == "journal_entry":
            await db.journal_entries.update_one({"id": tid}, {"$set": {
                "reconciled_at": _now(),
                "reconciled_session_id": session_id,
                "updated_at": _now(),
            }})
    await db.bank_recon_sessions.update_one({"id": session_id}, {"$set": {
        "status": "committed",
        "committed_at": _now(),
        "committed_by": user["id"],
        "updated_at": _now(),
    }})
    await audit_log(user_id=user["id"], entity_type="bank_recon_session",
                    entity_id=session_id, action="commit",
                    after={"matched": len(matched_rows)})
    return await get_session(session_id)


async def get_match_candidates(
    session_id: str, row_id: str,
) -> list[dict]:
    """Return candidates for a specific row with score (for UI suggestion list)."""
    session = await get_session(session_id)
    row = next((r for r in session["rows"] if r["id"] == row_id), None)
    if not row:
        raise NotFoundError("Row tidak ditemukan")
    cands = await _build_candidates(
        start_date=session["start_date"], end_date=session["end_date"],
        bank_account_id=session["bank_account_id"],
    )
    scored = []
    for c in cands:
        s = match_score(
            row, c,
            date_tol_days=session.get("date_tol_days", DEFAULT_DATE_TOL_DAYS),
            amount_tol=session.get("amount_tol", DEFAULT_AMOUNT_TOL),
        )
        if s >= 0:
            scored.append({**c, "score": round(float(s), 3)})
    # Also include a broader loose-search (same sign, amount within ±5%) so user can manual-pick
    loose_cands = []
    import math
    amt = abs(float(row["amount"]))
    for c in cands:
        if c in scored:
            continue
        ca = abs(float(c.get("amount", 0)))
        if ca == 0:
            continue
        # Within 5% amount ratio
        if math.isclose(ca, amt, rel_tol=0.05, abs_tol=5000):
            loose_cands.append({**c, "score": None, "loose": True})
    scored.sort(key=lambda x: -x["score"])
    loose_cands.sort(key=lambda x: x["date"])
    return scored + loose_cands[:20]


# ─────────────────────────────────────────────────────────────────────────────
# Sprint F v2 additions
# ─────────────────────────────────────────────────────────────────────────────

async def mark_exception(session_id: str, row_id: str, note: str, *, user: dict) -> dict:
    """Mark a row as exceptional (unreconcilable / adjustment needed)."""
    db = get_db()
    await db.bank_recon_sessions.update_one(
        {"id": session_id, "rows.id": row_id},
        {"$set": {
            "rows.$.exception": True,
            "rows.$.exception_note": note,
            "rows.$.matched": False,
            "rows.$.match_target_type": None,
            "rows.$.match_target_id": None,
            "updated_at": _now(),
        }},
    )
    await audit_log(user_id=user["id"], entity_type="bank_recon_row",
                    entity_id=row_id, action="exception", after={"note": note})
    return await get_session(session_id)


async def bulk_auto_accept(session_id: str, min_score: float, *, user: dict) -> dict:
    """Auto-accept all unmatched rows whose best candidate meets min_score threshold."""
    db = get_db()
    session = await get_session(session_id)
    accepted = 0
    for row in session["rows"]:
        if row.get("matched") or row.get("exception"):
            continue
        candidates = await _build_candidates(
            start_date=session["start_date"],
            end_date=session["end_date"],
            bank_account_id=session["bank_account_id"],
        )
        best = None
        best_score = -1.0
        for c in candidates:
            s = match_score(
                row, c,
                date_tol_days=session.get("date_tol_days", DEFAULT_DATE_TOL_DAYS),
                amount_tol=session.get("amount_tol", DEFAULT_AMOUNT_TOL),
            )
            if s > best_score:
                best_score = s
                best = c
        if best and best_score >= min_score:
            await db.bank_recon_sessions.update_one(
                {"id": session_id, "rows.id": row["id"]},
                {"$set": {
                    "rows.$.matched": True,
                    "rows.$.match_score": round(best_score, 3),
                    "rows.$.match_target_type": best["type"],
                    "rows.$.match_target_id": best["id"],
                    "rows.$.match_ref": best.get("ref"),
                    "rows.$.matched_by": user["id"],
                    "updated_at": _now(),
                }},
            )
            accepted += 1
    await audit_log(user_id=user["id"], entity_type="bank_recon_session",
                    entity_id=session_id, action="bulk_accept", after={"accepted": accepted})
    return {"session": await get_session(session_id), "accepted": accepted}


async def get_summary(session_id: str) -> dict:
    """Return reconciliation summary stats for a session."""
    session = await get_session(session_id)
    rows = session.get("rows", [])
    total = len(rows)
    matched = sum(1 for r in rows if r.get("matched"))
    exceptional = sum(1 for r in rows if r.get("exception"))
    unmatched = total - matched - exceptional

    matched_amount = sum(abs(float(r.get("amount", 0))) for r in rows if r.get("matched"))
    unmatched_amount = sum(abs(float(r.get("amount", 0))) for r in rows if not r.get("matched") and not r.get("exception"))
    exceptional_amount = sum(abs(float(r.get("amount", 0))) for r in rows if r.get("exception"))
    total_amount = sum(abs(float(r.get("amount", 0))) for r in rows)

    match_pct = round(matched / total * 100, 1) if total > 0 else 0.0

    return {
        "session_id": session_id,
        "status": session["status"],
        "total_rows": total,
        "matched_rows": matched,
        "unmatched_rows": unmatched,
        "exceptional_rows": exceptional,
        "match_pct": match_pct,
        "total_amount": total_amount,
        "matched_amount": matched_amount,
        "unmatched_amount": unmatched_amount,
        "exceptional_amount": exceptional_amount,
        "bank_account_id": session.get("bank_account_id"),
        "period": f"{session.get('start_date')} – {session.get('end_date')}",
    }


import csv as _csv
import io as _io


def export_session_csv(session: dict) -> str:
    """Export all rows of a recon session as CSV."""
    buf = _io.StringIO()
    writer = _csv.writer(buf)
    writer.writerow([
        "Date", "Description", "Amount", "Status",
        "Match Type", "Match Ref", "Score", "Exception Note",
    ])
    for row in session.get("rows", []):
        status = "matched" if row.get("matched") else ("exception" if row.get("exception") else "unmatched")
        writer.writerow([
            row.get("date", ""),
            row.get("description", ""),
            row.get("amount", ""),
            status,
            row.get("match_target_type", ""),
            row.get("match_ref", ""),
            row.get("match_score", ""),
            row.get("exception_note", ""),
        ])
    return buf.getvalue()

