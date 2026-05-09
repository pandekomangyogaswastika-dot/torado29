"""APScheduler-backed background job runner (Phase 10).

Provides a small registry of named jobs + admin endpoints for status & manual run.
Uses AsyncIOScheduler so jobs run in the FastAPI loop.
"""
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Awaitable, Callable, Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from core.db import get_db

logger = logging.getLogger("aurora.scheduler")

_TZ = os.environ.get("TIMEZONE", "Asia/Jakarta")
_scheduler: AsyncIOScheduler | None = None

# Registry: id -> spec
_JOB_REGISTRY: dict[str, dict] = {}


def _register(
    job_id: str,
    *,
    name: str,
    description: str,
    trigger: object,
    func: Callable[[], Awaitable[dict]],
    enabled: bool = True,
):
    _JOB_REGISTRY[job_id] = {
        "id": job_id,
        "name": name,
        "description": description,
        "trigger": trigger,
        "func": func,
        "enabled": enabled,
    }


# --------------------------------------------------------------------------
# Job implementations
# --------------------------------------------------------------------------
async def _record_run(job_id: str, status: str, *, result: Optional[dict] = None, error: Optional[str] = None):
    db = get_db()
    doc = {
        "id": str(uuid.uuid4()),
        "job_id": job_id,
        "status": status,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "result": result or {},
        "error": error,
    }
    try:
        await db.scheduler_runs.insert_one(doc)
    except Exception:  # noqa: BLE001
        logger.exception("failed to record scheduler run")


async def _job_report_schedules_tick() -> dict:
    """Sprint E: Dispatch all due user-configured report schedules."""
    from services import report_schedule_service as rss
    await rss.run_due_schedules()
    return {"tick": True}


async def job_anomaly_scan() -> dict:
    from services import anomaly_service  # type: ignore
    if hasattr(anomaly_service, "run_all_scans"):
        n = await anomaly_service.run_all_scans()
    elif hasattr(anomaly_service, "detect_all"):
        n = await anomaly_service.detect_all()
    else:
        return {"skipped": True, "reason": "no scan entrypoint"}
    return {"events": int(n) if isinstance(n, (int, float)) else 0}


async def job_low_stock_digest() -> dict:
    """Notify procurement managers about today's low-stock items."""
    db = get_db()
    try:
        # Use existing low-stock service if available
        from services import inventory_matrix_service as ims  # type: ignore
        items = []
        if hasattr(ims, "get_low_stock"):
            items = await ims.get_low_stock(limit=20)
        elif hasattr(ims, "compute_low_stock"):
            items = await ims.compute_low_stock(limit=20)
    except Exception:  # noqa: BLE001
        items = []
    if not items:
        return {"items": 0, "notified": 0}
    # Find procurement users
    targets = []
    async for r in db.roles.find({"permissions": "procurement.pr.create", "deleted_at": None}):
        targets.append(r["id"])
    notified = 0
    if targets:
        async for u in db.users.find({"role_ids": {"$in": targets}, "status": "active", "deleted_at": None}):
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": u["id"],
                "type": "low_stock_digest",
                "title": f"{len(items)} item di bawah par",
                "body": "Cek halaman /inventory/low-stock untuk detail.",
                "link": "/inventory/low-stock",
                "read_at": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            notified += 1
    return {"items": len(items), "notified": notified}


async def job_daily_close_reminder() -> dict:
    """Remind outlet managers to close yesterday if not done."""
    db = get_db()
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).date().isoformat()
    closed_outlets = set()
    async for r in db.daily_close_records.find({"close_date": yesterday, "status": "closed"}):
        closed_outlets.add(r.get("outlet_id"))
    notified = 0
    async for outlet in db.outlets.find({"deleted_at": None}):
        if outlet["id"] in closed_outlets:
            continue
        async for u in db.users.find({"outlet_ids": outlet["id"], "status": "active", "deleted_at": None}):
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": u["id"],
                "type": "daily_close_reminder",
                "title": f"Daily close {yesterday} belum selesai",
                "body": f"Outlet {outlet.get('name','-')}: silakan jalankan daily close kemarin.",
                "link": "/outlet/daily-close",
                "read_at": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            notified += 1
    return {"date": yesterday, "notified": notified}


