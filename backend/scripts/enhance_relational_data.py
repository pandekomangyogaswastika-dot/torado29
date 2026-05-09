"""Enhanced Migration - Create Proper Relational Data.

This script fixes all missing relationships and creates realistic, connected data.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import uuid
import random
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("enhance_data")

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "aurora"


def _now():
    return datetime.now(timezone.utc).isoformat()


async def fix_item_category_references(db):
    """Link items to proper category IDs."""
    logger.info("Fixing item category references...")
    
    # Get all categories
    categories = await db.categories.find({}).to_list(100)
    category_map = {c["name"]: c["id"] for c in categories}
    
    # Update all items
    items = await db.items.find({}).to_list(1000)
    updated = 0
    
    for item in items:
        cat_name = item.get("category", "General")
        cat_id = category_map.get(cat_name)
        
        if cat_id:
            await db.items.update_one(
                {"id": item["id"]},
                {"$set": {"category_id": cat_id, "updated_at": _now()}}
            )
            updated += 1
    
    logger.info(f"  ✅ Updated {updated} items with category_id")


async def create_employees(db, outlets):
    """Create employees per outlet."""
    logger.info("Creating employees...")
    
    roles = [
        {"title": "Outlet Manager", "count": 1},
        {"title": "Head Chef", "count": 1},
        {"title": "Chef", "count": 2},
        {"title": "Waiter/Waitress", "count": 3},
        {"title": "Cashier", "count": 1},
    ]
    
    employees = []
    emp_no = 1
    
    for outlet in outlets:
        for role in roles:
            for i in range(role["count"]):
                emp = {
                    "id": str(uuid.uuid4()),
                    "employee_no": f"EMP-{emp_no:04d}",
                    "name": f"{role['title']} {i+1}",
                    "email": f"emp{emp_no}@torado.id",
                    "phone": f"08{random.randint(1000000000, 1999999999)}",
                    "position": role["title"],
                    "outlet_id": outlet["id"],
                    "brand_id": outlet["brand_id"],
                    "hire_date": (datetime.now(timezone.utc) - timedelta(days=random.randint(30, 365))).strftime("%Y-%m-%d"),
                    "salary": random.randint(4000000, 12000000),
                    "status": "active",
                    "created_at": _now(),
                    "updated_at": _now(),
                }
                employees.append(emp)
                emp_no += 1
    
    if employees:
        await db.employees.insert_many(employees)
        logger.info(f"  ✅ Created {len(employees)} employees")
    
    return employees


async def create_goods_receipts_from_pos(db, pos, coa):
    """Create goods receipts from purchase orders with proper workflow."""
    logger.info("Creating goods receipts from purchase orders...")
    
    # Find COA for inventory and AP
    inventory_coa = next((c for c in coa if c["code"] == "1301"), None)
    ap_coa = next((c for c in coa if c["code"] == "2101"), None)
    
    if not inventory_coa or not ap_coa:
        logger.warning("  ⚠ Missing COA for GR journal entries")
        return []
    
    grs = []
    
    for po in pos:
        # Create GR from PO
        receive_date = po.get("po_date")
        if receive_date:
            # Receive 2-3 days after PO date
            receive_dt = datetime.fromisoformat(receive_date) + timedelta(days=random.randint(2, 3))
            receive_date = receive_dt.strftime("%Y-%m-%d")
        else:
            receive_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        gr = {
            "id": str(uuid.uuid4()),
            "doc_no": f"GR-{po['doc_no'].split('-')[1]}",
            "po_id": po["id"],
            "po_no": po["doc_no"],
            "vendor_id": po["vendor_id"],
            "outlet_id": po["outlet_id"],
            "receive_date": receive_date,
            "invoice_no": f"INV-{random.randint(10000, 99999)}",
            "invoice_date": receive_date,
            "due_date": (datetime.fromisoformat(receive_date) + timedelta(days=30)).strftime("%Y-%m-%d"),
            "items": po["items"],
            "total_amount": po["total_amount"],
            "status": "received",
            "payments": [],  # Belum dibayar
            "notes": f"Goods received for {po['doc_no']}",
            "created_by": po.get("created_by"),
            "created_at": _now(),
            "updated_at": _now(),
        }
        grs.append(gr)
    
    if grs:
        await db.goods_receipts.insert_many(grs)
        logger.info(f"  ✅ Created {len(grs)} goods receipts")
    
    return grs


async def create_ap_ledgers_from_grs(db, grs):
    """Create AP ledger entries from goods receipts."""
    logger.info("Creating AP ledger entries...")
    
    ap_ledgers = []
    
    for gr in grs:
        ap = {
            "id": str(uuid.uuid4()),
            "doc_no": f"AP-{gr['doc_no'].split('-')[1]}",
            "gr_id": gr["id"],
            "vendor_id": gr["vendor_id"],
            "outlet_id": gr["outlet_id"],
            "invoice_no": gr["invoice_no"],
            "invoice_date": gr["invoice_date"],
            "due_date": gr["due_date"],
            "amount": gr["total_amount"],
            "paid_amount": 0,  # Belum dibayar
            "outstanding": gr["total_amount"],
            "status": "open",
            "payments": [],
            "created_at": _now(),
            "updated_at": _now(),
        }
        ap_ledgers.append(ap)
    
    if ap_ledgers:
        await db.ap_ledgers.insert_many(ap_ledgers)
        logger.info(f"  ✅ Created {len(ap_ledgers)} AP ledger entries")
    
    return ap_ledgers


async def create_journal_entries_from_sales(db, sales, coa):
    """Create journal entries from daily sales."""
    logger.info("Creating journal entries from sales...")
    
    # Find COA
    cash_coa = next((c for c in coa if c["code"] == "1101"), None)
    food_revenue_coa = next((c for c in coa if c["code"] == "4101"), None)
    beverage_revenue_coa = next((c for c in coa if c["code"] == "4102"), None)
    service_revenue_coa = next((c for c in coa if c["code"] == "4103"), None)
    
    if not all([cash_coa, food_revenue_coa, beverage_revenue_coa, service_revenue_coa]):
        logger.warning("  ⚠ Missing COA for sales journal entries")
        return []
    
    journals = []
    
    for sale in sales:
        # Create journal entry for daily sales
        entry_date = sale.get("sale_date")
        
        lines = []
        
        # Debit Cash (total sales)
        lines.append({
            "coa_id": cash_coa["id"],
            "coa_code": cash_coa["code"],
            "coa_name": cash_coa["name"],
            "dr": sale["total_sales"],
            "cr": 0,
            "memo": f"Daily sales {entry_date}",
        })
        
        # Credit Food Sales
        if sale.get("food_sales", 0) > 0:
            lines.append({
                "coa_id": food_revenue_coa["id"],
                "coa_code": food_revenue_coa["code"],
                "coa_name": food_revenue_coa["name"],
                "dr": 0,
                "cr": sale["food_sales"],
                "memo": "Food sales",
            })
        
        # Credit Beverage Sales
        if sale.get("beverage_sales", 0) > 0:
            lines.append({
                "coa_id": beverage_revenue_coa["id"],
                "coa_code": beverage_revenue_coa["code"],
                "coa_name": beverage_revenue_coa["name"],
                "dr": 0,
                "cr": sale["beverage_sales"],
                "memo": "Beverage sales",
            })
        
        # Credit Service Charge
        if sale.get("service_charge", 0) > 0:
            lines.append({
                "coa_id": service_revenue_coa["id"],
                "coa_code": service_revenue_coa["code"],
                "coa_name": service_revenue_coa["name"],
                "dr": 0,
                "cr": sale["service_charge"],
                "memo": "Service charge 5%",
            })
        
        journal = {
            "id": str(uuid.uuid4()),
            "journal_no": f"JE-SALES-{sale['id'][:8]}",
            "entry_date": entry_date,
            "description": f"Daily sales - {entry_date}",
            "reference_type": "daily_sales",
            "reference_id": sale["id"],
            "outlet_id": sale.get("outlet_id"),
            "brand_id": sale.get("brand_id"),
            "lines": lines,
            "total_debit": sale["total_sales"],
            "total_credit": sale["total_sales"],
            "status": "posted",
            "posted_at": _now(),
            "created_by": sale.get("created_by"),
            "created_at": _now(),
            "updated_at": _now(),
        }
        journals.append(journal)
    
    if journals:
        await db.journal_entries.insert_many(journals)
        logger.info(f"  ✅ Created {len(journals)} journal entries from sales")
    
    return journals


async def create_journal_entries_from_purchases(db, grs, coa):
    """Create journal entries from goods receipts (purchases)."""
    logger.info("Creating journal entries from purchases...")
    
    # Find COA
    inventory_coa = next((c for c in coa if c["code"] == "1301"), None)
    ap_coa = next((c for c in coa if c["code"] == "2101"), None)
    
    if not inventory_coa or not ap_coa:
        logger.warning("  ⚠ Missing COA for purchase journal entries")
        return []
    
    journals = []
    
    for gr in grs:
        entry_date = gr.get("receive_date")
        
        lines = [
            # Debit Inventory
            {
                "coa_id": inventory_coa["id"],
                "coa_code": inventory_coa["code"],
                "coa_name": inventory_coa["name"],
                "dr": gr["total_amount"],
                "cr": 0,
                "memo": f"Purchase {gr['doc_no']}",
            },
            # Credit AP
            {
                "coa_id": ap_coa["id"],
                "coa_code": ap_coa["code"],
                "coa_name": ap_coa["name"],
                "dr": 0,
                "cr": gr["total_amount"],
                "memo": f"AP {gr['invoice_no']}",
            }
        ]
        
        journal = {
            "id": str(uuid.uuid4()),
            "journal_no": f"JE-PURCHASE-{gr['id'][:8]}",
            "entry_date": entry_date,
            "description": f"Purchase - {gr['doc_no']}",
            "reference_type": "goods_receipt",
            "reference_id": gr["id"],
            "outlet_id": gr.get("outlet_id"),
            "lines": lines,
            "total_debit": gr["total_amount"],
            "total_credit": gr["total_amount"],
            "status": "posted",
            "posted_at": _now(),
            "created_by": gr.get("created_by"),
            "created_at": _now(),
            "updated_at": _now(),
        }
        journals.append(journal)
    
    if journals:
        await db.journal_entries.insert_many(journals)
        logger.info(f"  ✅ Created {len(journals)} journal entries from purchases")
    
    return journals


async def main():
    """Main enhancement flow."""
    logger.info("=" * 80)
    logger.info("DATA ENHANCEMENT: Creating Relational Data")
    logger.info("=" * 80)
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Get existing data
        coa = await db.chart_of_accounts.find({}).to_list(100)
        outlets = await db.outlets.find({}).to_list(100)
        pos = await db.purchase_orders.find({}).to_list(100)
        sales = await db.daily_sales.find({}).to_list(1000)
        
        # Step 1: Fix item category references
        await fix_item_category_references(db)
        
        # Step 2: Create employees
        await create_employees(db, outlets)
        
        # Step 3: Create goods receipts from POs
        grs = await create_goods_receipts_from_pos(db, pos, coa)
        
        # Step 4: Create AP ledgers
        await create_ap_ledgers_from_grs(db, grs)
        
        # Step 5: Create journal entries from sales
        await create_journal_entries_from_sales(db, sales, coa)
        
        # Step 6: Create journal entries from purchases
        await create_journal_entries_from_purchases(db, grs, coa)
        
        logger.info("=" * 80)
        logger.info("✅ DATA ENHANCEMENT COMPLETE!")
        logger.info("=" * 80)
        
    except Exception as e:
        logger.exception(f"Enhancement failed: {e}")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
