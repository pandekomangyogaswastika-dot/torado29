"""CMS Advanced — Content Versioning + Media Library + Approval Workflow + Analytics + Bulk Ops.

Sprint I-L additions:
- Approval Workflow: submit-for-review, approve, reject, pending-reviews, workflow-history
- Bulk Operations: bulk-action per content type
- Analytics: track (public), overview + popular (admin)
- Custom Pages (Page Builder): CRUD for custom_pages collection
- Image Optimization: Pillow-based WebP variants on upload
"""
from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException, Body
from typing import Optional, List
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
import io
import asyncio

from core.db import get_db
from core.exceptions import ok_envelope, NotFoundError, ValidationError
from core.security import current_user, require_perm

router = APIRouter(prefix="/api/admin/cms", tags=["cms-advanced"])

# Upload dirs
UPLOAD_DIR = Path("/app/backend/uploads")
THUMBS_DIR = UPLOAD_DIR / "thumbs"
MEDIUM_DIR = UPLOAD_DIR / "medium"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
THUMBS_DIR.mkdir(parents=True, exist_ok=True)
MEDIUM_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_BYTES = 10 * 1024 * 1024

CONTENT_COLLECTION_MAP = {
    "brand": "public_brands",
    "news": "public_news",
    "outlet": "public_outlets",
    "menu": "public_menu_items",
}

WORKFLOW_STATUSES = ["draft", "pending_review", "approved", "rejected", "published"]

NOW = lambda: datetime.now(timezone.utc)  # noqa


# ============================================================================
# HELPERS
# ============================================================================

async def create_version_snapshot(content_type, item_id, data, saved_by):
    """Create a version snapshot of a CMS item before it is updated."""
    db = get_db()
    last = await db.content_versions.find_one(
        {"content_type": content_type, "item_id": item_id},
        sort=[("version_num", -1)],
    )
    version_num = (last["version_num"] + 1) if last else 1
    snapshot = {
        "id": str(uuid.uuid4()),
        "content_type": content_type,
        "item_id": item_id,
        "version_num": version_num,
        "data": data,
        "saved_at": NOW(),
        "saved_by": saved_by,
        "change_summary": f"v{version_num} saved by {saved_by}",
    }
    await db.content_versions.insert_one(snapshot)
    return version_num


async def _append_workflow_history(db, content_type, item_id, from_status, to_status, actor, comment=""):
    """Append an entry to cms_workflow_history."""
    await db.cms_workflow_history.insert_one({
        "id": str(uuid.uuid4()),
        "content_type": content_type,
        "item_id": item_id,
        "from_status": from_status,
        "to_status": to_status,
        "actor": actor,
        "comment": comment,
        "created_at": NOW(),
    })


def _serialize_doc(doc):
    """Recursively convert datetime objects to ISO strings."""
    if isinstance(doc, dict):
        return {k: _serialize_doc(v) for k, v in doc.items()}
    if isinstance(doc, list):
        return [_serialize_doc(i) for i in doc]
    if hasattr(doc, "isoformat"):
        return doc.isoformat()
    return doc


def _process_image_variants(content: bytes, stem: str):
    """Generate thumbnail + medium WebP variants with Pillow."""
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(content))
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGB")

        variants = {}

        # Thumbnail — 300px wide, proportional height
        thumb = img.copy()
        thumb.thumbnail((300, 300))
        thumb_name = f"{stem}_thumb.webp"
        thumb_path = THUMBS_DIR / thumb_name
        thumb.save(thumb_path, "WEBP", quality=80)
        variants["thumbnail"] = {"url": f"/uploads/thumbs/{thumb_name}", "width": thumb.width, "height": thumb.height}

        # Medium — 800px wide, proportional
        med = img.copy()
        med.thumbnail((800, 800))
        med_name = f"{stem}_medium.webp"
        med_path = MEDIUM_DIR / med_name
        med.save(med_path, "WEBP", quality=85)
        variants["medium"] = {"url": f"/uploads/medium/{med_name}", "width": med.width, "height": med.height}

        # Original dimensions
        variants["original"] = {"width": img.width, "height": img.height}

        return variants
    except Exception as e:
        return {"error": str(e)}


# ============================================================================
# ANALYTICS TRACKING (no-auth, called by public pages)
# ============================================================================