async def job_ap_aging_digest() -> dict:
    """Send AP aging summary to Finance Manager weekly."""
    db = get_db()
    today = datetime.now(timezone.utc).date()
    # Group by aging buckets
    buckets = {"0_30": 0, "31_60": 0, "61_90": 0, "over_90": 0}
    cursor = db.ap_invoices.find({"status": {"$in": ["posted", "partial"]}, "deleted_at": None})
    async for inv in cursor:
        try:
            due = datetime.fromisoformat(str(inv.get("due_date"))[:10]).date()
            days = (today - due).days
            outstanding = float(inv.get("outstanding", inv.get("total", 0)) or 0)
            if days <= 30:
                buckets["0_30"] += outstanding
            elif days <= 60:
                buckets["31_60"] += outstanding
            elif days <= 90:
                buckets["61_90"] += outstanding
            else:
                buckets["over_90"] += outstanding
        except Exception:  # noqa: BLE001
            continue
    targets = []
    async for r in db.roles.find({"permissions": "finance.ap.read", "deleted_at": None}):
        targets.append(r["id"])
    notified = 0
    if targets:
        body = (
            f"0-30: Rp{int(buckets['0_30']):,} | 31-60: Rp{int(buckets['31_60']):,} | "
            f"61-90: Rp{int(buckets['61_90']):,} | >90: Rp{int(buckets['over_90']):,}"
        )
        async for u in db.users.find({"role_ids": {"$in": targets}, "status": "active", "deleted_at": None}):
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": u["id"],
                "type": "ap_aging_digest",
                "title": "Weekly AP aging digest",
                "body": body,
                "link": "/finance/ap",
                "read_at": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            notified += 1
    return {"buckets": buckets, "notified": notified}


async def job_cleanup_tokens_and_logs() -> dict:
    """Hourly: delete expired refresh tokens + flush log_entries buffer."""
    db = get_db()
    now = datetime.now(timezone.utc)
    # Refresh tokens are TTL-indexed; manual sweep as safety net
    res_rt = await db.refresh_tokens.delete_many({"expires_at": {"$lt": now}})
    # Drop notifications already-read older than 30d
    cutoff = (now - timedelta(days=30)).isoformat()
    res_notif = await db.notifications.delete_many({"read_at": {"$ne": None, "$lt": cutoff}})
    # Flush log buffer
    flushed = 0
    try:
        from core.logging_config import get_db_sink
        flushed = await get_db_sink().flush_to_db()
    except Exception:  # noqa: BLE001
        pass
    return {
        "refresh_tokens_deleted": res_rt.deleted_count,
        "old_notifications_deleted": res_notif.deleted_count,
        "log_entries_flushed": flushed,
    }


async def job_archival() -> dict:
    """Weekly: run archival pass."""
    from services import archival_service
    return await archival_service.run_archival()


async def job_cms_schedule_publish() -> dict:
    """Sprint II: Auto-publish and auto-unpublish CMS content based on schedule fields.

    Runs every minute. Checks:
    - Items with status != 'published' AND publish_at <= now → set status = 'published'
    - Items with status == 'published' AND unpublish_at <= now → set status = 'draft'
    """
    from core.db import get_db
    db = get_db()
    now = datetime.now(timezone.utc)

    published_count = 0
    unpublished_count = 0
    collections = ["public_brands", "public_news", "public_outlets", "public_menu_items"]

    for col_name in collections:
        collection = getattr(db, col_name)

        # Auto-publish: scheduled items whose publish_at has passed
        res_pub = await collection.update_many(
            {
                "deleted_at": None,
                "status": {"$ne": "published"},
                "publish_at": {"$lte": now, "$ne": None},
            },
            {"$set": {"status": "published", "updated_at": now}},
        )
        published_count += res_pub.modified_count

        # Auto-unpublish: items whose unpublish_at has passed
        res_unpub = await collection.update_many(
            {
                "deleted_at": None,
                "status": "published",
                "unpublish_at": {"$lte": now, "$ne": None},
            },
            {"$set": {"status": "draft", "updated_at": now}},
        )
        unpublished_count += res_unpub.modified_count

    return {
        "auto_published": published_count,
        "auto_unpublished": unpublished_count,
        "checked_at": now.isoformat(),
    }


async def job_owner_daily_digest() -> dict:
    """Phase 11C: dispatch daily digest to all enabled subscribers (06:00 WIB)."""
    from services import owner_digest_service
    return await owner_digest_service.send_digest_to_all_subscribers()


async def job_cash_daily_snapshot() -> dict:
    """Phase 11B: snapshot every active cash account once a day."""
    from services import cash_position_service
    return await cash_position_service.daily_snapshot_all()


