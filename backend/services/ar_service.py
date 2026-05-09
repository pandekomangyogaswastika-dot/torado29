"""AR Ledger service — Sprint 2.

Handles:
- AR Customer CRUD
- AR Invoice lifecycle (draft → sent → paid)
- PDF generation (reportlab)
- Telegram/Email reminders
- AR Aging
- Reconciliation
"""
from __future__ import annotations

import logging
import io
from datetime import datetime, timezone, date, timedelta
from typing import Optional

from core.db import get_db, serialize
from models.ar import make_ar_invoice, make_ar_receipt, make_ar_customer, INVOICE_STATUSES

logger = logging.getLogger("aurora.ar")


# ────────────────────────────────────────────────
# 1. AR CUSTOMER CRUD
# ────────────────────────────────────────────────

async def create_customer(payload: dict, *, user_id: str) -> dict:
    db = get_db()
    doc = make_ar_customer(
        name=payload["name"],
        channel=payload.get("channel", "b2b"),
        npwp=payload.get("npwp"),
        address=payload.get("address"),
        contact_person=payload.get("contact_person"),
        phone=payload.get("phone"),
        email=payload.get("email"),
        credit_terms_days=int(payload.get("credit_terms_days", 30) or 30),
        notes=payload.get("notes"),
        created_by=user_id,
    )
    await db.ar_customers.insert_one(doc)
    return serialize(doc)


async def list_customers() -> list[dict]:
    db = get_db()
    items = await db.ar_customers.find({"deleted_at": None, "is_active": True}).sort("name", 1).to_list(200)
    return [serialize(i) for i in items]


