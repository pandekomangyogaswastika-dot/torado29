"""Sprint D — Admin CMS API (CRUD with auth) untuk manage Compro content.

Endpoints:
- Brands: GET/POST/PUT/DELETE /api/admin/cms/brands
- Outlets: GET/POST/PUT/DELETE /api/admin/cms/outlets
- News: GET/POST/PUT/DELETE /api/admin/cms/news
- Menu: GET/POST/PUT/DELETE /api/admin/cms/menu
- Image Upload: POST /api/admin/cms/upload-image
"""
from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, timezone
from pathlib import Path

from core.db import get_db
from core.exceptions import ok_envelope, NotFoundError, ValidationError
from core.security import current_user, require_perm
from models.public_content import (
    CreateBrandRequest, UpdateBrandRequest,
    CreateOutletRequest, UpdateOutletRequest,
    CreateNewsRequest, UpdateNewsRequest,
    CreateMenuItemRequest, UpdateMenuItemRequest,
)
from routers.cms_advanced import create_version_snapshot

router = APIRouter(prefix="/api/admin/cms", tags=["admin-cms"])

# Configure upload directory
UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed image types and max size
ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_SIZE_MB = 5
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024


# ============================================================================
# BRANDS CRUD
# ============================================================================

@router.get("/brands")
async def admin_list_brands(
    status: Optional[str] = Query(None),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: List all brands (including drafts)."""
    db = get_db()
    query = {"deleted_at": None}
    if status:
        query["status"] = status
    
    brands = await db.public_brands.find(query, {"_id": 0}).sort("name", 1).to_list(length=100)
    return ok_envelope(brands)


@router.post("/brands")
async def admin_create_brand(
    payload: CreateBrandRequest,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: Create new brand."""
    db = get_db()
    
    # Check code uniqueness
    existing = await db.public_brands.find_one({"code": payload.code, "deleted_at": None})
    if existing:
        raise ValidationError(f"Brand code '{payload.code}' sudah digunakan")
    
    brand_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    doc = {
        "id": brand_id,
        **payload.dict(),
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    }
    
    await db.public_brands.insert_one(doc)
    return ok_envelope({"id": brand_id, "message": "Brand created successfully"})


@router.put("/brands/{brand_id}")
async def admin_update_brand(
    brand_id: str,
    payload: UpdateBrandRequest,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: Update brand."""
    db = get_db()
    
    brand = await db.public_brands.find_one({"id": brand_id, "deleted_at": None})
    if not brand:
        raise NotFoundError("Brand tidak ditemukan")
    
    # Create version snapshot before update
    await create_version_snapshot(
        content_type="brand",
        item_id=brand_id,
        data={k: v for k, v in brand.items() if k != "_id"},
        saved_by=user.get("email", "system"),
    )
    
    update_data = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    if not update_data:
        return ok_envelope({"message": "No changes"})
    
    update_data["updated_at"] = datetime.now(timezone.utc)

    # If publish_at is future-dated and status not explicitly set → keep as "scheduled" draft
    if "publish_at" in update_data and "status" not in update_data:
        pub_at = update_data.get("publish_at")
        if pub_at and isinstance(pub_at, datetime) and pub_at > datetime.now(timezone.utc):
            update_data["status"] = "draft"
    
    await db.public_brands.update_one(
        {"id": brand_id},
        {"$set": update_data},
    )
    
    return ok_envelope({"message": "Brand updated successfully"})


@router.delete("/brands/{brand_id}")
async def admin_delete_brand(
    brand_id: str,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: Soft delete brand."""
    db = get_db()
    
    brand = await db.public_brands.find_one({"id": brand_id, "deleted_at": None})
    if not brand:
        raise NotFoundError("Brand tidak ditemukan")
    
    await db.public_brands.update_one(
        {"id": brand_id},
        {"$set": {"deleted_at": datetime.now(timezone.utc)}},
    )
    
    return ok_envelope({"message": "Brand deleted successfully"})


@router.post("/brands/{brand_id}/clone")
async def admin_clone_brand(
    brand_id: str,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: Clone a brand as a new draft (copy all fields, reset status/schedule)."""
    db = get_db()
    orig = await db.public_brands.find_one({"id": brand_id, "deleted_at": None})
    if not orig:
        raise NotFoundError("Brand tidak ditemukan")

    now = datetime.now(timezone.utc)
    new_id = str(uuid.uuid4())
    cloned = {k: v for k, v in orig.items() if k != "_id"}
    cloned.update({
        "id": new_id,
        "name": f"{orig.get('name', 'Brand')} (Copy)",
        "code": f"{orig.get('code', 'brand')}-copy-{new_id[:8]}",
        "status": "draft",
        "publish_at": None,
        "unpublish_at": None,
        "seo_slug": f"{orig.get('seo_slug', '')+'-copy' if orig.get('seo_slug') else ''}",
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    })
    await db.public_brands.insert_one(cloned)
    return ok_envelope({"id": new_id, "name": cloned["name"], "message": "Brand berhasil di-clone sebagai Draft"})


# ============================================================================
# OUTLETS CRUD
# ============================================================================

@router.get("/outlets")
async def admin_list_outlets(
    status: Optional[str] = Query(None),
    brand_id: Optional[str] = Query(None),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: List all outlets."""
    db = get_db()
    query = {"deleted_at": None}
    if status:
        query["status"] = status
    if brand_id:
        query["brand_id"] = brand_id
    
    outlets = await db.public_outlets.find(query, {"_id": 0}).sort("name", 1).to_list(length=200)
    return ok_envelope(outlets)


@router.post("/outlets")
async def admin_create_outlet(
    payload: CreateOutletRequest,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: Create new outlet."""
    db = get_db()
    
    # Check code uniqueness
    existing = await db.public_outlets.find_one({"code": payload.code, "deleted_at": None})
    if existing:
        raise ValidationError(f"Outlet code '{payload.code}' sudah digunakan")
    
    # Get brand name
    brand = await db.public_brands.find_one({"id": payload.brand_id, "deleted_at": None})
    if not brand:
        raise ValidationError("Brand tidak ditemukan")
    
    outlet_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    doc = {
        "id": outlet_id,
        "brand_name": brand["name"],
        **payload.dict(),
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    }
    
    await db.public_outlets.insert_one(doc)
    return ok_envelope({"id": outlet_id, "message": "Outlet created successfully"})


@router.put("/outlets/{outlet_id}")
async def admin_update_outlet(
    outlet_id: str,
    payload: UpdateOutletRequest,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: Update outlet."""
    db = get_db()
    
    outlet = await db.public_outlets.find_one({"id": outlet_id, "deleted_at": None})
    if not outlet:
        raise NotFoundError("Outlet tidak ditemukan")
    
    update_data = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    if not update_data:
        return ok_envelope({"message": "No changes"})
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.public_outlets.update_one(
        {"id": outlet_id},
        {"$set": update_data},
    )
    
    return ok_envelope({"message": "Outlet updated successfully"})


@router.delete("/outlets/{outlet_id}")
async def admin_delete_outlet(
    outlet_id: str,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: Soft delete outlet."""
    db = get_db()
    
    outlet = await db.public_outlets.find_one({"id": outlet_id, "deleted_at": None})
    if not outlet:
        raise NotFoundError("Outlet tidak ditemukan")
    
    await db.public_outlets.update_one(
        {"id": outlet_id},
        {"$set": {"deleted_at": datetime.now(timezone.utc)}},
    )
    
    return ok_envelope({"message": "Outlet deleted successfully"})


@router.post("/outlets/{outlet_id}/clone")
async def admin_clone_outlet(
    outlet_id: str,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: Clone outlet as new draft."""
    db = get_db()
    orig = await db.public_outlets.find_one({"id": outlet_id, "deleted_at": None})
    if not orig:
        raise NotFoundError("Outlet tidak ditemukan")
    now = datetime.now(timezone.utc)
    new_id = str(uuid.uuid4())
    cloned = {k: v for k, v in orig.items() if k != "_id"}
    cloned.update({
        "id": new_id,
        "name": f"{orig.get('name', 'Outlet')} (Copy)",
        "code": f"{orig.get('code', 'outlet')}-copy-{new_id[:8]}",
        "status": "draft",
        "publish_at": None,
        "unpublish_at": None,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    })
    await db.public_outlets.insert_one(cloned)
    return ok_envelope({"id": new_id, "name": cloned["name"], "message": "Outlet berhasil di-clone sebagai Draft"})


# ============================================================================
# NEWS CRUD
# ============================================================================

@router.get("/news")
async def admin_list_news(
    status: Optional[str] = Query(None),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: List all news articles."""
    db = get_db()
    query = {"deleted_at": None}
    if status:
        query["status"] = status
    
    news = await db.public_news.find(query, {"_id": 0}).sort("date", -1).to_list(length=200)
    return ok_envelope(news)


@router.post("/news")
async def admin_create_news(
    payload: CreateNewsRequest,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: Create new news article."""
    db = get_db()
    
    news_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    doc = {
        "id": news_id,
        **payload.dict(),
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    }
    
    await db.public_news.insert_one(doc)
    return ok_envelope({"id": news_id, "message": "News created successfully"})


@router.put("/news/{news_id}")
async def admin_update_news(
    news_id: str,
    payload: UpdateNewsRequest,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: Update news article."""
    db = get_db()
    
    news = await db.public_news.find_one({"id": news_id, "deleted_at": None})
    if not news:
        raise NotFoundError("News tidak ditemukan")
    
    # Create version snapshot before update
    await create_version_snapshot(
        content_type="news",
        item_id=news_id,
        data={k: v for k, v in news.items() if k != "_id"},
        saved_by=user.get("email", "system"),
    )
    
    update_data = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    if not update_data:
        return ok_envelope({"message": "No changes"})
    
    update_data["updated_at"] = datetime.now(timezone.utc)

    # If publish_at is future-dated → keep as scheduled draft
    if "publish_at" in update_data and "status" not in update_data:
        pub_at = update_data.get("publish_at")
        if pub_at and isinstance(pub_at, datetime) and pub_at > datetime.now(timezone.utc):
            update_data["status"] = "draft"
    
    await db.public_news.update_one(
        {"id": news_id},
        {"$set": update_data},
    )
    
    return ok_envelope({"message": "News updated successfully"})


@router.delete("/news/{news_id}")
async def admin_delete_news(
    news_id: str,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: Soft delete news article."""
    db = get_db()
    
    news = await db.public_news.find_one({"id": news_id, "deleted_at": None})
    if not news:
        raise NotFoundError("News tidak ditemukan")
    
    await db.public_news.update_one(
        {"id": news_id},
        {"$set": {"deleted_at": datetime.now(timezone.utc)}},
    )
    
    return ok_envelope({"message": "News deleted successfully"})


@router.post("/news/{news_id}/clone")
async def admin_clone_news(
    news_id: str,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: Clone news article as new draft."""
    db = get_db()
    orig = await db.public_news.find_one({"id": news_id, "deleted_at": None})
    if not orig:
        raise NotFoundError("News tidak ditemukan")
    now = datetime.now(timezone.utc)
    new_id = str(uuid.uuid4())
    cloned = {k: v for k, v in orig.items() if k != "_id"}
    cloned.update({
        "id": new_id,
        "title": f"{orig.get('title', 'Article')} (Copy)",
        "status": "draft",
        "publish_at": None,
        "unpublish_at": None,
        "seo_slug": f"{orig.get('seo_slug', '')+'-copy' if orig.get('seo_slug') else ''}",
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    })
    await db.public_news.insert_one(cloned)
    return ok_envelope({"id": new_id, "title": cloned["title"], "message": "Artikel berhasil di-clone sebagai Draft"})


# ============================================================================
# MENU ITEMS CRUD
# ============================================================================

@router.get("/menu")
async def admin_list_menu_items(
    brand_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: List all menu items."""
    db = get_db()
    query = {"deleted_at": None}
    if brand_id:
        query["brand_id"] = brand_id
    if status:
        query["status"] = status
    
    menu_items = await db.public_menu_items.find(query, {"_id": 0}).sort([("brand_name", 1), ("category", 1), ("name", 1)]).to_list(length=500)
    return ok_envelope(menu_items)


@router.post("/menu")
async def admin_create_menu_item(
    payload: CreateMenuItemRequest,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: Create new menu item."""
    db = get_db()
    
    # Get brand name
    brand = await db.public_brands.find_one({"id": payload.brand_id, "deleted_at": None})
    if not brand:
        raise ValidationError("Brand tidak ditemukan")
    
    menu_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    doc = {
        "id": menu_id,
        "brand_name": brand["name"],
        **payload.dict(),
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    }
    
    await db.public_menu_items.insert_one(doc)
    return ok_envelope({"id": menu_id, "message": "Menu item created successfully"})


@router.put("/menu/{menu_id}")
async def admin_update_menu_item(
    menu_id: str,
    payload: UpdateMenuItemRequest,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: Update menu item."""
    db = get_db()
    
    menu_item = await db.public_menu_items.find_one({"id": menu_id, "deleted_at": None})
    if not menu_item:
        raise NotFoundError("Menu item tidak ditemukan")
    
    update_data = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    if not update_data:
        return ok_envelope({"message": "No changes"})
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.public_menu_items.update_one(
        {"id": menu_id},
        {"$set": update_data},
    )
    
    return ok_envelope({"message": "Menu item updated successfully"})


@router.delete("/menu/{menu_id}")
async def admin_delete_menu_item(
    menu_id: str,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: Soft delete menu item."""
    db = get_db()
    
    menu_item = await db.public_menu_items.find_one({"id": menu_id, "deleted_at": None})
    if not menu_item:
        raise NotFoundError("Menu item tidak ditemukan")
    
    await db.public_menu_items.update_one(
        {"id": menu_id},
        {"$set": {"deleted_at": datetime.now(timezone.utc)}},
    )
    
    return ok_envelope({"message": "Menu item deleted successfully"})


@router.post("/menu/{menu_id}/clone")
async def admin_clone_menu_item(
    menu_id: str,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Admin: Clone menu item as new draft."""
    db = get_db()
    orig = await db.public_menu_items.find_one({"id": menu_id, "deleted_at": None})
    if not orig:
        raise NotFoundError("Menu item tidak ditemukan")
    now = datetime.now(timezone.utc)
    new_id = str(uuid.uuid4())
    cloned = {k: v for k, v in orig.items() if k != "_id"}
    cloned.update({
        "id": new_id,
        "name": f"{orig.get('name', 'Item')} (Copy)",
        "code": f"{orig.get('code', 'item')}-copy-{new_id[:8]}",
        "status": "draft",
        "publish_at": None,
        "unpublish_at": None,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    })
    await db.public_menu_items.insert_one(cloned)
    return ok_envelope({"id": new_id, "name": cloned["name"], "message": "Menu item berhasil di-clone sebagai Draft"})


# ============================================================================
# IMAGE UPLOAD
# ============================================================================

@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """
    Upload an image file for CMS content.
    
    Returns:
        {
            "url": "/uploads/filename.jpg",
            "filename": "original.jpg",
            "content_type": "image/jpeg",
            "size": 12345
        }
    """
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise ValidationError(
            f"Invalid file type: {file.content_type}. "
            f"Allowed types: {', '.join(ALLOWED_TYPES)}"
        )
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Validate file size
    if file_size > MAX_SIZE_BYTES:
        raise ValidationError(
            f"File too large: {file_size / 1024 / 1024:.2f}MB. "
            f"Maximum allowed: {MAX_SIZE_MB}MB"
        )
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Return file info
    return ok_envelope({
        "url": f"/uploads/{unique_filename}",
        "filename": file.filename,
        "content_type": file.content_type,
        "size": file_size,
    })


@router.delete("/delete-image")
async def delete_image(
    filename: str,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """
    Delete an uploaded image file.
    
    Args:
        filename: Filename to delete (e.g., "abc-123.jpg")
    """
    # Security: ensure filename doesn't contain path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise ValidationError("Invalid filename")
    
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise ValidationError("File not found")
    
    try:
        file_path.unlink()
        return ok_envelope({"message": "File deleted successfully"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")


@router.post("/schedule/trigger")
async def trigger_cms_schedule_publish(
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Manually trigger the CMS auto-publish/unpublish job (for testing / on-demand)."""
    from services.scheduler_service import job_cms_schedule_publish
    result = await job_cms_schedule_publish()
    return ok_envelope(result)


# ─── Sprint Compro-Next: Careers/Jobs CMS ─────────────────────────────────────
class JobListingCreate(BaseModel):
    title: str
    department: str
    location: str
    job_type: str = "Full-time"  # Full-time | Part-time | Contract | Internship
    description: str
    requirements: str = ""
    application_email: str = ""
    brand: str = ""
    is_active: bool = True


class JobListingUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    application_email: Optional[str] = None
    brand: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/jobs")
async def list_job_listings(
    department: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0),
    user: dict = Depends(require_perm("admin", "cms")),
):
    """List all job listings (admin view, includes inactive)."""
    db = get_db()
    query: dict = {}
    if department:
        query["department"] = department
    if is_active is not None:
        query["is_active"] = is_active
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"department": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}},
        ]
    cursor = db.job_listings.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    jobs = await cursor.to_list(length=limit)
    total = await db.job_listings.count_documents(query)
    return ok_envelope({"items": jobs, "total": total})


@router.post("/jobs", status_code=201)
async def create_job_listing(
    payload: JobListingCreate,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Create a new job listing."""
    db = get_db()
    now = datetime.now(timezone.utc)
    job = {
        "id": str(uuid.uuid4()),
        **payload.dict(),
        "created_at": now,
        "updated_at": now,
        "created_by": user.get("id"),
    }
    await db.job_listings.insert_one(job)
    job.pop("_id", None)
    return ok_envelope(job)


@router.put("/jobs/{job_id}")
async def update_job_listing(
    job_id: str,
    payload: JobListingUpdate,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Update an existing job listing."""
    db = get_db()
    update_data = {k: v for k, v in payload.dict(exclude_unset=True).items()}
    if not update_data:
        existing = await db.job_listings.find_one({"id": job_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Job listing not found")
        return ok_envelope(existing)
    update_data["updated_at"] = datetime.now(timezone.utc)
    result = await db.job_listings.find_one_and_update(
        {"id": job_id},
        {"$set": update_data},
        return_document=True,
        projection={"_id": 0},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Job listing not found")
    return ok_envelope(result)


@router.delete("/jobs/{job_id}")
async def delete_job_listing(
    job_id: str,
    user: dict = Depends(require_perm("admin", "cms")),
):
    """Soft-delete (deactivate) a job listing."""
    db = get_db()
    result = await db.job_listings.find_one_and_update(
        {"id": job_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}},
        return_document=True,
        projection={"_id": 0},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Job listing not found")
    return ok_envelope({"success": True, "id": job_id})
