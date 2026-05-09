"""Budget vs Actual router — Sprint 2.

Endpoints:
  GET  /api/budget/budgets               — list budgets
  POST /api/budget/budgets               — create budget
  GET  /api/budget/budgets/{budget_id}   — get budget detail
  PUT  /api/budget/budgets/{budget_id}   — update budget
  DELETE /api/budget/budgets/{budget_id} — delete budget
  GET  /api/budget/vs-actual             — budget vs actual report
  GET  /api/budget/categories            — list budget categories
  POST /api/budget/import-csv            — import budget from CSV
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query, UploadFile, File

from core.exceptions import ok_envelope, AuroraException
from core.security import current_user, require_perm
from services import budget_service
from models.budget import BUDGET_CATEGORIES

router = APIRouter(prefix="/api/budget", tags=["budget"])


@router.get("/categories")
async def get_budget_categories(user: dict = Depends(current_user)):
    """Return budget category definitions."""
    return ok_envelope({"categories": BUDGET_CATEGORIES})


@router.get("/budgets")
async def list_budgets(
    period: Optional[str] = Query(None),
    outlet_id: Optional[str] = Query(None),
    user: dict = Depends(require_perm("finance.budget.read")),
):
    """List budgets with optional filters."""
    items = await budget_service.list_budgets(period=period, outlet_id=outlet_id)
    return ok_envelope({"items": items})


@router.post("/budgets")
async def create_budget(
    payload: dict,
    user: dict = Depends(require_perm("finance.budget.create")),
):
    """Create new budget.
    
    Payload:
      name, period (YYYY-MM or YYYY-QN or YYYY), period_type (monthly|quarterly|annual),
      outlet_id (optional), lines: [{coa_id, amount, category (optional)}], notes
    """
    budget = await budget_service.create_budget(payload, user_id=user["id"])
    return ok_envelope(budget)


@router.get("/budgets/{budget_id}")
async def get_budget(
    budget_id: str,
    user: dict = Depends(require_perm("finance.budget.read")),
):
    """Get budget detail."""
    budget = await budget_service.get_budget(budget_id)
    if not budget:
        raise AuroraException("BUDGET_NOT_FOUND", "Budget not found", "budget_id")
    return ok_envelope(budget)


@router.put("/budgets/{budget_id}")
async def update_budget(
    budget_id: str,
    payload: dict,
    user: dict = Depends(require_perm("finance.budget.update")),
):
    """Update budget lines."""
    budget = await budget_service.update_budget(budget_id, payload, user_id=user["id"])
    if not budget:
        raise AuroraException("BUDGET_NOT_FOUND", "Budget not found", "budget_id")
    return ok_envelope(budget)


@router.delete("/budgets/{budget_id}")
async def delete_budget(
    budget_id: str,
    user: dict = Depends(require_perm("finance.budget.delete")),
):
    """Archive budget."""
    await budget_service.delete_budget(budget_id)
    return ok_envelope({"message": "Budget deleted"})


@router.get("/vs-actual")
async def budget_vs_actual(
    period: str = Query(..., description="YYYY-MM"),
    outlet_id: Optional[str] = Query(None),
    level: str = Query("coa", description="coa | category | both"),
    user: dict = Depends(require_perm("finance.budget.read")),
):
    """Budget vs Actual report.
    
    Returns:
      - coa_level: [{coa_id, coa_code, coa_name, budgeted, actual, variance, variance_pct}]
      - category_level: [{category, budgeted, actual, variance, variance_pct}]
    """
    result = await budget_service.vs_actual(period, outlet_id=outlet_id, level=level)
    return ok_envelope(result)


@router.post("/import-csv")
async def import_budget_csv(
    file: UploadFile = File(...),
    period: str = Query(...),
    outlet_id: Optional[str] = Query(None),
    user: dict = Depends(require_perm("finance.budget.create")),
):
    """Import budget from CSV file.
    
    CSV format:
      coa_code, amount, category (optional)
    """
    content = await file.read()
    result = await budget_service.import_csv(
        csv_content=content.decode("utf-8"),
        period=period,
        user_id=user["id"],
    )
    return ok_envelope(result)



@router.post("/import-excel")
async def import_budget_excel(
    file: UploadFile = File(...),
    period: str = Query(..., description="YYYY-MM"),
    outlet_id: Optional[str] = Query(None),
    user: dict = Depends(require_perm("finance.budget.create")),
):
    """Import budget from Excel (.xlsx) file.

    Excel format (row 1 = header):
      coa_code | coa_name | amount | category (optional)
    """
    content = await file.read()
    result = await budget_service.import_excel(
        file_bytes=content,
        period=period,
        outlet_id=outlet_id,
        user_id=user["id"],
    )
    return ok_envelope(result)


@router.get("/template-excel")
async def download_budget_template(
    user: dict = Depends(require_perm("finance.budget.create")),
):
    """Download Budget Excel import template."""
    from fastapi.responses import Response
    import io
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Budget Template"
    headers = ["coa_code", "coa_name", "amount", "category"]
    ws.append(headers)
    sample = [
        ["5001", "Biaya Bahan Makanan", 10000000, "food_cost"],
        ["5002", "Biaya Minuman", 2000000, "beverage_cost"],
        ["6001", "Biaya Gaji Karyawan", 25000000, "labor_cost"],
        ["6101", "Biaya Sewa", 5000000, "rent"],
    ]
    for row in sample:
        ws.append(row)
    from openpyxl.styles import Font
    for cell in ws[1]:
        cell.font = Font(bold=True)
    ws.column_dimensions["A"].width = 15
    ws.column_dimensions["B"].width = 35
    ws.column_dimensions["C"].width = 20
    ws.column_dimensions["D"].width = 20
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return Response(
        content=buf.read(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=budget_template.xlsx"},
    )