async def update_customer(customer_id: str, payload: dict, *, user_id: str) -> Optional[dict]:
    db = get_db()
    allowed = ["name", "channel", "npwp", "address", "contact_person", "phone", "email", "credit_terms_days", "notes"]
    upd = {k: v for k, v in payload.items() if k in allowed}
    upd["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.ar_customers.update_one({"id": customer_id}, {"$set": upd})
    doc = await db.ar_customers.find_one({"id": customer_id})
    return serialize(doc) if doc else None


# ────────────────────────────────────────────────
# 2. AR INVOICE CRUD
# ────────────────────────────────────────────────

async def _next_invoice_no() -> str:
    db = get_db()
    year = datetime.now(timezone.utc).year
    key = f"AR_INV_SEQ_{year}"
    result = await db.system_settings.find_one_and_update(
        {"key": key},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    seq = result.get("seq", 1) if result else 1
    return f"INV-{year}-{str(seq).zfill(5)}"


async def create_invoice(payload: dict, *, user_id: str) -> dict:
    db = get_db()
    invoice_no = payload.get("invoice_no") or await _next_invoice_no()
    invoice_date = payload.get("invoice_date", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    period = invoice_date[:7]

    lines = []
    subtotal = 0.0
    for ln in payload.get("lines", []):
        qty = float(ln.get("qty", 1))
        unit_price = float(ln.get("unit_price", 0))
        discount = float(ln.get("discount", 0))
        dpp = qty * unit_price - discount
        ppn_rate = float(ln.get("ppn_rate", 0.12)) if ln.get("include_ppn") else 0
        ppn = round(dpp * ppn_rate, 2)
        subtotal += dpp
        lines.append({
            "description": ln.get("description", ""),
            "qty": qty,
            "unit_price": unit_price,
            "discount": discount,
            "dpp": round(dpp, 2),
            "ppn_rate": ppn_rate,
            "ppn": ppn,
        })

    tax_amount = sum(ln["ppn"] for ln in lines)
    total = subtotal + tax_amount

    # Resolve customer info
    customer_id = payload.get("customer_id")
    customer_name = payload.get("customer_name", "")
    if customer_id and not customer_name:
        cust = await db.ar_customers.find_one({"id": customer_id})
        customer_name = (cust or {}).get("name", "")

    # Due date
    credit_days = int(payload.get("credit_terms_days", 30) or 30)
    try:
        inv_dt = datetime.strptime(invoice_date, "%Y-%m-%d")
        due_date = (inv_dt + timedelta(days=credit_days)).strftime("%Y-%m-%d")
    except Exception:
        due_date = invoice_date

    doc = make_ar_invoice(
        invoice_no=invoice_no,
        customer_id=customer_id,
        customer_name=customer_name,
        customer_npwp=payload.get("customer_npwp"),
        customer_address=payload.get("customer_address"),
        channel=payload.get("channel", "b2b"),
        invoice_date=invoice_date,
        due_date=payload.get("due_date") or due_date,
        lines=lines,
        subtotal=round(subtotal, 2),
        tax_amount=round(tax_amount, 2),
        total_amount=round(total, 2),
        outlet_id=payload.get("outlet_id"),
        period=period,
        notes=payload.get("notes"),
        created_by=user_id,
    )
    await db.ar_invoices.insert_one(doc)

    # Post AR JE if not draft
    if payload.get("auto_post"):
        await _post_ar_je(doc, user_id=user_id)

    return serialize(doc)


async def _post_ar_je(invoice: dict, *, user_id: str) -> Optional[dict]:
    """Post AR opening JE: Dr AR Receivable, Cr Revenue + Cr PPN Payable."""
    try:
        db = get_db()
        ar_coa = await db.chart_of_accounts.find_one({"code": "1201", "deleted_at": None})
        rev_coa = await db.chart_of_accounts.find_one({"code": "4101", "deleted_at": None})
        if not ar_coa or not rev_coa:
            return None
        lines = [
            {"coa_id": ar_coa["id"], "dr": invoice["total_amount"], "cr": 0.0, "memo": f"AR {invoice['invoice_no']}"},
            {"coa_id": rev_coa["id"], "dr": 0.0, "cr": invoice["subtotal"], "memo": invoice.get("customer_name")},
        ]
        if invoice.get("tax_amount", 0) > 0:
            ppn_coa = await db.chart_of_accounts.find_one({"code": "2110", "deleted_at": None})
            if ppn_coa:
                lines.append({"coa_id": ppn_coa["id"], "dr": 0.0, "cr": invoice["tax_amount"], "memo": "PPN Keluaran"})
        from services import journal_service
        je = await journal_service._post_journal(
            entry_date=invoice["invoice_date"],
            description=f"AR Invoice {invoice['invoice_no']}",
            source_type="ar_invoice",
            source_id=invoice["id"],
            lines=lines,
            user_id=user_id,
        )
        await get_db().ar_invoices.update_one({"id": invoice["id"]}, {"$set": {"je_id": je["id"]}})
        return je
    except Exception as e:
        logger.warning("AR JE failed: %s", e)
        return None


async def list_invoices(
    *,
    period: Optional[str] = None,
    status: Optional[str] = None,
    channel: Optional[str] = None,
    customer_id: Optional[str] = None,
    page: int = 1,
    per_page: int = 50,
) -> tuple[list, dict]:
    db = get_db()
    q: dict = {"deleted_at": None}
    if period:
        q["period"] = period
    if status:
        q["status"] = status
    if channel:
        q["channel"] = channel
    if customer_id:
        q["customer_id"] = customer_id
    skip = (page - 1) * per_page
    items = await db.ar_invoices.find(q).sort([("invoice_date", -1)]).skip(skip).limit(per_page).to_list(per_page)
    total = await db.ar_invoices.count_documents(q)

    # Mark overdue
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    result = []
    for inv in items:
        d = serialize(inv)
        if d["status"] not in ("paid", "cancelled") and d.get("due_date", today) < today:
            d["status"] = "overdue"
        result.append(d)
    return result, {"page": page, "per_page": per_page, "total": total}


async def get_invoice(invoice_id: str) -> Optional[dict]:
    db = get_db()
    doc = await db.ar_invoices.find_one({"id": invoice_id, "deleted_at": None})
    if not doc:
        return None
    d = serialize(doc)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if d["status"] not in ("paid", "cancelled") and d.get("due_date", today) < today:
        d["status"] = "overdue"
    return d


async def mark_sent(invoice_id: str, *, user_id: str) -> dict:
    db = get_db()
    doc = await db.ar_invoices.find_one({"id": invoice_id})
    if not doc:
        raise ValueError("Invoice not found")
    now = datetime.now(timezone.utc).isoformat()
    await db.ar_invoices.update_one({"id": invoice_id}, {"$set": {"status": "sent", "sent_at": now, "updated_at": now}})
    # Post JE on send (if not already)
    fresh = await db.ar_invoices.find_one({"id": invoice_id})
    if fresh and not fresh.get("je_id"):
        await _post_ar_je(fresh, user_id=user_id)
    return await get_invoice(invoice_id)


# ────────────────────────────────────────────────
# 3. RECEIPTS (PAYMENT)
# ────────────────────────────────────────────────

async def record_receipt(invoice_id: str, payload: dict, *, user_id: str) -> dict:
    db = get_db()
    invoice = await db.ar_invoices.find_one({"id": invoice_id, "deleted_at": None})
    if not invoice:
        raise ValueError("Invoice not found")

    amount = float(payload["amount"])
    if amount <= 0:
        raise ValueError("Amount must be > 0")

    outstanding = float(invoice.get("outstanding", 0))
    if amount > outstanding + 0.01:
        raise ValueError(f"Amount ({amount}) exceeds outstanding ({outstanding})")

    receipt_date = payload.get("receipt_date", datetime.now(timezone.utc).strftime("%Y-%m-%d"))

    # Post JE: Dr Bank, Cr AR
    je = None
    try:
        from services import journal_service
        db2 = get_db()
        ar_coa = await db2.chart_of_accounts.find_one({"code": "1201", "deleted_at": None})
        bank_coa = await db2.chart_of_accounts.find_one({"code": "1111", "deleted_at": None})
        if not bank_coa:
            bank_coa = await db2.chart_of_accounts.find_one({"code": "1001", "deleted_at": None})
        if ar_coa and bank_coa:
            je = await journal_service._post_journal(
                entry_date=receipt_date,
                description=f"Receipt {invoice['invoice_no']} from {invoice.get('customer_name', '')}",
                source_type="ar_receipt",
                source_id=invoice_id,
                lines=[
                    {"coa_id": bank_coa["id"], "dr": amount, "cr": 0.0, "memo": f"Receipt {invoice['invoice_no']}"},
                    {"coa_id": ar_coa["id"], "dr": 0.0, "cr": amount, "memo": f"Clear AR {invoice['invoice_no']}"},
                ],
                user_id=user_id,
            )
    except Exception as e:
        logger.warning("receipt JE failed: %s", e)

    receipt = make_ar_receipt(
        invoice_id=invoice_id,
        receipt_date=receipt_date,
        amount=amount,
        payment_method=payload.get("payment_method", "transfer"),
        reference=payload.get("reference"),
        bank_account_id=payload.get("bank_account_id"),
        je_id=je["id"] if je else None,
        notes=payload.get("notes"),
        created_by=user_id,
    )
    await db.ar_receipts.insert_one(receipt)

    new_paid = round(float(invoice.get("paid_amount", 0)) + amount, 2)
    new_outstanding = round(float(invoice.get("total_amount", 0)) - new_paid, 2)
    new_status = "paid" if new_outstanding <= 0.01 else "partial"
    now = datetime.now(timezone.utc).isoformat()
    await db.ar_invoices.update_one(
        {"id": invoice_id},
        {"$set": {"paid_amount": new_paid, "outstanding": max(0, new_outstanding), "status": new_status, "updated_at": now},
         "$push": {"receipts": receipt["id"]}}
    )
    return serialize(receipt)


# ────────────────────────────────────────────────
# 4. PDF GENERATION
# ────────────────────────────────────────────────

def generate_invoice_pdf(invoice: dict, company_info: dict) -> bytes:
    """Generate PDF invoice using reportlab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm, leftMargin=2*cm, rightMargin=2*cm)
    styles = getSampleStyleSheet()
    story = []

    # Header
    header_data = [
        [Paragraph(f"<b>{company_info.get('name', 'PT Torado Group')}</b>", styles["Heading2"]),
         Paragraph("<b>INVOICE</b>", ParagraphStyle(name="InvTitle", fontSize=20, alignment=TA_RIGHT, textColor=colors.HexColor("#1a1a2e")))],
        [Paragraph(company_info.get("address", ""), styles["Normal"]),
         Paragraph(f"No: <b>{invoice.get('invoice_no', '')}</b>", ParagraphStyle(name="R", alignment=TA_RIGHT))],
        [Paragraph(f"NPWP: {company_info.get('npwp', '-')}", styles["Normal"]),
         Paragraph(f"Tanggal: {invoice.get('invoice_date', '')}", ParagraphStyle(name="R2", alignment=TA_RIGHT))],
        ["",
         Paragraph(f"Jatuh Tempo: <b>{invoice.get('due_date', '')}</b>", ParagraphStyle(name="R3", alignment=TA_RIGHT))],
    ]
    ht = Table(header_data, colWidths=[10*cm, 7.5*cm])
    ht.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(ht)
    story.append(Spacer(1, 0.5*cm))

    # Bill To
    story.append(Paragraph("<b>Ditagihkan kepada:</b>", styles["Normal"]))
    story.append(Paragraph(invoice.get("customer_name", "-"), styles["Normal"]))
    if invoice.get("customer_address"):
        story.append(Paragraph(invoice["customer_address"], styles["Normal"]))
    if invoice.get("customer_npwp"):
        story.append(Paragraph(f"NPWP: {invoice['customer_npwp']}", styles["Normal"]))
    story.append(Spacer(1, 0.5*cm))

    # Line items table
    tbl_data = [["No", "Deskripsi", "Qty", "Harga Satuan", "DPP", "PPN", "Total"]]
    for i, ln in enumerate(invoice.get("lines", []), 1):
        tbl_data.append([
            str(i),
            ln.get("description", ""),
            f"{ln.get('qty', 1):.0f}",
            f"Rp {ln.get('unit_price', 0):,.0f}",
            f"Rp {ln.get('dpp', 0):,.0f}",
            f"Rp {ln.get('ppn', 0):,.0f}",
            f"Rp {(ln.get('dpp', 0) + ln.get('ppn', 0)):,.0f}",
        ])

    # Totals
    tbl_data.append(["", "", "", "", "Subtotal", "", f"Rp {invoice.get('subtotal', 0):,.0f}"])
    tbl_data.append(["", "", "", "", "PPN (12%)", "", f"Rp {invoice.get('tax_amount', 0):,.0f}"])
    tbl_data.append(["", "", "", "", "TOTAL", "", f"Rp {invoice.get('total_amount', 0):,.0f}"])

    tbl = Table(tbl_data, colWidths=[1*cm, 6*cm, 1.5*cm, 3*cm, 2.5*cm, 2*cm, 3*cm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -4), 0.5, colors.HexColor("#e0e0e0")),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -4), [colors.white, colors.HexColor("#f8f9fa")]),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.black),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 1*cm))

    # Notes
    if invoice.get("notes"):
        story.append(Paragraph(f"<i>Catatan: {invoice['notes']}</i>", styles["Normal"]))

    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("Terima kasih atas kepercayaan Anda.", styles["Normal"]))

    doc.build(story)
    return buf.getvalue()


# ────────────────────────────────────────────────
# 5. AGING + RECONCILIATION
# ────────────────────────────────────────────────

async def ar_aging() -> dict:
    """AR Aging report bucketed: Current, 1-30d, 31-60d, 61-90d, >90d."""
    db = get_db()
    today = datetime.now(timezone.utc).date()
    buckets = {"current": 0, "1_30": 0, "31_60": 0, "61_90": 0, "over_90": 0}
    bucket_items: dict[str, list] = {k: [] for k in buckets}
    total_outstanding = 0.0

    async for inv in db.ar_invoices.find({"status": {"$nin": ["paid", "cancelled"]}, "deleted_at": None}):
        outstanding = float(inv.get("outstanding", 0))
        if outstanding <= 0:
            continue
        try:
            due = datetime.strptime(inv.get("due_date", str(today)), "%Y-%m-%d").date()
        except Exception:
            due = today
        days_overdue = (today - due).days
        item = {"id": inv["id"], "invoice_no": inv.get("invoice_no"), "customer_name": inv.get("customer_name"), "outstanding": outstanding, "due_date": inv.get("due_date"), "days_overdue": days_overdue}
        total_outstanding += outstanding
        if days_overdue <= 0:
            buckets["current"] += outstanding
            bucket_items["current"].append(item)
        elif days_overdue <= 30:
            buckets["1_30"] += outstanding
            bucket_items["1_30"].append(item)
        elif days_overdue <= 60:
            buckets["31_60"] += outstanding
            bucket_items["31_60"].append(item)
        elif days_overdue <= 90:
            buckets["61_90"] += outstanding
            bucket_items["61_90"].append(item)
        else:
            buckets["over_90"] += outstanding
            bucket_items["over_90"].append(item)

    return {
        "as_of": str(today),
        "total_outstanding": round(total_outstanding, 2),
        "buckets": {k: round(v, 2) for k, v in buckets.items()},
        "items": bucket_items,
    }


# ────────────────────────────────────────────────
# 6. REMINDERS
# ────────────────────────────────────────────────

async def send_reminder(invoice_id: str, channel: str, *, user_id: str) -> dict:
    """Send payment reminder via Telegram or Email."""
    db = get_db()
    invoice = await db.ar_invoices.find_one({"id": invoice_id, "deleted_at": None})
    if not invoice:
        raise ValueError("Invoice not found")

    inv = serialize(invoice)
    msg = (
        f"\U0001f4cb *PENGINGAT PEMBAYARAN*\n"
        f"Invoice: {inv['invoice_no']}\n"
        f"Customer: {inv['customer_name']}\n"
        f"Total: Rp {inv['total_amount']:,.0f}\n"
        f"Outstanding: Rp {inv['outstanding']:,.0f}\n"
        f"Jatuh Tempo: {inv['due_date']}\n"
        f"Status: {inv['status'].upper()}"
    )

    result = {"channel": channel, "sent": False, "message": msg}

    if channel == "telegram":
        try:
            from services.telegram_service import send_message
            await send_message(msg)
            result["sent"] = True
        except Exception as e:
            result["error"] = str(e)
    elif channel == "email":
        try:
            from services.system_settings_service import get_value
            from services.email_service import send_simple_email
            customer = await db.ar_customers.find_one({"id": inv.get("customer_id")}) if inv.get("customer_id") else None
            to_email = (customer or {}).get("email") or ""
            if to_email:
                await send_simple_email(
                    to=to_email,
                    subject=f"Pengingat Pembayaran Invoice {inv['invoice_no']}",
                    body=msg.replace("*", ""),
                )
                result["sent"] = True
            else:
                result["error"] = "Customer email not set"
        except Exception as e:
            result["error"] = str(e)

    # Log reminder
    now = datetime.now(timezone.utc).isoformat()
    await db.ar_invoices.update_one(
        {"id": invoice_id},
        {"$inc": {"reminders_sent": 1}, "$set": {"last_reminder_at": now, "updated_at": now}}
    )
    return result
