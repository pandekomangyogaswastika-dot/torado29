"""Sprint D — Public API (read-only, no auth) untuk Compro content.
Sprint I-L additions: analytics tracking, custom pages public endpoints.

Endpoints:
- GET /api/public/brands
- GET /api/public/brands/:id
- GET /api/public/outlets
- GET /api/public/news
- GET /api/public/news/:id
- GET /api/public/menu
- POST /api/public/analytics/track   (new Sprint K)
- GET  /api/public/pages             (new Sprint L)
- GET  /api/public/pages/:slug       (new Sprint L)
"""
from fastapi import APIRouter, Query, Body
from typing import Optional
from datetime import datetime, timezone
import uuid
from core.db import get_db
from core.exceptions import ok_envelope, NotFoundError
from models.public_content import PublicBrand, PublicOutlet, PublicNews, PublicMenuItem

router = APIRouter(prefix="/api/public", tags=["public"])

NOW = lambda: datetime.now(timezone.utc)  # noqa: E731


def _schedule_filter() -> dict:
    """Build Mongo filter that excludes future-scheduled and already-expired content."""
    now = NOW()
    return {
        "$or": [
            {"publish_at": None},
            {"publish_at": {"$lte": now}},
        ],
        "$and": [
            {
                "$or": [
                    {"unpublish_at": None},
                    {"unpublish_at": {"$gt": now}},
                ]
            }
        ],
    }


def _ser(doc):
    """Serialize datetime objects to ISO strings."""
    if isinstance(doc, dict):
        return {k: _ser(v) for k, v in doc.items()}
    if isinstance(doc, list):
        return [_ser(i) for i in doc]
    if hasattr(doc, "isoformat"):
        return doc.isoformat()
    return doc


# ============================================================================
# ANALYTICS TRACKING (no auth)
# ============================================================================

@router.post("/analytics/track")
async def track_page_view(payload: dict = Body(...)):
    """Track a page view event. Fire-and-forget, no auth needed."""
    try:
        content_type = payload.get("content_type", "unknown")
        content_id = payload.get("content_id", "unknown")
        today = NOW().date().isoformat()
        db = get_db()
        await db.content_analytics_daily.update_one(
            {"content_type": content_type, "content_id": content_id, "date": today},
            {"$inc": {"views": 1}, "$setOnInsert": {
                "id": str(uuid.uuid4()),
                "content_type": content_type,
                "content_id": content_id,
                "date": today,
            }},
            upsert=True,
        )
    except Exception:
        pass  # Tracking is best-effort
    return ok_envelope({"tracked": True})


# ============================================================================
# CUSTOM PAGES (Page Builder — public)
# ============================================================================

@router.get("/pages")
async def get_public_pages():
    """Get all published custom pages."""
    db = get_db()
    pages = await db.custom_pages.find(
        {"deleted_at": None, "status": "published"},
        {"_id": 0, "blocks": 0},  # exclude blocks from listing
    ).sort("updated_at", -1).to_list(length=100)
    return ok_envelope([_ser(p) for p in pages])


@router.get("/pages/{slug}")
async def get_public_page(slug: str):
    """Get a published custom page by slug."""
    db = get_db()
    page = await db.custom_pages.find_one(
        {"slug": slug, "deleted_at": None, "status": "published"},
        {"_id": 0},
    )
    if not page:
        raise NotFoundError("Halaman tidak ditemukan atau belum dipublish")
    return ok_envelope(_ser(page))


# ============================================================================
# ORIGINAL BRAND/OUTLET/NEWS/MENU ENDPOINTS
# ============================================================================

@router.get("/brands")
async def get_brands(status: str = Query("published")):
    """Get all published brands."""
    db = get_db()
    brands = await db.public_brands.find(
        {"deleted_at": None, "status": status, **_schedule_filter()},
        {"_id": 0},
    ).sort("name", 1).to_list(length=100)
    return ok_envelope(brands)


@router.get("/brands/{brand_id}")
async def get_brand_detail(brand_id: str):
    """Get single brand detail."""
    db = get_db()
    brand = await db.public_brands.find_one(
        {"id": brand_id, "deleted_at": None, "status": "published", **_schedule_filter()},
        {"_id": 0},
    )
    if not brand:
        raise NotFoundError("Brand tidak ditemukan atau belum published")
    return ok_envelope(_ser(brand))


@router.get("/outlets")
async def get_outlets(
    status: str = Query("published"),
    brand_id: Optional[str] = Query(None),
):
    """Get all published outlets."""
    db = get_db()
    query = {"deleted_at": None, "status": status, **_schedule_filter()}
    if brand_id:
        query["brand_id"] = brand_id
    outlets = await db.public_outlets.find(query, {"_id": 0}).sort("name", 1).to_list(length=200)
    return ok_envelope(outlets)


@router.get("/news")
async def get_news(
    status: str = Query("published"),
    category: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
):
    """Get published news."""
    db = get_db()
    query = {"deleted_at": None, "status": status, **_schedule_filter()}
    if category:
        query["category"] = category
    news = await db.public_news.find(query, {"_id": 0}).sort("date", -1).limit(limit).to_list(length=limit)
    return ok_envelope(news)


@router.get("/news/{news_id}")
async def get_news_detail(news_id: str):
    """Get single news article."""
    db = get_db()
    news = await db.public_news.find_one(
        {"id": news_id, "deleted_at": None, "status": "published", **_schedule_filter()},
        {"_id": 0},
    )
    if not news:
        news = await db.public_news.find_one(
            {"seo_slug": news_id, "deleted_at": None, "status": "published", **_schedule_filter()},
            {"_id": 0},
        )
    if not news:
        raise NotFoundError("Artikel tidak ditemukan atau belum published")
    return ok_envelope(_ser(news))


@router.get("/menu")
async def get_menu_items(
    brand_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: str = Query("published"),
    available: Optional[bool] = Query(None),
):
    """Get menu items."""
    db = get_db()
    query = {"deleted_at": None, "status": status, **_schedule_filter()}
    if brand_id:
        query["brand_id"] = brand_id
    if category:
        query["category"] = category
    if available is not None:
        query["available"] = available
    menu_items = await db.public_menu_items.find(query, {"_id": 0}).sort(
        [("brand_name", 1), ("category", 1), ("name", 1)]
    ).to_list(length=500)
    return ok_envelope(menu_items)


# ─── Sprint Compro-Next: Careers/Jobs public endpoint ─────────────────────────
@router.get("/jobs")
async def get_public_jobs(
    department: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
):
    """Get active job listings (public, no auth required)."""
    db = get_db()
    query: dict = {"is_active": True}
    if department and department != "All":
        query["department"] = department
    if job_type:
        query["job_type"] = job_type
    cursor = db.job_listings.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
    jobs = await cursor.to_list(length=limit)
    # Serialize datetime fields
    result = []
    for j in jobs:
        for f in ("created_at", "updated_at"):
            if f in j and hasattr(j[f], "isoformat"):
                j[f] = j[f].isoformat()
        result.append(j)
    return ok_envelope(result)
