# Sprint 1 — Indonesian Tax Compliance 2026
## Status: ✅ COMPLETE (Tested & Verified)
## Date: 2026-05-04

---

## What Was Built

### Backend
| File | Description |
|---|---|
| `models/tax.py` | Data models: WithholdingTransaction, PPH_TYPES, PPH23_SERVICE_TYPES, PPH42_SERVICE_TYPES, PPH21_BRACKETS |
| `services/tax_service.py` | PPN calc, PPh 21 progressive engine, PPh 23 engine, PPh 4(2) engine, withholding CRUD |
| `routers/tax.py` | REST API: config, types, calculate, withholding list/summary, PPh21 brackets |
| `seed/seed_sprint1_tax.py` | Seed: COA 2112/2113/2114, PPN-12 tax code, 8 system settings keys |
| `services/system_settings_service.py` | Added 8 TAX_* keys to KNOWN_SETTINGS catalog |
| `services/journal_service.py` | Updated `post_for_payroll` (PPh 21), added `post_for_withholding_payment` (PPh 23/4(2)) |
| `services/payment_service.py` | Updated `mark_paid` to inject withholding JE when wh_type is set |
| `server.py` | Registered `tax.router` |

### Frontend
| File | Description |
|---|---|
| `portals/finance/TaxCenter.jsx` | 4-tab Tax Center: PPN, PPh 21, PPh 23, PPh 4(2) with live toggles, rate editors, calculators |
| `portals/admin/TaxConfig.jsx` | Admin overview: 4 cards with toggle switches + link to Finance→Pajak |
| `portals/finance/FinancePortal.jsx` | Added "Pajak" tab → TaxCenter route |
| `portals/admin/AdminPortal.jsx` | Added "Tax / Pajak" tab → TaxConfig route |
| `portals/finance/PaymentForm.jsx` | PPh withholding section: type selector + subtype + live calc breakdown |

---

## Default Configuration
| Tax Type | Default State | Default Rate |
|---|---|---|
| PPN | **ON** | 12% (Perpu 2/2024) |
| PPh 21 | OFF | Progressive 5–35% (UU HPP 7/2021) |
| PPh 23 | OFF | 2% (jasa default) |
| PPh 4(2) | OFF | 10% (sewa bangunan default) |

**All can be toggled via Admin → Tax / Pajak or Finance → Pajak**

---

## GL Accounts Added
| Code | Name | Type |
|---|---|---|
| 2112 | Utang PPh 21 (Karyawan) | Liability |
| 2113 | Utang PPh 23 (Jasa/Royalti) | Liability |
| 2114 | Utang PPh 4(2) (Sewa/Konstruksi) | Liability |

---

## Journal Entry Logic
| Event | JE |
|---|---|
| Payment with PPh 23/4(2) | Dr: Expense (gross) / Cr: Bank (net) / Cr: Utang PPh (wh) |
| Payroll with PPh 21 | Dr: Salary Expense (gross) / Cr: Salary Payable (net-tax) / Cr: Utang PPh 21 (tax) |

---

## Test Results
- Backend: 100% (21/21 tests passed)
- Frontend: 100% (7/7 UI flows tested)
- 1 critical fix during testing: `set_value(user_id=)` → `set_value(user=)`

---

## Next: Sprint 1 Remaining (Coretax/e-Faktur)
Per user choice (1b), Coretax/e-Faktur manual export will be in a separate sprint.
Suggested: Sprint 1b — e-Faktur CSV/XML export to DJP format (no API key needed)