@router.post("/analytics/track")
async def track_page_view_admin(payload: dict = Body(...)):
    """Track a page view event. No auth required — lightweight fire-and-forget."""
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
    return ok_envelope({"tracked": True})


# ============================================================================
# ANALYTICS ADMIN DASHBOARD
# ============================================================================

@router.get("/analytics/overview")
async def analytics_overview(
    days: int = Query(30, ge=7, le=365),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Analytics overview: total views, daily trend, top content."""
    db = get_db()
    since = (NOW() - timedelta(days=days)).date().isoformat()

    # Daily trend aggregation
    pipeline = [
        {"$match": {"date": {"$gte": since}}},
        {"$group": {"_id": "$date", "views": {"$sum": "$views"}}},
        {"$sort": {"_id": 1}},
    ]
    daily = await db.content_analytics_daily.aggregate(pipeline).to_list(length=400)
    daily_trend = [{"date": d["_id"], "views": d["views"]} for d in daily]

    # Total views
    total_views_all = sum(d["views"] for d in daily)
    since_7 = (NOW() - timedelta(days=7)).date().isoformat()
    total_views_7d = sum(d["views"] for d in daily if d["_id"] >= since_7)

    # By content type
    by_type_pipeline = [
        {"$match": {"date": {"$gte": since}}},
        {"$group": {"_id": "$content_type", "views": {"$sum": "$views"}}},
        {"$sort": {"views": -1}},
    ]
    by_type = await db.content_analytics_daily.aggregate(by_type_pipeline).to_list(length=20)
    by_type_map = {b["_id"]: b["views"] for b in by_type}

    return ok_envelope({
        "total_views": total_views_all,
        "views_7d": total_views_7d,
        "daily_trend": daily_trend,
        "by_type": by_type_map,
        "period_days": days,
    })


@router.get("/analytics/popular")
async def analytics_popular(
    days: int = Query(30, ge=1, le=365),
    content_type: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Top content by page views."""
    db = get_db()
    since = (NOW() - timedelta(days=days)).date().isoformat()
    match = {"date": {"$gte": since}}
    if content_type:
        match["content_type"] = content_type

    pipeline = [
        {"$match": match},
        {"$group": {"_id": {"content_type": "$content_type", "content_id": "$content_id"}, "views": {"$sum": "$views"}}},
        {"$sort": {"views": -1}},
        {"$limit": limit},
    ]
    results = await db.content_analytics_daily.aggregate(pipeline).to_list(length=limit)

    # Enrich with content titles
    enriched = []
    for r in results:
        ct = r["_id"]["content_type"]
        cid = r["_id"]["content_id"]
        coll = CONTENT_COLLECTION_MAP.get(ct)
        title = cid
        if coll:
            doc = await getattr(db, coll).find_one({"id": cid}, {"name": 1, "title": 1, "_id": 0})
            if doc:
                title = doc.get("name") or doc.get("title") or cid
        enriched.append({"content_type": ct, "content_id": cid, "title": title, "views": r["views"]})

    return ok_envelope(enriched)


# ============================================================================
# APPROVAL WORKFLOW ENDPOINTS
# ============================================================================

@router.get("/pending-reviews")
async def list_pending_reviews(
    content_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """List all CMS items awaiting review across all content types."""
    db = get_db()
    results = []

    types_to_check = [content_type] if content_type else list(CONTENT_COLLECTION_MAP.keys())
    for ct in types_to_check:
        coll_name = CONTENT_COLLECTION_MAP.get(ct)
        if not coll_name:
            continue
        coll = getattr(db, coll_name)
        docs = await coll.find(
            {"deleted_at": None, "workflow_status": "pending_review"},
            {"_id": 0},
        ).sort("updated_at", 1).to_list(length=100)
        for doc in docs:
            doc["_content_type"] = ct
            results.append(_serialize_doc(doc))

    total = len(results)
    start = (page - 1) * page_size
    paginated = results[start:start + page_size]
    return ok_envelope({"items": paginated, "total": total, "page": page, "page_size": page_size})


@router.post("/{content_type}/{item_id}/submit-for-review")
async def submit_for_review(
    content_type: str,
    item_id: str,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Submit a CMS item for review (changes workflow_status to pending_review)."""
    if content_type not in CONTENT_COLLECTION_MAP:
        raise ValidationError(f"Invalid content type: {content_type}")
    db = get_db()
    coll = getattr(db, CONTENT_COLLECTION_MAP[content_type])
    item = await coll.find_one({"id": item_id, "deleted_at": None})
    if not item:
        raise NotFoundError("Item tidak ditemukan")

    old_status = item.get("workflow_status", "draft")
    if old_status == "pending_review":
        raise ValidationError("Item sudah dalam antrian review")

    actor = user.get("email", "unknown")
    await coll.update_one(
        {"id": item_id},
        {"$set": {"workflow_status": "pending_review", "submitted_by": actor, "submitted_at": NOW(), "updated_at": NOW()}},
    )
    await _append_workflow_history(db, content_type, item_id, old_status, "pending_review", actor, "Submitted for review")
    return ok_envelope({"workflow_status": "pending_review", "message": "Berhasil dikirim untuk review"})


@router.post("/{content_type}/{item_id}/approve")
async def approve_content(
    content_type: str,
    item_id: str,
    payload: dict = Body(default={}),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Approve a CMS item and publish it."""
    if content_type not in CONTENT_COLLECTION_MAP:
        raise ValidationError(f"Invalid content type: {content_type}")
    db = get_db()
    coll = getattr(db, CONTENT_COLLECTION_MAP[content_type])
    item = await coll.find_one({"id": item_id, "deleted_at": None})
    if not item:
        raise NotFoundError("Item tidak ditemukan")

    old_status = item.get("workflow_status", "draft")
    actor = user.get("email", "unknown")
    comment = payload.get("comment", "Approved")

    await coll.update_one(
        {"id": item_id},
        {"$set": {
            "workflow_status": "published",
            "status": "published",
            "reviewed_by": actor,
            "reviewed_at": NOW(),
            "review_comment": comment,
            "published_by": actor,
            "updated_at": NOW(),
        }},
    )
    await _append_workflow_history(db, content_type, item_id, old_status, "published", actor, comment or "Approved and published")
    return ok_envelope({"workflow_status": "published", "status": "published", "message": "Konten disetujui dan dipublish"})


@router.post("/{content_type}/{item_id}/reject")
async def reject_content(
    content_type: str,
    item_id: str,
    payload: dict = Body(default={}),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Reject a CMS item with a comment. Returns to draft state."""
    if content_type not in CONTENT_COLLECTION_MAP:
        raise ValidationError(f"Invalid content type: {content_type}")
    db = get_db()
    coll = getattr(db, CONTENT_COLLECTION_MAP[content_type])
    item = await coll.find_one({"id": item_id, "deleted_at": None})
    if not item:
        raise NotFoundError("Item tidak ditemukan")

    old_status = item.get("workflow_status", "pending_review")
    actor = user.get("email", "unknown")
    comment = payload.get("comment", "Rejected")

    await coll.update_one(
        {"id": item_id},
        {"$set": {
            "workflow_status": "rejected",
            "reviewed_by": actor,
            "reviewed_at": NOW(),
            "review_comment": comment,
            "updated_at": NOW(),
        }},
    )
    await _append_workflow_history(db, content_type, item_id, old_status, "rejected", actor, comment)
    return ok_envelope({"workflow_status": "rejected", "message": "Konten ditolak"})


@router.get("/{content_type}/{item_id}/workflow-history")
async def get_workflow_history(
    content_type: str,
    item_id: str,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Get workflow history for a CMS item."""
    if content_type not in CONTENT_COLLECTION_MAP:
        raise ValidationError(f"Invalid content type: {content_type}")
    db = get_db()
    docs = await db.cms_workflow_history.find(
        {"content_type": content_type, "item_id": item_id},
        {"_id": 0},
        sort=[("created_at", -1)],
    ).to_list(length=50)
    return ok_envelope([_serialize_doc(d) for d in docs])


# ============================================================================
# BULK OPERATIONS
# ============================================================================

@router.post("/{content_type}/bulk-action")
async def bulk_action(
    content_type: str,
    payload: dict = Body(...),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Bulk publish/unpublish/delete CMS items."""
    if content_type not in CONTENT_COLLECTION_MAP:
        raise ValidationError(f"Invalid content type: {content_type}")
    action = payload.get("action")  # "publish" | "unpublish" | "delete"
    ids = payload.get("ids", [])
    if not action or not ids:
        raise ValidationError("action and ids required")
    if action not in ("publish", "unpublish", "delete"):
        raise ValidationError("action must be publish/unpublish/delete")

    db = get_db()
    coll = getattr(db, CONTENT_COLLECTION_MAP[content_type])
    results = {"success": [], "failed": []}

    for item_id in ids:
        try:
            if action == "publish":
                await coll.update_one(
                    {"id": item_id, "deleted_at": None},
                    {"$set": {"status": "published", "workflow_status": "published", "updated_at": NOW()}},
                )
            elif action == "unpublish":
                await coll.update_one(
                    {"id": item_id, "deleted_at": None},
                    {"$set": {"status": "draft", "workflow_status": "draft", "updated_at": NOW()}},
                )
            elif action == "delete":
                await coll.update_one(
                    {"id": item_id, "deleted_at": None},
                    {"$set": {"deleted_at": NOW()}},
                )
            results["success"].append(item_id)
        except Exception as e:
            results["failed"].append({"id": item_id, "error": str(e)})

    return ok_envelope(results)


# ============================================================================
# CUSTOM PAGES (Page Builder)
# ============================================================================

@router.get("/pages")
async def list_pages(
    status: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """List custom pages."""
    db = get_db()
    query = {"deleted_at": None}
    if status:
        query["status"] = status
    if q:
        query["$or"] = [{"title": {"$regex": q, "$options": "i"}}, {"slug": {"$regex": q, "$options": "i"}}]
    total = await db.custom_pages.count_documents(query)
    skip = (page - 1) * page_size
    items = await db.custom_pages.find(query, {"_id": 0}).sort("updated_at", -1).skip(skip).limit(page_size).to_list(length=page_size)
    return ok_envelope({"items": [_serialize_doc(i) for i in items], "total": total, "page": page, "page_size": page_size})


@router.post("/pages")
async def create_page(
    payload: dict = Body(...),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Create a custom page."""
    if not payload.get("title") or not payload.get("slug"):
        raise ValidationError("title and slug required")
    db = get_db()
    existing = await db.custom_pages.find_one({"slug": payload["slug"], "deleted_at": None})
    if existing:
        raise ValidationError(f"Slug '{payload['slug']}' sudah digunakan")

    now = NOW()
    page_id = str(uuid.uuid4())
    doc = {
        "id": page_id,
        "title": payload["title"],
        "slug": payload["slug"],
        "description": payload.get("description", ""),
        "status": payload.get("status", "draft"),
        "blocks": payload.get("blocks", []),
        "seo_title": payload.get("seo_title", ""),
        "seo_description": payload.get("seo_description", ""),
        "seo_og_image": payload.get("seo_og_image", ""),
        "publish_at": payload.get("publish_at"),
        "unpublish_at": payload.get("unpublish_at"),
        "created_by": user.get("email", "unknown"),
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    }
    await db.custom_pages.insert_one(doc)
    return ok_envelope(_serialize_doc({k: v for k, v in doc.items() if k != "_id"}))


@router.get("/pages/{page_id}")
async def get_page(
    page_id: str,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Get a single custom page by ID."""
    db = get_db()
    doc = await db.custom_pages.find_one({"id": page_id, "deleted_at": None}, {"_id": 0})
    if not doc:
        raise NotFoundError("Halaman tidak ditemukan")
    return ok_envelope(_serialize_doc(doc))


@router.put("/pages/{page_id}")
async def update_page(
    page_id: str,
    payload: dict = Body(...),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Update a custom page."""
    db = get_db()
    doc = await db.custom_pages.find_one({"id": page_id, "deleted_at": None})
    if not doc:
        raise NotFoundError("Halaman tidak ditemukan")

    # Slug uniqueness check
    new_slug = payload.get("slug", doc["slug"])
    if new_slug != doc["slug"]:
        existing = await db.custom_pages.find_one({"slug": new_slug, "id": {"$ne": page_id}, "deleted_at": None})
        if existing:
            raise ValidationError(f"Slug '{new_slug}' sudah digunakan")

    allowed = {"title", "slug", "description", "status", "blocks", "seo_title", "seo_description", "seo_og_image", "publish_at", "unpublish_at"}
    update_data = {k: v for k, v in payload.items() if k in allowed}
    update_data["updated_at"] = NOW()
    await db.custom_pages.update_one({"id": page_id}, {"$set": update_data})
    updated = await db.custom_pages.find_one({"id": page_id}, {"_id": 0})
    return ok_envelope(_serialize_doc(updated))


@router.delete("/pages/{page_id}")
async def delete_page(
    page_id: str,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Soft delete a custom page."""
    db = get_db()
    doc = await db.custom_pages.find_one({"id": page_id, "deleted_at": None})
    if not doc:
        raise NotFoundError("Halaman tidak ditemukan")
    await db.custom_pages.update_one({"id": page_id}, {"$set": {"deleted_at": NOW()}})
    return ok_envelope({"message": "Halaman dihapus"})


# ============================================================================
# VERSIONING ENDPOINTS
# ============================================================================

@router.get("/{content_type}/{item_id}/versions")
async def list_versions(
    content_type: str,
    item_id: str,
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """List version history for a CMS item."""
    if content_type not in CONTENT_COLLECTION_MAP:
        raise ValidationError(f"Invalid content type: {content_type}. Valid: {list(CONTENT_COLLECTION_MAP.keys())}")
    db = get_db()
    versions = await db.content_versions.find(
        {"content_type": content_type, "item_id": item_id},
        {"_id": 0, "data": 0},
        sort=[("version_num", -1)],
        limit=limit,
    ).to_list(length=limit)
    return ok_envelope([_serialize_doc(v) for v in versions])


@router.get("/{content_type}/{item_id}/versions/{version_num}")
async def get_version_detail(
    content_type: str,
    item_id: str,
    version_num: int,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Get full snapshot data for a specific version."""
    if content_type not in CONTENT_COLLECTION_MAP:
        raise ValidationError(f"Invalid content type: {content_type}")
    db = get_db()
    version = await db.content_versions.find_one(
        {"content_type": content_type, "item_id": item_id, "version_num": version_num},
        {"_id": 0},
    )
    if not version:
        raise NotFoundError("Version tidak ditemukan")
    return ok_envelope(_serialize_doc(version))


@router.post("/{content_type}/{item_id}/versions/{version_num}/restore")
async def restore_version(
    content_type: str,
    item_id: str,
    version_num: int,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Restore a CMS item to a previous version snapshot."""
    if content_type not in CONTENT_COLLECTION_MAP:
        raise ValidationError(f"Invalid content type: {content_type}")
    db = get_db()
    collection_name = CONTENT_COLLECTION_MAP[content_type]
    version = await db.content_versions.find_one(
        {"content_type": content_type, "item_id": item_id, "version_num": version_num},
    )
    if not version:
        raise NotFoundError("Version tidak ditemukan")
    collection = getattr(db, collection_name)
    current = await collection.find_one({"id": item_id, "deleted_at": None})
    if not current:
        raise NotFoundError("Item tidak ditemukan")
    await create_version_snapshot(
        content_type=content_type, item_id=item_id,
        data={k: v for k, v in current.items() if k != "_id"},
        saved_by=user.get("email", "system"),
    )
    restore_data = {k: v for k, v in version["data"].items() if k not in ("_id", "id", "created_at")}
    restore_data["updated_at"] = NOW()
    await collection.update_one({"id": item_id}, {"$set": restore_data})
    return ok_envelope({"message": f"Restored to version {version_num}", "restored_version": version_num})


# ============================================================================
# MEDIA LIBRARY ENDPOINTS
# ============================================================================

@router.get("/media")
async def list_media(
    search: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """List media library items."""
    db = get_db()
    query = {"deleted_at": None}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"alt_text": {"$regex": search, "$options": "i"}},
            {"original_filename": {"$regex": search, "$options": "i"}},
        ]
    if tag:
        query["tags"] = {"$in": [tag]}
    skip = (page - 1) * page_size
    total = await db.media_library.count_documents(query)
    items = await db.media_library.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(page_size).to_list(length=page_size)
    return ok_envelope({"items": [_serialize_doc(i) for i in items], "total": total, "page": page, "page_size": page_size})


@router.post("/media")
async def upload_media(
    file: UploadFile = File(...),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Upload image to media library with WebP variant generation."""
    if file.content_type not in ALLOWED_TYPES:
        raise ValidationError(f"Invalid file type: {file.content_type}. Allowed: {', '.join(ALLOWED_TYPES)}")

    content = await file.read()
    file_size = len(content)
    if file_size > MAX_SIZE_BYTES:
        raise ValidationError(f"File too large: {file_size / 1024 / 1024:.2f}MB. Max: 10MB")

    stem = str(uuid.uuid4())
    file_extension = Path(file.filename).suffix
    unique_filename = f"{stem}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename

    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Generate image variants in background
    loop = asyncio.get_event_loop()
    variants = await loop.run_in_executor(None, _process_image_variants, content, stem)

    now = NOW()
    media_id = str(uuid.uuid4())
    doc = {
        "id": media_id,
        "filename": unique_filename,
        "original_filename": file.filename,
        "url": f"/uploads/{unique_filename}",
        "url_thumbnail": variants.get("thumbnail", {}).get("url"),
        "url_medium": variants.get("medium", {}).get("url"),
        "width": variants.get("original", {}).get("width"),
        "height": variants.get("original", {}).get("height"),
        "variants": variants,
        "alt_text": Path(file.filename).stem,
        "title": Path(file.filename).stem,
        "file_size": file_size,
        "content_type": file.content_type,
        "tags": [],
        "uploaded_by": user.get("email", "unknown"),
        "created_at": now,
        "deleted_at": None,
    }
    db = get_db()
    await db.media_library.insert_one(doc)

    return ok_envelope({
        "id": media_id,
        "url": doc["url"],
        "url_thumbnail": doc["url_thumbnail"],
        "url_medium": doc["url_medium"],
        "filename": unique_filename,
        "original_filename": file.filename,
        "file_size": file_size,
        "variants": variants,
    })


@router.post("/media/bulk")
async def upload_media_bulk(
    files: List[UploadFile] = File(...),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Bulk upload multiple images to media library."""
    results = []
    for file in files:
        if file.content_type not in ALLOWED_TYPES:
            results.append({"filename": file.filename, "error": "Invalid file type"})
            continue
        content = await file.read()
        if len(content) > MAX_SIZE_BYTES:
            results.append({"filename": file.filename, "error": "File too large"})
            continue
        stem = str(uuid.uuid4())
        ext = Path(file.filename).suffix
        fname = f"{stem}{ext}"
        fpath = UPLOAD_DIR / fname
        with open(fpath, "wb") as f:
            f.write(content)
        loop = asyncio.get_event_loop()
        variants = await loop.run_in_executor(None, _process_image_variants, content, stem)
        now = NOW()
        media_id = str(uuid.uuid4())
        doc = {
            "id": media_id, "filename": fname, "original_filename": file.filename,
            "url": f"/uploads/{fname}",
            "url_thumbnail": variants.get("thumbnail", {}).get("url"),
            "url_medium": variants.get("medium", {}).get("url"),
            "variants": variants,
            "alt_text": Path(file.filename).stem, "title": Path(file.filename).stem,
            "file_size": len(content), "content_type": file.content_type,
            "tags": [], "uploaded_by": user.get("email", "unknown"),
            "created_at": now, "deleted_at": None,
        }
        db = get_db()
        await db.media_library.insert_one(doc)
        results.append({"id": media_id, "filename": fname, "original_filename": file.filename, "url": doc["url"]})
    return ok_envelope({"uploaded": len([r for r in results if "error" not in r]), "results": results})


@router.put("/media/{media_id}")
async def update_media_metadata(
    media_id: str,
    payload: dict,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Update media metadata."""
    db = get_db()
    item = await db.media_library.find_one({"id": media_id, "deleted_at": None})
    if not item:
        raise NotFoundError("Media tidak ditemukan")
    allowed = {"title", "alt_text", "tags"}
    update_data = {k: v for k, v in payload.items() if k in allowed}
    if update_data:
        await db.media_library.update_one({"id": media_id}, {"$set": update_data})
    return ok_envelope({"message": "Media updated"})


@router.delete("/media/{media_id}")
async def delete_media(
    media_id: str,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Soft delete media library item."""
    db = get_db()
    item = await db.media_library.find_one({"id": media_id, "deleted_at": None})
    if not item:
        raise NotFoundError("Media tidak ditemukan")
    await db.media_library.update_one({"id": media_id}, {"$set": {"deleted_at": NOW()}})
    return ok_envelope({"message": "Media deleted"})
