"""System settings service \u2014 generic key/value config stored in MongoDB.

Phase 12 enhancements:
  - `is_secret=True` values are stored ENCRYPTED at rest via Fernet
  - Catalog extended with LLM keys, WhatsApp providers, Email branding
  - All getters transparently decrypt; mask in API responses
  - Migration: legacy plaintext values get re-encrypted on next write

Use cases:
  - TELEGRAM_BOT_TOKEN
  - RESEND_API_KEY
  - OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY (override Emergent)
  - WhatsApp provider creds (Twilio, Meta Cloud API, Fonnte)
  - App branding (name, logo, primary color)

Security:
  - Settings flagged `is_secret=True` are stored encrypted (`enc_v1::...`)
  - Listing API masks every secret (first 4 + last 4 chars only)
  - Plaintext only available internally via `get_value(key)` for service-side use
  - Audit log on every change \u2014 NEVER stores plaintext value
  - Requires `system.settings.manage` perm to mutate, `system.settings.read` to list
"""
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from core.db import get_db
from core.exceptions import ValidationError
from core.secrets import decrypt, encrypt, is_ciphertext

logger = logging.getLogger("aurora.system_settings")

COLLECTION = "system_settings"

# ---------------------------------------------------------------------------
# Catalog of known settings \u2014 helps the UI build a form.
# DB is the source of truth, but this catalog defines metadata for the UI.
# ---------------------------------------------------------------------------
KNOWN_SETTINGS: dict[str, dict] = {
    # ------------------ Telegram ------------------
    "TELEGRAM_BOT_TOKEN": {
        "label": "Telegram Bot Token",
        "description": "Token dari @BotFather. Format: 123456:ABC-...",
        "is_secret": True,
        "category": "telegram",
        "placeholder": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
    },
    "TELEGRAM_WEBHOOK_URL": {
        "label": "Telegram Webhook URL",
        "description": "URL public yang Telegram pakai untuk push update ke server. Akan di-set otomatis saat klik 'Setup Webhook'.",
        "is_secret": False,
        "category": "telegram",
        "placeholder": "https://your-app.example.com/api/telegram/webhook",
    },

    # ------------------ Email (Resend) ------------------
    "RESEND_API_KEY": {
        "label": "Resend API Key",
        "description": "API key Resend untuk pengiriman email digest & notifikasi. Daftar di resend.com.",
        "is_secret": True,
        "category": "email",
        "placeholder": "re_XXXXXXXXXXXX",
    },
    "EMAIL_FROM": {
        "label": "Email From Address",
        "description": "Alamat pengirim default. Untuk Resend sandbox gunakan onboarding@resend.dev.",
        "is_secret": False,
        "category": "email",
        "placeholder": "no-reply@yourdomain.com",
    },
    "EMAIL_FROM_NAME": {
        "label": "Email Sender Display Name",
        "description": "Nama yang muncul di header email (di samping alamat).",
        "is_secret": False,
        "category": "email",
        "placeholder": "Aurora F&B",
    },
    "EMAIL_REPLY_TO": {
        "label": "Email Reply-To",
        "description": "Optional: alamat untuk Reply-To header.",
        "is_secret": False,
        "category": "email",
        "placeholder": "support@yourdomain.com",
    },

    # ------------------ AI / LLM ------------------
    "EMERGENT_LLM_KEY": {
        "label": "Emergent Universal LLM Key",
        "description": "Universal key dari Emergent untuk akses OpenAI/Anthropic/Gemini. Sumber default semua AI features.",
        "is_secret": True,
        "category": "ai",
        "placeholder": "sk-emergent-XXXXXXXXXXXX",
    },
    "OPENAI_API_KEY": {
        "label": "OpenAI API Key (Direct)",
        "description": "Override langsung pakai OpenAI (kalau Emergent key bermasalah atau ingin pakai direct).",
        "is_secret": True,
        "category": "ai",
        "placeholder": "sk-XXXXXXXXXXXXXXXXXXXX",
    },
    "ANTHROPIC_API_KEY": {
        "label": "Anthropic API Key (Direct)",
        "description": "Override langsung pakai Anthropic (Claude).",
        "is_secret": True,
        "category": "ai",
        "placeholder": "sk-ant-XXXXXXXXXXXX",
    },
    "GEMINI_API_KEY": {
        "label": "Google Gemini API Key (Direct)",
        "description": "Override langsung pakai Gemini.",
        "is_secret": True,
        "category": "ai",
        "placeholder": "AIzaSyXXXXXXXXXXXX",
    },
    "LLM_PROVIDER_PRIMARY": {
        "label": "Primary LLM Provider",
        "description": "Provider utama: emergent | openai | anthropic | gemini. Default: emergent.",
        "is_secret": False,
        "category": "ai",
        "placeholder": "emergent",
    },
    "LLM_MODEL_TEXT": {
        "label": "Default Text Model",
        "description": "Model default untuk text generation. Contoh: gemini-2.5-flash, gpt-4o-mini, claude-3-5-sonnet.",
        "is_secret": False,
        "category": "ai",
        "placeholder": "gemini-2.5-flash",
    },
    "LLM_MODEL_OCR": {
        "label": "OCR Model",
        "description": "Model untuk OCR struk/receipt. Recommended: gemini-2.5-flash (vision-capable).",
        "is_secret": False,
        "category": "ai",
        "placeholder": "gemini-2.5-flash",
    },

    # ------------------ WhatsApp ------------------
    "WHATSAPP_PROVIDER": {
        "label": "WhatsApp Provider",
        "description": "Provider yang dipakai: fonnte | twilio | meta | disabled.",
        "is_secret": False,
        "category": "whatsapp",
        "placeholder": "fonnte",
    },
    # Fonnte (Indonesian-friendly, easiest)
    "FONNTE_API_TOKEN": {
        "label": "Fonnte API Token",
        "description": "Token dari fonnte.com. Untuk Indonesia, paling simple. Daftar device dulu.",
        "is_secret": True,
        "category": "whatsapp",
        "placeholder": "abcd1234efgh5678",
    },
    # Twilio (popular, sandbox available)
    "TWILIO_ACCOUNT_SID": {
        "label": "Twilio Account SID",
        "description": "Account SID dari Twilio Console. Format: ACxxxxxxxx...",
        "is_secret": True,
        "category": "whatsapp",
        "placeholder": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
    "TWILIO_AUTH_TOKEN": {
        "label": "Twilio Auth Token",
        "description": "Auth Token dari Twilio Console.",
        "is_secret": True,
        "category": "whatsapp",
        "placeholder": "your_auth_token_here",
    },
    "TWILIO_WHATSAPP_FROM": {
        "label": "Twilio WhatsApp From Number",
        "description": "Nomor WhatsApp Twilio (sandbox: whatsapp:+14155238886).",
        "is_secret": False,
        "category": "whatsapp",
        "placeholder": "whatsapp:+14155238886",
    },
    # Meta Cloud API (free tier, official)
    "META_WHATSAPP_TOKEN": {
        "label": "Meta WhatsApp Cloud API Token",
        "description": "Permanent token dari Meta Business Suite \u2192 WhatsApp Cloud API.",
        "is_secret": True,
        "category": "whatsapp",
        "placeholder": "EAAGxxxxxxxxxxxxxxx",
    },
    "META_PHONE_NUMBER_ID": {
        "label": "Meta WhatsApp Phone Number ID",
        "description": "Phone Number ID dari WhatsApp Cloud API setup.",
        "is_secret": False,
        "category": "whatsapp",
        "placeholder": "1234567890123456",
    },

    # ------------------ Digest ------------------
    "DIGEST_DEFAULT_TIME": {
        "label": "Default Digest Time (WIB)",
        "description": "Jam pengiriman digest harian default. Format HH:MM (24h).",
        "is_secret": False,
        "category": "digest",
        "placeholder": "06:00",
    },

    # ------------------ Tax / Pajak (Sprint 1) ------------------
    "TAX_PPN_ENABLED": {
        "label": "PPN Aktif",
        "description": "Toggle PPN (Pajak Pertambahan Nilai). True = transaksi dikenakan PPN, False = tidak.",
        "is_secret": False,
        "category": "tax",
        "placeholder": "true",
        "value_type": "bool",
    },
    "TAX_PPN_RATE": {
        "label": "Tarif PPN",
        "description": "Tarif PPN dalam desimal. Default 0.12 (12%) sesuai Perpu 2/2024 (efektif 2025).",
        "is_secret": False,
        "category": "tax",
        "placeholder": "0.12",
        "value_type": "number",
    },
    "TAX_PPH21_ENABLED": {
        "label": "PPh 21 Aktif",
        "description": "Toggle PPh Pasal 21 (withholding pajak karyawan). Aktifkan jika payroll diproses di sistem.",
        "is_secret": False,
        "category": "tax",
        "placeholder": "false",
        "value_type": "bool",
    },
    "TAX_PPH21_METHOD": {
        "label": "Metode PPh 21",
        "description": "gross = pajak ditanggung karyawan (dipotong dari gaji); gross_up = pajak ditanggung perusahaan.",
        "is_secret": False,
        "category": "tax",
        "placeholder": "gross",
        "value_type": "select",
    },
    "TAX_PPH23_ENABLED": {
        "label": "PPh 23 Aktif",
        "description": "Toggle PPh Pasal 23 (withholding jasa/royalti vendor). Aktifkan untuk transaksi bayar vendor jasa.",
        "is_secret": False,
        "category": "tax",
        "placeholder": "false",
        "value_type": "bool",
    },
    "TAX_PPH23_RATE": {
        "label": "Tarif PPh 23 Default",
        "description": "Tarif default PPh 23. Default 0.02 (2%) untuk jasa umum. Rate per service type bisa berbeda.",
        "is_secret": False,
        "category": "tax",
        "placeholder": "0.02",
        "value_type": "number",
    },
    "TAX_PPH42_ENABLED": {
        "label": "PPh 4(2) Aktif",
        "description": "Toggle PPh Pasal 4 ayat 2 (pajak final atas sewa tanah/bangunan, konstruksi).",
        "is_secret": False,
        "category": "tax",
        "placeholder": "false",
        "value_type": "bool",
    },
    "TAX_PPH42_RATE": {
        "label": "Tarif PPh 4(2) Default",
        "description": "Tarif default PPh 4(2). Default 0.10 (10%) untuk sewa bangunan.",
        "is_secret": False,
        "category": "tax",
        "placeholder": "0.10",
        "value_type": "number",
    },
    
    # ------------------ Company Tax Info (Sprint 1b e-Faktur) ------------------
    "COMPANY_NPWP": {
        "label": "NPWP Perusahaan",
        "description": "Nomor Pokok Wajib Pajak perusahaan (15 digit). Digunakan untuk e-Faktur export.",
        "is_secret": False,
        "category": "tax",
        "placeholder": "000000000000000",
    },
    "COMPANY_PKP_NAME": {
        "label": "Nama PKP (Pengusaha Kena Pajak)",
        "description": "Nama perusahaan sesuai SPPKP (Surat Pengukuhan PKP). Untuk e-Faktur header.",
        "is_secret": False,
        "category": "tax",
        "placeholder": "PT. Torado Group",
    },
    "COMPANY_PKP_ADDRESS": {
        "label": "Alamat PKP",
        "description": "Alamat lengkap perusahaan PKP untuk e-Faktur.",
        "is_secret": False,
        "category": "tax",
        "placeholder": "Jl. Sudirman No. 123, Jakarta Pusat",
    },

    # ------------------ App Branding ------------------
    "APP_NAME": {
        "label": "Application Name",
        "description": "Nama aplikasi yang muncul di header & email (default: Aurora F&B).",
        "is_secret": False,
        "category": "branding",
        "placeholder": "Aurora F&B",
    },
    "APP_LOGO_URL": {
        "label": "Application Logo URL",
        "description": "URL logo perusahaan (PNG/SVG, optional).",
        "is_secret": False,
        "category": "branding",
        "placeholder": "https://yourdomain.com/logo.png",
    },
    "APP_PRIMARY_COLOR": {
        "label": "Primary Brand Color",
        "description": "Hex color code untuk highlight brand (mis. #6366F1).",
        "is_secret": False,
        "category": "branding",
        "placeholder": "#6366F1",
    },

    # ------------------ Voucher / Loyalty (Sprint C) ------------------
    "voucher.rules.allow_multiple_per_sale": {
        "label": "Izinkan Multiple Voucher Per Sales",
        "description": "Jika true, satu daily sales bisa pakai lebih dari 1 voucher. Default: false.",
        "is_secret": False,
        "category": "voucher",
        "placeholder": "false",
        "value_type": "bool",
    },
    "voucher.rules.require_customer_phone": {
        "label": "Wajib Customer Phone untuk Voucher",
        "description": "Jika true, voucher hanya bisa dipakai oleh customer yang terdaftar (validasi phone). Default: false.",
        "is_secret": False,
        "category": "voucher",
        "placeholder": "false",
        "value_type": "bool",
    },
    "voucher.rules.max_discount_amount": {
        "label": "Maksimal Diskon Voucher (Rp)",
        "description": "Cap maksimal diskon dalam Rupiah. Kosongkan untuk tidak ada batas. Contoh: 50000.",
        "is_secret": False,
        "category": "voucher",
        "placeholder": "",
        "value_type": "number",
    },
    "voucher.ui.accepted_formats_hint": {
        "label": "Helper Text Format Voucher",
        "description": "Text hint yang ditampilkan di UI untuk format kode voucher yang diterima.",
        "is_secret": False,
        "category": "voucher",
        "placeholder": "Masukkan kode voucher (contoh: VCH12345)",
    },
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _mask(value: str | None, *, is_secret: bool = True) -> Optional[str]:
    """Mask a secret value for safe API exposure."""
    if value is None or value == "":
        return None
    if not is_secret:
        return value
    s = str(value)
    if len(s) <= 8:
        return "*" * len(s)
    return f"{s[:4]}\u2026{s[-4:]}"


async def _ensure_index() -> None:
    db = get_db()
    await db[COLLECTION].create_index("key", unique=True)


def _meta_for(key: str) -> dict:
    return KNOWN_SETTINGS.get(key, {})


def _is_secret_key(key: str) -> bool:
    return bool(_meta_for(key).get("is_secret", False))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
async def get_value(key: str) -> Optional[str]:
    """Internal: get the plain (decrypted) value of a setting.

    Server-side use only \u2014 never expose the result over HTTP without masking.
    Falls back to OS env var if DB has no entry.
    """
    try:
        db = get_db()
        row = await db[COLLECTION].find_one({"key": key})
        if row and row.get("value") not in (None, ""):
            stored = str(row["value"])
            # Decrypt if ciphertext (idempotent for plaintext)
            return decrypt(stored)
    except Exception:  # noqa: BLE001
        logger.exception("system_settings.get_value DB fetch failed")
    return os.environ.get(key) or None


async def list_settings(*, include_unset: bool = True) -> list[dict]:
    """Return masked list of settings (for the management UI)."""
    db = get_db()
    rows: dict[str, dict] = {}
    async for r in db[COLLECTION].find({}):
        rows[r["key"]] = r
    out = []
    for key, meta in KNOWN_SETTINGS.items():
        row = rows.get(key)
        env_value = os.environ.get(key)
        # Source priority: db > env > unset
        source: Optional[str] = None
        if row and row.get("value"):
            source = "database"
        elif env_value:
            source = "environment"

        # Decrypt the stored value for masking (we mask anyway, so no leak)
        stored = (row or {}).get("value") or env_value
        plain = decrypt(stored) if stored else None

        out.append({
            "key": key,
            "label": meta["label"],
            "description": meta["description"],
            "category": meta["category"],
            "is_secret": meta["is_secret"],
            "placeholder": meta["placeholder"],
            "is_set": bool(plain),
            "source": source,
            "value_masked": _mask(plain, is_secret=meta["is_secret"]) if plain else None,
            "updated_at": (row or {}).get("updated_at"),
            "updated_by": (row or {}).get("updated_by"),
            "updated_by_email": (row or {}).get("updated_by_email"),
        })
    # Also expose any "unknown" settings explicitly created via this API.
    for key, r in rows.items():
        if key in KNOWN_SETTINGS:
            continue
        if not r.get("updated_by_email"):
            # Skip internal collections we don't want exposed
            continue
        plain = decrypt(r.get("value")) if r.get("value") else None
        out.append({
            "key": key,
            "label": key,
            "description": r.get("description") or "",
            "category": r.get("category") or "custom",
            "is_secret": bool(r.get("is_secret", False)),
            "placeholder": "",
            "is_set": bool(plain),
            "source": "database",
            "value_masked": _mask(plain, is_secret=bool(r.get("is_secret", False))),
            "updated_at": r.get("updated_at"),
            "updated_by": r.get("updated_by"),
            "updated_by_email": r.get("updated_by_email"),
        })
    return out


async def set_value(
    key: str,
    value: str,
    *,
    user: dict,
    description: str | None = None,
    is_secret: bool | None = None,
    category: str | None = None,
) -> dict:
    db = get_db()
    if not key or not key.strip():
        raise ValidationError("Key wajib", field="key")
    if value is None:
        raise ValidationError("Value wajib", field="value")
    await _ensure_index()
    meta = KNOWN_SETTINGS.get(key, {})
    secret = bool(meta.get("is_secret", False) if is_secret is None else is_secret)
    cat = category or meta.get("category", "custom")

    plain = str(value).strip()
    stored = encrypt(plain) if secret else plain

    rec = {
        "key": key,
        "value": stored,
        "is_secret": secret,
        "category": cat,
        "description": description or meta.get("description"),
        "updated_at": _now(),
        "updated_by": user.get("id") if user else None,
        "updated_by_email": user.get("email") if user else None,
    }
    await db[COLLECTION].update_one(
        {"key": key},
        {
            "$set": rec,
            "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": _now()},
        },
        upsert=True,
    )
    await _audit(user, "set", key, {"is_secret": secret, "category": cat})

    # Invalidate runtime_config cache
    try:
        from core import runtime_config
        runtime_config.invalidate(key)
    except Exception:  # noqa: BLE001
        pass

    return {
        "key": key,
        "is_set": True,
        "is_secret": secret,
        "category": cat,
        "value_masked": _mask(plain, is_secret=secret),
        "updated_at": rec["updated_at"],
        "source": "database",
    }


async def delete_value(key: str, *, user: dict) -> bool:
    db = get_db()
    res = await db[COLLECTION].delete_one({"key": key})
    if res.deleted_count > 0:
        await _audit(user, "delete", key, {})
        try:
            from core import runtime_config
            runtime_config.invalidate(key)
        except Exception:  # noqa: BLE001
            pass
        return True
    return False


# ---------------------------------------------------------------------------
# Migration helper \u2014 re-encrypt legacy plaintext is_secret values
# ---------------------------------------------------------------------------
async def encrypt_legacy_plaintext_secrets() -> dict:
    """One-time migration: encrypt any is_secret=True rows that are still plaintext.

    Idempotent: rows already encrypted (`enc_v1::...`) are skipped.
    Safe to run on every boot.
    """
    db = get_db()
    encrypted_count = 0
    skipped_count = 0
    error_count = 0
    async for row in db[COLLECTION].find({}):
        key = row.get("key")
        meta = _meta_for(key)
        # Decide whether this row should be encrypted
        should_encrypt = bool(meta.get("is_secret", False) or row.get("is_secret"))
        value = row.get("value")
        if not should_encrypt or not value:
            skipped_count += 1
            continue
        if is_ciphertext(value):
            skipped_count += 1
            continue
        try:
            new_value = encrypt(str(value))
            if new_value == value:
                skipped_count += 1
                continue
            await db[COLLECTION].update_one(
                {"_id": row["_id"]},
                {"$set": {
                    "value": new_value,
                    "is_secret": True,
                    "encrypted_at": _now(),
                }},
            )
            encrypted_count += 1
        except Exception:  # noqa: BLE001
            logger.exception("migration encrypt failed for %s", key)
            error_count += 1
    if encrypted_count:
        logger.info(
            "system_settings migration: encrypted=%d skipped=%d errors=%d",
            encrypted_count, skipped_count, error_count,
        )
    return {
        "encrypted": encrypted_count,
        "skipped": skipped_count,
        "errors": error_count,
    }


async def _audit(user: dict | None, action: str, key: str, payload: dict) -> None:
    db = get_db()
    try:
        await db.audit_log.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": (user or {}).get("id"),
            "user_email": (user or {}).get("email"),
            "action": f"system_settings.{action}",
            "entity_type": "system_settings",
            "entity_id": key,
            "payload": payload,  # never stores the secret value
            "timestamp": _now(),
        })
    except Exception:  # noqa: BLE001
        logger.exception("audit log insert failed")
