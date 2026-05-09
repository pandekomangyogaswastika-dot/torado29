# Phase 10 — Productionization · RESULT

**Date:** 28 April 2026  
**Scope:** Structured logging, request correlation, rate limiting, login lockout (existing, verified), background scheduler (APScheduler), data archival, admin Operations UI, GitHub Actions CI workflow.

---

## ✅ Delivered Features

### 10A — Structured JSON Logging + DB Sink
- New `core/logging_config.py`:
  - `JsonFormatter` emits one-line JSON per record with `ts`, `level`, `logger`, `msg` plus request-scoped fields (`request_id`, `route`, `method`, `status_code`, `duration_ms`, `client_ip`, `user_id`).
  - Secret redaction via regex on field names (password/token/secret/api_key/authorization/cookie/session) → `***REDACTED***`.
  - `DBLogSink` buffers records and flushes to `log_entries` collection (consumed by Operations · Logs view).
  - `configure_logging()` is idempotent and quiets noisy 3rd-parties (uvicorn.access, watchfiles, httpx, httpcore, asyncio).
- `server.py` calls `configure_logging()` at module load and attaches `DBLogSink` in lifespan.

### 10B — Request Correlation Middleware + Metrics
- New `core/middleware.py:RequestIDMiddleware`
  - Generates or propagates `X-Request-ID` header on every response.
  - Times the request (`duration_ms`), records into in-memory metrics, emits structured access log line.
  - Exposes `request_id` via `request.state` so downstream code can attach it to logs.
- New `services/metrics_service.py`
  - In-memory counters: total requests, 4xx/5xx, by-status, by-method, RPS last 60s, error-rate last 60s.
  - Per-route p95/avg/max latency (deque of last 100 samples).
  - Snapshot of collection counts (15 hot collections).
- New extended `/api/health` returns `version`, `status`, `db`, `db_latency_ms`, `uptime_sec`.

### 10C — Rate Limiter (in-memory token bucket)
- New `core/rate_limiter.py:RateLimiter`
  - 3 buckets (configurable via env):
    - `login`: 10 req/60s per IP
    - `ai`: 20 req/60s per user
    - `api`: 120 req/60s per user
  - `RateLimitDecision` dataclass exposes `allowed`, `limit`, `remaining`, `reset_unix`, `retry_after_sec`.
- New `core/middleware.py:RateLimitMiddleware`
  - Auto-classifies request → bucket; `/api/auth/login` → IP-keyed; `/api/ai/*` → token-keyed; otherwise general.
  - Excludes `/api/health` and `/api/`.
  - Sets `X-RateLimit-Limit / Remaining / Reset` on every response; `Retry-After` on 429.
  - Returns standard `RATE_LIMIT_EXCEEDED` envelope on overflow.
- **Login lockout** (already existed in `auth_service.py` from earlier phases; verified): 5 wrong passwords → `ACCOUNT_LOCKED` for 15 min.

### 10D — Background Scheduler (APScheduler)
- New `services/scheduler_service.py`
  - `AsyncIOScheduler` started in app lifespan (TZ Asia/Jakarta), gracefully shut down.
  - 6 default jobs registered:
    - `anomaly_scan` — daily 06:00 — invokes existing anomaly service (auto-falls-back gracefully if API not present).
    - `low_stock_digest` — daily 07:00 — notifies procurement managers about items below par.
    - `daily_close_reminder` — daily 08:00 — reminds outlet managers about yesterday's unclosed sales.
    - `ap_aging_digest` — weekly Mon 09:00 — sends AP aging buckets to Finance Manager.
    - `hourly_cleanup` — hourly — deletes expired refresh tokens, drops old read notifications, flushes log buffer.
    - `archival_weekly` — weekly Sun 02:00 — runs archival service.
  - Every run is recorded in `scheduler_runs` collection (id, status, started_at, result/error).
- Manual run endpoint records the run and returns sync result + duration.
- Disable via `SCHEDULER_ENABLED=false` env.

