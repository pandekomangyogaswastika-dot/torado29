"""Budget vs Actual models — Sprint 2."""
from datetime import datetime, timezone
from typing import Optional
import uuid


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# Standard F&B P&L categories for rollup
BUDGET_CATEGORIES = [
    {"code": "REV",    "name": "Revenue",           "sign": 1,  "description": "Pendapatan penjualan"},
    {"code": "COGS",   "name": "HPP / COGS",         "sign": -1, "description": "Harga pokok penjualan"},
    {"code": "GROSS",  "name": "Gross Profit",       "sign": 1,  "description": "Laba kotor (REV - COGS)", "derived": True},
    {"code": "OPEX",   "name": "Operating Expenses", "sign": -1, "description": "Beban operasional"},
    {"code": "PAYROLL","name": "Payroll",             "sign": -1, "description": "Gaji & tunjangan"},
    {"code": "MKTG",   "name": "Marketing",          "sign": -1, "description": "Biaya pemasaran"},
    {"code": "EBITDA", "name": "EBITDA",             "sign": 1,  "description": "Laba sebelum bunga, pajak, penyusutan", "derived": True},
    {"code": "DEP",    "name": "Depreciation",       "sign": -1, "description": "Penyusutan aset tetap"},
    {"code": "TAX",    "name": "Tax Expense",        "sign": -1, "description": "Beban pajak"},
    {"code": "NET",    "name": "Net Income",         "sign": 1,  "description": "Laba bersih", "derived": True},
]


def make_budget_doc(
    *,
    name: str,
    period: str,                # YYYY-MM or YYYY-QN or YYYY
    period_type: str,           # monthly | quarterly | annual
    outlet_id: Optional[str],
    lines: list,                # [{coa_id, coa_code, coa_name, category, amount}]
    notes: Optional[str],
    created_by: Optional[str],
) -> dict:
    now = _now()
    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "period": period,
        "period_type": period_type,
        "outlet_id": outlet_id,
        "lines": lines,
        "notes": notes,
        "status": "active",
        "created_at": now, "updated_at": now, "deleted_at": None,
        "created_by": created_by,
    }