# --------------------------------------------------------------------------
# Public API
# --------------------------------------------------------------------------
def _ensure_registered() -> None:
    if _JOB_REGISTRY:
        return
    _register(
        "anomaly_scan",
        name="Anomaly scan (daily 06:00)",
        description="Scan recent activity for anomalies (sales, vendor price, lead-time, AP-cash).",
        trigger=CronTrigger(hour=6, minute=0, timezone=_TZ),
        func=job_anomaly_scan,
    )
    _register(
        "low_stock_digest",
        name="Low-stock digest (daily 07:00)",
        description="Notify procurement managers about items below par level.",
        trigger=CronTrigger(hour=7, minute=0, timezone=_TZ),
        func=job_low_stock_digest,
    )
    _register(
        "daily_close_reminder",
        name="Daily-close reminder (daily 08:00)",
        description="Remind outlet managers to complete yesterday's daily close.",
        trigger=CronTrigger(hour=8, minute=0, timezone=_TZ),
        func=job_daily_close_reminder,
    )
    _register(
        "ap_aging_digest",
        name="AP aging digest (weekly Mon 09:00)",
        description="Send weekly AP aging summary to finance manager.",
        trigger=CronTrigger(day_of_week="mon", hour=9, minute=0, timezone=_TZ),
        func=job_ap_aging_digest,
    )
    _register(
        "hourly_cleanup",
        name="Cleanup tokens + logs (hourly)",
        description="Delete expired refresh tokens, drop old read notifications, flush log buffer.",
        trigger=IntervalTrigger(hours=1),
        func=job_cleanup_tokens_and_logs,
    )
    _register(
        "archival_weekly",
        name="Data archival (weekly Sun 02:00)",
        description="Move stale audit/notifications/logs to *_archive collections.",
        trigger=CronTrigger(day_of_week="sun", hour=2, minute=0, timezone=_TZ),
        func=job_archival,
    )
    _register(
        "owner_daily_digest",
        name="Owner daily digest (daily 06:00 WIB)",
        description="Build & send daily digest (cash, revenue, AP, anomalies, approvals) to all enabled owner subscribers.",
        trigger=CronTrigger(hour=6, minute=0, timezone=_TZ),
        func=job_owner_daily_digest,
    )
    _register(
        "cash_daily_snapshot",
        name="Cash account daily snapshot (daily 23:55 WIB)",
        description="Capture current_balance of every active cash account into cash_balance_snapshots for trend chart.",
        trigger=CronTrigger(hour=23, minute=55, timezone=_TZ),
        func=job_cash_daily_snapshot,
    )
    # Sprint E: run user-configured scheduled reports every minute
    _register(
        "report_schedules_tick",
        name="Scheduled Reports Tick (every minute)",
        description="Check and dispatch user-configured report schedules (Sprint E).",
        trigger=IntervalTrigger(minutes=1),
        func=_job_report_schedules_tick,
    )
    # Sprint II: auto-publish/unpublish CMS content based on schedule
    _register(
        "cms_schedule_publish",
        name="CMS Auto Publish/Unpublish (every minute)",
        description="Auto-publish content when publish_at is reached; auto-unpublish when unpublish_at is reached.",
        trigger=IntervalTrigger(minutes=1),
        func=job_cms_schedule_publish,
    )


def start_scheduler() -> None:
    global _scheduler
    _ensure_registered()
    if _scheduler is not None:
        return
    sch = AsyncIOScheduler(timezone=_TZ)
    for spec in _JOB_REGISTRY.values():
        if not spec["enabled"]:
            continue
        sch.add_job(
            _wrap_job(spec["id"], spec["func"]),
            trigger=spec["trigger"],
            id=spec["id"],
            name=spec["name"],
            replace_existing=True,
            misfire_grace_time=300,
        )
    sch.start()
    _scheduler = sch
    logger.info(f"scheduler started with {len(_JOB_REGISTRY)} jobs (TZ={_TZ})")


async def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None


def _wrap_job(job_id: str, fn: Callable[[], Awaitable[dict]]):
    async def runner():
        await _record_run(job_id, "running")
        try:
            result = await fn()
            await _record_run(job_id, "success", result=result)
            logger.info(f"job {job_id} ok: {result}")
        except Exception as e:  # noqa: BLE001
            await _record_run(job_id, "failed", error=str(e))
            logger.exception(f"job {job_id} failed")
    return runner


def list_jobs() -> list[dict]:
    _ensure_registered()
    out = []
    sch = _scheduler
    for spec in _JOB_REGISTRY.values():
        next_run = None
        if sch is not None:
            j = sch.get_job(spec["id"])
            if j and j.next_run_time:
                next_run = j.next_run_time.isoformat()
        out.append({
            "id": spec["id"],
            "name": spec["name"],
            "description": spec["description"],
            "enabled": spec["enabled"],
            "next_run": next_run,
            "trigger": str(spec["trigger"]),
        })
    return out


async def run_job_now(job_id: str) -> dict:
    _ensure_registered()
    spec = _JOB_REGISTRY.get(job_id)
    if not spec:
        raise ValueError(f"unknown job: {job_id}")
    started = datetime.now(timezone.utc)
    await _record_run(job_id, "running", result={"manual": True})
    try:
        result = await spec["func"]()
        await _record_run(job_id, "success", result=result)
        return {
            "job_id": job_id,
            "status": "success",
            "result": result,
            "started_at": started.isoformat(),
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:  # noqa: BLE001
        await _record_run(job_id, "failed", error=str(e))
        return {
            "job_id": job_id,
            "status": "failed",
            "error": str(e),
            "started_at": started.isoformat(),
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }


async def list_runs(job_id: Optional[str] = None, limit: int = 50) -> list[dict]:
    db = get_db()
    q: dict = {}
    if job_id:
        q["job_id"] = job_id
    cur = db.scheduler_runs.find(q, {"_id": 0}).sort("started_at", -1).limit(min(200, max(1, limit)))
    return [r async for r in cur]