### 10E — Data Archival Service
- New `services/archival_service.py`
  - Per-collection retention windows (env-overridable):
    - `audit_log` → 180 days
    - `notifications` → 90 days
    - `log_entries` → 30 days
    - `scheduler_runs` → 60 days
    - `ai_qa_sessions` → 30 days
    - `ocr_receipt_cache` → 60 days
  - `stats()` reports `total / eligible_for_archive / already_archived` per collection (dry-run).
  - `run_archival()` moves stale docs into `<coll>_archive` then deletes from source. Supports `dry_run`, `batch_size`, `retention_overrides`.
  - Wired as `archival_weekly` scheduler job.

### 10F — Admin Operations Endpoints
- New `routers/admin_ops.py` (super-only, perm-gated):
  - `GET /api/admin/metrics` — in-memory counters + collection counts + top slow routes
  - `GET /api/admin/logs/recent` — paginated log entries with filters (level/request_id/route/user_id/since)
  - `GET /api/admin/logs/stats`
  - `GET /api/admin/rate-limits` — buckets config + top hits
  - `POST /api/admin/rate-limits/reset` — reset bucket / key / all
  - `GET /api/admin/scheduler/jobs` — list jobs + next_run
  - `GET /api/admin/scheduler/runs` — last N runs (filter by job)
  - `POST /api/admin/scheduler/jobs/{id}/run` — manual trigger
  - `GET /api/admin/archival/stats`
  - `POST /api/admin/archival/run` — dry-run or live run

### 10G — Frontend Operations UI
- New `portals/admin/Operations.jsx` (router with 5 tabs).
- Sub-pages under `portals/admin/operations/`:
  - `MetricsView.jsx` — KPI tiles (uptime, total req, error rate, active sessions), collection counts grid, top slow routes table, status/method chip clouds, **auto-refresh every 15s**.
  - `LogsView.jsx` — filterable table (level/request_id/route regex/user) with expandable JSON detail rows, color-coded levels.
  - `SchedulerView.jsx` — 6 job cards (trigger, next_run, last status), recent-runs scrollable table, optimistic-toast on manual run.
  - `ArchivalView.jsx` — per-collection eligible counts, cutoff dates, Dry-Run + Run buttons (with confirmation).
  - `RateLimitsView.jsx` — 3 bucket cards (login/ai/api) with per-key progress bars colored by usage %, per-bucket reset.
- AdminPortal sub-nav: added "Operations" pill (Activity icon), perm-gated by `system.metrics.read` (super always sees it).
- AdminHome: new "System Operations" tile linking to `/admin/operations` (gated by perm).

### 10H — GitHub Actions CI
- New `.github/workflows/ci.yml` with 3 jobs:
  1. **backend-lint-test**: ruff lint + pytest (auto-skip if no tests)
  2. **frontend-lint-build**: yarn install + eslint + craco build
  3. **smoke-up**: spins Mongo service, boots uvicorn, hits `/api/health` and asserts `status=ok`.

---

## 🔐 New Permissions
| Code | Granted to (default seed) |
|---|---|
| `system.metrics.read` | `*` super only (currently) — add to other roles via Admin · Roles |
| `system.logs.read` | `*` |
| `system.scheduler.manage` | `*` |
| `system.archival.manage` | `*` |

All Phase 10 admin endpoints are gated by these perms. Super (`*`) always satisfies them.

---

## 📁 Files Added
- `backend/core/logging_config.py`
- `backend/core/middleware.py`
- `backend/core/rate_limiter.py`
- `backend/services/metrics_service.py`
- `backend/services/log_service.py`
- `backend/services/scheduler_service.py`
- `backend/services/archival_service.py`
- `backend/routers/admin_ops.py`
- `frontend/src/portals/admin/Operations.jsx`
- `frontend/src/portals/admin/operations/MetricsView.jsx`
- `frontend/src/portals/admin/operations/LogsView.jsx`
- `frontend/src/portals/admin/operations/SchedulerView.jsx`
- `frontend/src/portals/admin/operations/ArchivalView.jsx`
- `frontend/src/portals/admin/operations/RateLimitsView.jsx`
- `.github/workflows/ci.yml`
- `memory/PHASE_10_RESULT.md` (this file)

## ✏️ Files Modified
- `backend/server.py` — wired structured logging, RequestID + RateLimit middlewares, scheduler lifecycle, extended /health, added admin_ops router.
- `backend/core/db.py` — added indexes for `log_entries` (with TTL on `ts_dt`), `scheduler_runs`.
- `backend/core/perms_catalog.py` — added 4 system.* perms.
- `backend/requirements.txt` — added `apscheduler==3.10.4`.
- `frontend/src/portals/admin/AdminPortal.jsx` — added Operations sub-nav + route + perm filter.
- `frontend/src/portals/admin/AdminHome.jsx` — added Operations Console tile.

---

## 🧪 User Stories Covered
| ID | Story | Status |
|---|---|---|
| OPS-US-1 | Super Admin: lihat metrics aplikasi (request/error/aktivitas) | ✅ MetricsView |
| OPS-US-2 | Super Admin: lihat recent logs dengan request_id untuk tracing | ✅ LogsView |
| OPS-US-3 | Super Admin: list jobs + jalankan manual | ✅ SchedulerView |
| OPS-US-4 | Super Admin: trigger archival manual untuk data lama | ✅ ArchivalView |
| OPS-US-5 | Super Admin: lihat & reset rate-limit counters | ✅ RateLimitsView |
| OPS-US-6 | GM/Owner: brute-force prevented (login lockout 5x/15min + rate limit 429) | ✅ verified |
| OPS-US-7 | Outlet manager: notifikasi otomatis daily-close kemarin yang belum complete | ✅ daily_close_reminder job |
| OPS-US-8 | Procurement: notifikasi otomatis low-stock items harian | ✅ low_stock_digest job |
| OPS-US-9 | Finance: weekly AP aging digest | ✅ ap_aging_digest job |
| OPS-US-10 | Developer: CI pipeline lint+build+smoke pada push/PR | ✅ .github/workflows/ci.yml |
| OPS-US-11 | Setiap API request punya X-Request-ID untuk correlation | ✅ RequestIDMiddleware |

---

## ⚠️ Notes & Caveats
- **Rate limiter is in-process** (one node = one bucket store). For multi-replica deployments, swap the in-memory store for Redis.
- **APScheduler runs in-process** — with multiple replicas, only one node should be running the scheduler. Set `SCHEDULER_ENABLED=false` on workers.
- **Notification jobs** (low_stock_digest, daily_close_reminder, ap_aging_digest) push to in-app notification feed only — no SMTP/email yet (out of scope; matches existing behavior).
- **Archival** doesn't preserve referential integrity — children referencing archived parents (e.g., audit_log entries referencing notifications) will see broken links. Default windows are conservative.
- **Demo perms**: only `*` (Super Admin) is auto-granted the new system.* perms. To grant ops to another role, edit via Admin · Roles.
- **TTL index** on `log_entries.ts_dt` was created but the writer currently writes `ts` as ISO string — the TTL index will only kick in once we also write a Date `ts_dt` field. Keeping it for forward compatibility; actual cleanup is currently driven by `archival_service` + `hourly_cleanup` job.
- **CI smoke job** intentionally disables the scheduler & rate-limit middleware to keep the boot fast and deterministic.

---

## 🚦 Quality Gates
- `ruff` clean for all new/modified backend files (modulo existing repo warnings).
- `eslint` clean for new frontend files.
- Backend boot OK (structured JSON logs visible in `/var/log/supervisor/backend.out.log`).
- Manual smoke (curl):
  - `/api/health` — 200 with `db_latency_ms` + `uptime_sec`
  - `X-Request-ID` present on every response
  - `X-RateLimit-*` headers present
  - 9th login attempt with bad creds → 429
  - `/api/admin/metrics` — returns structured payload
  - `/api/admin/scheduler/jobs/hourly_cleanup/run` — success: flushed log entries
  - `/api/admin/archival/run dry_run=true` — returns per-collection cutoffs
- testing_agent_v3 backend regression: pending (next step).

---

## 📊 Stats After Phase 10
- 15 phases delivered (Phase 0 → 9D + 3 Hardening + 10 Productionization)
- 224 backend endpoints (218 + 11 new admin_ops)
- 6 default scheduled jobs running TZ Asia/Jakarta
- 4 new system.* permissions
- New Mongo collections: `log_entries`, `scheduler_runs`, plus `*_archive` (created on first run)
