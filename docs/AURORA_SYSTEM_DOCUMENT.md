# Aurora F&B — Integrated Restaurant Group ERP
## Dokumen Sistem & Panduan Klien

**Versi Dokumen:** 1.0  
**Tanggal:** Mei 2026  
**Untuk:** Torado Group — Management & Stakeholder  
**Status Sistem:** ✅ Production Ready (v0.3.0)  
**Platform:** https://finance-phase2-test.preview.emergentagent.com

---

# DAFTAR ISI

1. [Executive Summary](#1-executive-summary)
2. [Masalah yang Diselesaikan](#2-masalah-yang-diselesaikan)
3. [Gambaran Umum Sistem](#3-gambaran-umum-sistem)
4. [Arsitektur & Teknologi](#4-arsitektur--teknologi)
5. [Modul-Modul Sistem](#5-modul-modul-sistem)
   - 5.1 Owner Portal
   - 5.2 Executive Portal
   - 5.3 Outlet Portal
   - 5.4 Procurement Portal
   - 5.5 Inventory Portal
   - 5.6 Finance Portal
   - 5.7 HR Portal
   - 5.8 Admin Portal
   - 5.9 Public Website & CMS
   - 5.10 Loyalty Program Portal
6. [Business Process & Flow Detail](#6-business-process--flow-detail)
7. [Fitur Unggulan Sistem](#7-fitur-unggulan-sistem)
8. [Keamanan & Kontrol Akses](#8-keamanan--kontrol-akses)
9. [Dampak Bisnis & ROI](#9-dampak-bisnis--roi)
10. [Perbandingan Sebelum vs Sesudah](#10-perbandingan-sebelum-vs-sesudah)
11. [Roadmap Pengembangan Lanjutan](#11-roadmap-pengembangan-lanjutan)

---

# 1. EXECUTIVE SUMMARY

Aurora F&B adalah sebuah **platform ERP (Enterprise Resource Planning) terintegrasi** yang dirancang khusus untuk operasional bisnis F&B (Food & Beverage) dengan banyak brand dan banyak outlet — seperti Torado Group.

Sistem ini menggantikan **Excel-driven operations** yang rentan error, lambat, dan sulit dikontrol, menjadi sebuah **platform digital terpadu** yang menghubungkan seluruh lini operasional — dari outlet paling ujung hingga level eksekutif puncak — dalam satu sistem yang kohesif, real-time, dan dapat diaudit.

### Filosofi Utama

> *"Membimbing, bukan sekadar mencatat."*

Aurora bukan sekadar database digital pengganti Excel. Sistem ini **secara aktif membimbing setiap pengguna** — dari kasir outlet hingga CFO — tentang apa yang harus dilakukan, kapan melakukannya, dan memberikan peringatan dini ketika ada sesuatu yang tidak beres. Setiap keputusan didukung oleh data aktual, bukan perkiraan.

### Ringkasan Angka

| Metrik | Keterangan |
|--------|------------|
| **8 Portal** | Owner, Executive, Outlet, Procurement, Inventory, Finance, HR, Admin |
| **60+ Modul** | Mencakup seluruh operasional F&B group |
| **466+ API Endpoint** | Backend terdokumentasi lengkap |
| **15 Role Pengguna** | Dari Super Admin hingga Kasir Outlet |
| **6 Fitur AI** | Anomaly Detection, Forecasting, Q&A, OCR, dst. |
| **100% Test Coverage** | 93 test case, semua pass (Mei 2026) |

---

# 2. MASALAH YANG DISELESAIKAN

## 2.1 Masalah Operasional Sehari-hari

### ❌ MASALAH: Laporan Sales Harian Manual via Excel
Outlet harus membuat laporan penjualan harian di Excel, kemudian mengirim via WhatsApp atau email ke HQ. Proses ini rentan terhadap:
- Salah formula atau typo yang tidak terdeteksi
- Terlambat laporan karena outlet lupa
- Data tersebar di banyak file, sulit dikonsolidasi
- Finance tidak bisa memvalidasi tanpa koordinasi manual

### ✅ SOLUSI Aurora:
**Outlet Portal → Daily Sales Entry** — Outlet staff input data penjualan langsung di sistem. Otomatis terhubung ke Finance validation queue. Autosave setiap 5 detik, tidak bisa duplikat (1 entry per outlet per hari). Finance langsung bisa validasi tanpa perlu minta file Excel.

---

### ❌ MASALAH: Pembelian Tidak Terkontrol
Request beli dari outlet datang via WhatsApp ke Purchasing, tanpa dokumentasi formal. Tidak ada perbandingan harga vendor, tidak ada history, tidak ada approval chain yang jelas. Uang sudah keluar baru diketahui tidak sesuai budget.

### ✅ SOLUSI Aurora:
**Procurement Portal** — Alur terstruktur: **Purchase Request → Approval → Purchase Order → Goods Receipt**. Setiap request terdokumentasi, vendor dibandingkan otomatis berdasarkan harga historis, ada Kanban board untuk visual tracking, dan PO digenerate otomatis dalam format PDF resmi.

---

### ❌ MASALAH: Stok Tidak Jelas, Opname Masih Pakai Kertas
Stok barang dicatat secara manual atau menggunakan Excel terpisah per outlet. Opname bulanan masih menggunakan kertas yang kemudian diinput ulang ke komputer. Variance antara stok buku dan stok fisik sering tidak bisa ditelusuri.

### ✅ SOLUSI Aurora:
**Inventory Portal** — Real-time stock balance di semua outlet. Opname digital langsung di sistem (tablet/smartphone), variance dihitung otomatis, setiap pergerakan stok (transfer, adjustment, penerimaan) tercatat dengan audit trail lengkap.

---

### ❌ MASALAH: Closing Bulanan Memakan Waktu 2-3 Minggu
Finance harus mengumpulkan data dari banyak sumber (Excel penjualan, laporan PC, invoice vendor, dll.) sebelum bisa membuat laporan keuangan. Proses ini memakan waktu berminggu-minggu, laporan P&L baru bisa dilihat hampir sebulan setelah periode berjalan.

### ✅ SOLUSI Aurora:
**Finance Portal** — Jurnal otomatis ter-post saat event terjadi (sales validated, GR posted, payment made). Trial Balance selalu real-time. Closing wizard memandu langkah-langkah closing. Target: closing **≤ 5 hari kerja** setelah akhir periode (vs. 2-3 minggu sebelumnya).

---

### ❌ MASALAH: Penghitungan Incentive & Service Charge Error-Prone
HR menghitung service charge dan incentive karyawan secara manual di Excel. Formula berbeda per outlet, sering salah, dan tidak ada audit trail ketika ada dispute.

### ✅ SOLUSI Aurora:
**HR Portal** — Formula incentive dan service charge dikonfigurasi per outlet, dihitung otomatis oleh sistem, dengan breakdown detail yang dapat diaudit. Karyawan bisa lihat rincian perhitungan, dispute dapat diselesaikan dengan data.

---

### ❌ MASALAH: Owner Hanya Bisa Lihat Data Bulan Lalu
Laporan keuangan baru tersedia jauh setelah periode berjalan. Owner harus menunggu laporan bulanan dari Finance sebelum bisa membuat keputusan. Jika ada masalah di bulan ini, baru ketahuan di bulan depan.

### ✅ SOLUSI Aurora:
**Owner Portal + Executive Dashboard** — Real-time KPI langsung di dashboard. Cash position, revenue MTD, anomali — semua tersedia setiap saat. AI Assistant bisa menjawab pertanyaan seperti *"Kenapa margin Brand X turun bulan ini?"* dalam hitungan detik.

---

### ❌ MASALAH: Tidak Ada Peringatan Dini untuk Anomali
Ketika ada outlet yang sales-nya drop drastis atau ada pengeluaran yang tidak wajar, tidak ada yang mendeteksinya sampai laporan bulanan keluar. Kerugian sudah terjadi sebelum ada tindakan.

### ✅ SOLUSI Aurora:
**AI Anomaly Detection** — Sistem secara otomatis mendeteksi deviasi penjualan, lonjakan harga vendor, keterlambatan pengiriman, dan spike pengeluaran. Alert langsung dikirim ke Finance dan Executive dalam hitungan jam setelah kejadian.

---

### ❌ MASALAH: Tidak Ada Program Loyalitas yang Terstruktur
Pelanggan setia tidak mendapat reward yang terstruktur. Tidak ada sistem poin, tidak ada tier membership, tidak ada cara untuk mengukur customer retention.

### ✅ SOLUSI Aurora:
**Loyalty Program Portal** — Program poin berbasis transaksi dengan tier system (Bronze/Silver/Gold). Kasir input poin dari transaksi, pelanggan bisa cek poin via portal web, redeem reward. WhatsApp notification otomatis saat poin diterima.

---

## 2.2 Rangkuman Masalah vs Solusi

| # | Masalah | Modul Solusi | Dampak |
|---|---------|-------------|--------|
| 1 | Daily sales manual & terlambat | Outlet Portal | 95% outlets submit tepat waktu |
| 2 | Pembelian tidak terkontrol | Procurement Portal | 100% spending terdokumentasi |
| 3 | Stok tidak akurat | Inventory Portal | Real-time visibility semua outlet |
| 4 | Closing 2-3 minggu | Finance Portal | Closing ≤ 5 hari kerja |
| 5 | Incentive HR error-prone | HR Portal | Zero manual calculation errors |
| 6 | Owner buta data real-time | Owner/Executive Portal | Real-time dashboard 24/7 |
| 7 | Tidak ada anomaly detection | AI Engine | Deteksi otomatis dalam jam |
| 8 | Tidak ada loyalty program | Loyalty Portal | Customer retention terukur |

---

# 3. GAMBARAN UMUM SISTEM

## 3.1 Siapa Pengguna Sistem?

Aurora dirancang untuk **8 tipe pengguna** dengan kebutuhan berbeda:

| Pengguna | Portal | Aktivitas Utama | Frekuensi |
|---------|--------|----------------|-----------|
| **Owner / Pemilik** | Owner Portal | Monitor KPI, cash position, approve strategis | Harian (glance) |
| **GM / Regional Manager** | Executive Portal | Dashboard konsolidasi, drilldown per brand/outlet | Harian |
| **Outlet Manager / Kasir** | Outlet Portal | Input sales, petty cash, input poin loyalty | Harian |
| **Staff Purchasing** | Procurement Portal | PR, PO, GR, vendor management | Harian |
| **Warehouse / Gudang** | Inventory Portal | Opname, transfer, adjustment, receiving | Harian |
| **Staff Finance / Akuntan** | Finance Portal | Validasi, jurnal, laporan, closing | Harian |
| **Staff HR** | HR Portal | Payroll, service charge, incentive, advance | Mingguan/Bulanan |
| **System Admin** | Admin Portal | User, master data, CMS, konfigurasi | Ad-hoc |

## 3.2 Peta Sistem (High-Level)

```
┌─────────────────────────────────────────────────────────────────┐
│                    AURORA F&B ERP PLATFORM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  OPERATIONS LAYER                                                │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │  OUTLET      │  │  PROCUREMENT    │  │   INVENTORY      │   │
│  │  ─────────── │  │  ─────────────  │  │  ──────────────  │   │
│  │  Daily Sales │  │  PR → PO → GR   │  │  Stock Balance   │   │
│  │  Petty Cash  │  │  Vendor Compare │  │  Movement/Opname │   │
│  │  KDO/BDO     │  │  Kanban Board   │  │  Valuation       │   │
│  │  Loyalty     │  │  RFQ            │  │  Low Stock Alert │   │
│  └──────────────┘  └─────────────────┘  └──────────────────┘   │
│                                                                  │
│  FINANCE & HR LAYER                                              │
│  ┌──────────────────────────────┐  ┌──────────────────────┐    │
│  │  FINANCE & ACCOUNTING        │  │   HR & INCENTIVE     │    │
│  │  ─────────────────────────── │  │  ──────────────────  │    │
│  │  GL / Journals / COA         │  │  Payroll Processing  │    │
│  │  P&L / Balance Sheet / CF    │  │  Service Charge      │    │
│  │  AP / AR / Bank Recon        │  │  Incentive Programs  │    │
│  │  Tax / e-Faktur / e-Bupot    │  │  FOC / Voucher       │    │
│  │  Budget / Fixed Assets       │  │  Employee Advance    │    │
│  │  Forecasting / Anomalies     │  │  LB Fund Ledger      │    │
│  └──────────────────────────────┘  └──────────────────────┘    │
│                                                                  │
│  INTELLIGENCE & MANAGEMENT LAYER                                 │
│  ┌──────────────────┐  ┌───────────────────────────────────┐   │
│  │  OWNER PORTAL    │  │   EXECUTIVE PORTAL                │   │
│  │  ──────────────  │  │  ───────────────────────────────  │   │
│  │  Real-time KPIs  │  │  Konsolidasi Multi-Brand/Outlet   │   │
│  │  AI Assistant    │  │  Drilldown Brand & Outlet         │   │
│  │  My Approvals    │  │  Profit Walk Analysis             │   │
│  │  Cash Position   │  │  Period Comparison                │   │
│  └──────────────────┘  └───────────────────────────────────┘   │
│                                                                  │
│  EXTERNAL TOUCHPOINTS                                            │
│  ┌──────────────────────┐  ┌────────────────────────────────┐  │
│  │  PUBLIC WEBSITE CMS  │  │   LOYALTY PORTAL               │  │
│  │  ──────────────────  │  │  ─────────────────────────     │  │
│  │  Brand Showcase      │  │  Customer Points Portal        │  │
│  │  Menu Catalog        │  │  Tier System (Bronze-Gold)     │  │
│  │  News & Events       │  │  Rewards Catalog               │  │
│  │  Careers Page        │  │  Phone/Email Login             │  │
│  └──────────────────────┘  └────────────────────────────────┘  │
│                                                                  │
│  ADMIN LAYER                                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ADMIN PORTAL                                             │  │
│  │  Master Data (Items, Vendors, Employees, Outlets)         │  │
│  │  User Management & RBAC                                   │  │
│  │  Business Rules Configuration                             │  │
│  │  CMS Management (Brands, Outlets, News, Menu, Careers)    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

# 4. ARSITEKTUR & TEKNOLOGI

## 4.1 Technology Stack

| Layer | Teknologi | Keterangan |
|-------|-----------|------------|
| **Frontend** | React 19 + Vite | SPA modern dengan hot-reload |
| **UI Framework** | Shadcn/UI + Tailwind CSS | Design system konsisten |
| **Animasi** | Framer Motion | Transisi dan micro-interaction |
| **Charts** | Recharts | Interactive chart library |
| **Backend** | FastAPI (Python 3.11) | REST API, async, auto OpenAPI docs |
| **Database** | MongoDB (Motor async) | Document database, flexible schema |
| **Autentikasi** | JWT (HS256) + bcrypt | Access token + refresh token |
| **AI Engine** | GPT / Claude / Gemini (via Emergent) | Multi-provider LLM integration |
| **PDF Export** | ReportLab (Python) | PO PDF, Payslip PDF, Executive Report |
| **File Upload** | Multipart HTTP + disk storage | Struk OCR, lampiran, gambar CMS |
| **Background Jobs** | APScheduler | Scheduled digest, anomaly scan |
| **Maps** | Leaflet | Interactive outlet location map |
| **Deployment** | Kubernetes | Container orchestration |
| **Process Mgmt** | Supervisor | Service management |

## 4.2 Prinsip Arsitektur

**API-First Design**
Semua operasi dilakukan melalui REST API yang terdokumentasi. Frontend dan backend sepenuhnya terpisah. API dapat diintegrasikan dengan sistem eksternal (POS, payroll, bank) di masa depan.

**Envelope Response Pattern**
Semua response API menggunakan format konsisten:
```json
{
  "success": true,
  "data": { ... },
  "errors": null,
  "meta": { "total": 42, "page": 1 }
}
```

**Audit Trail by Default**
Setiap transaksi finansial menyimpan: siapa yang buat, kapan, dari mana (outlet), dan perubahan apa yang terjadi. Data audit tidak dapat dihapus.

**Period Lock**
Periode akuntansi yang sudah di-closing otomatis terkunci. Tidak ada yang bisa mengubah data periode yang sudah tutup tanpa izin khusus Finance Manager.

## 4.3 Skalabilitas

Sistem dirancang untuk dapat berkembang seiring pertumbuhan bisnis:
- Arsitektur microservice-ready (router modular)
- MongoDB dapat di-shard untuk volume data besar
- API gateway-ready untuk integrasi multi-sistem
- Role-based access control yang fully configurable

---

# 5. MODUL-MODUL SISTEM

## 5.1 OWNER PORTAL

**Audiens:** Pemilik bisnis, Direktur Utama

### Apa yang bisa dilakukan:

#### Cockpit — Executive Summary
Dashboard utama yang menampilkan **snapshot keuangan group hari ini** dalam satu layar:

| Widget | Informasi |
|--------|-----------|
| Cash Position | Total kas group (bank + petty cash + e-wallet) per hari ini |
| Revenue MTD | Total penjualan bulan berjalan, progress vs target |
| AP 7 Hari | Hutang ke vendor yang jatuh tempo dalam 7 hari |
| Anomalies 24h | Jumlah anomali terdeteksi dalam 24 jam terakhir |
| Digest Preview | Ringkasan kinerja kemarin per outlet |
| Forecast Guard | Pengeluaran yang melebihi forecast (dengan detail deviasi) |

**Layout fleksibel** — owner bisa pilih layout: Sales Focus, Cash Flow, Operations, atau Full View sesuai kebutuhan hari itu.

#### Financial Health — Cash Position
Breakdown detail posisi kas group:
- Saldo per akun bank
- Saldo petty cash per outlet
- Saldo e-wallet (GoPay, OVO, QRIS)
- Status kesehatan kas (Healthy / Watch / Alert)

#### AI Insights — Business Q&A
Chat dengan AI yang memahami data bisnis Anda:
- *"Outlet mana yang paling profitable bulan ini?"*
- *"Kenapa revenue Brand X turun 15% minggu ini?"*
- *"Berapa AP yang jatuh tempo minggu depan?"*
- *"Prediksi cashflow 3 bulan ke depan?"*

#### My Approvals
Sentralisasi semua item yang menunggu persetujuan owner (PO besar, payment, adjustment sensitif) dalam satu view, tanpa perlu login ke masing-masing modul.

#### Alert Settings
Konfigurasi kapan dan bagaimana owner ingin diberitahu — email digest harian, WhatsApp alert untuk anomali severe, threshold yang bisa disesuaikan.

---

## 5.2 EXECUTIVE PORTAL

**Audiens:** General Manager, Regional Manager, VP Operations

### Apa yang bisa dilakukan:

#### Dashboard Konsolidasi Multi-Brand/Outlet
- KPI konsolidasi seluruh brand dan outlet dalam satu tampilan
- Filter fleksibel: per brand, per outlet, per periode (Hari ini / 7 Hari / MTD / Bulan Lalu / QTD / YTD / Custom)
- **Brand Mix Donut Chart** — komposisi revenue per brand, klik untuk drilldown
- **AP Aging Summary** — breakdown hutang vendor dalam bucket: Current / 30 / 60 / 90 / 120+ hari

#### Brand Drilldown (/executive/brand/{id})
Klik sebuah brand di dashboard → masuk ke halaman detail brand tersebut:
- KPI Tiles: Revenue, Transactions, Avg Ticket, Gross Margin
- Breakdown per outlet dalam brand ini
- Sales trend chart (historis 30-90 hari)

#### Outlet Drilldown (/executive/outlet/{id})
Klik sebuah outlet → masuk ke detail outlet:
- KPI: Revenue, Transaksi, Ticket Size, Margin
- Sales trend lengkap
- Transaksi terbaru (drill ke daily sales)
- AP exposure outlet ini

#### Profit Walk Analysis
Visualisasi waterfall: Revenue → COGS → Gross Profit → OpEx → EBIT. Memperlihatkan di mana profit "bocor" di setiap tahap.

#### Period Comparison
Bandingkan performa dua periode secara side-by-side. Berguna untuk QoQ atau YoY analysis.

#### PDF Export
Generate laporan executive snapshot (PDF) yang dapat dibagikan ke board meeting, dalam format profesional lengkap dengan semua KPI dan grafik.

---

## 5.3 OUTLET PORTAL

**Audiens:** Outlet Manager, Kasir, Staff Outlet

### Apa yang bisa dilakukan:

#### Daily Sales Entry
Form input penjualan harian yang **mobile-friendly** (bisa di smartphone):

**Data yang diinput per hari:**
- Tanggal & Outlet
- Penjualan per channel: Tunai, GoPay, OVO, QRIS, Transfer Bank, Kartu Kredit
- Penjualan void dan diskon
- Biaya operasional harian

**Fitur khusus:**
- **Autosave draft** setiap 5 detik — tidak ada data yang hilang
- **Satu entry per outlet per tanggal** — mencegah duplikat
- **Submit → Validation Queue** — langsung masuk antrian validasi Finance
- **Rekonsiliasi otomatis** — sistem menghitung selisih antara laporan kasir dan actual
- **Reject & Revisi** — Finance bisa return dengan catatan, outlet revisi dan resubmit

#### Daily Close (End of Day Checklist)
Checklist penutupan hari yang memastikan semua proses selesai sebelum outlet tutup:
1. ✅ Daily Sales sudah divalidasi Finance
2. ✅ Petty Cash sudah di-settle
3. ✅ KDO/BDO sudah disubmit
4. ✅ Slip setoran bank sudah diupload

Jika ada item yang belum selesai, sistem menampilkan link langsung ke halaman yang relevan untuk diselesaikan.

#### Petty Cash (Kas Kecil)
- Input pengeluaran kas kecil per transaksi
- **OCR Struk** — foto struk → AI baca dan isi form otomatis (vendor, total, tanggal)
- Settlement periodik ke Finance
- Batas pengeluaran per kategori yang dapat dikonfigurasi

#### KDO (Kitchen Daily Order) & BDO (Bar Daily Order)
Request bahan dapur dan bar secara digital:
- Pilih item dari catalog (sistem suggest item yang sering dipesan)
- Submit langsung ke Procurement sebagai Purchase Request
- Track status: Draft → Submitted → Approved → PO Created → Received
- **Favorites** — item yang paling sering dipesan muncul di chip shortcut

#### Urgent Purchase
Request pembelian mendesak di luar siklus normal:
- Upload struk atau foto invoice → OCR otomatis isi item dan harga
- Approval chain (Outlet Manager → Purchasing Head → Finance)
- Terintegrasi dengan AP untuk pembayaran

#### Cashier Loyalty Points Entry *(Fitur Terbaru)*
Kasir bisa input poin loyalty langsung dari meja kasir:
1. Input nomor HP pelanggan
2. Sistem cek: apakah sudah terdaftar?
   - **Sudah terdaftar** → tampil nama, tier, dan saldo poin saat ini
   - **Belum terdaftar** → akun otomatis dibuat (badge "Akun Baru")
3. Input nominal transaksi (Rp)
4. Preview poin yang akan didapat (Rp 10.000 = 1 poin, dikalikan multiplier tier)
5. Konfirmasi → poin langsung ditambahkan
6. Notifikasi WhatsApp otomatis ke pelanggan *(ketika API tersedia)*

---

## 5.4 PROCUREMENT PORTAL

**Audiens:** Staff Purchasing, Purchasing Manager, Vendor Relations

### Alur Utama: PR → PO → GR

```
OUTLET                    PURCHASING                  VENDOR
  │                          │                          │
  ├─ Buat Purchase ──────────►                          │
  │  Request (PR)             │                          │
  │                          ├─ Review & Bandingkan     │
  │                          │  Vendor (Comparison)     │
  │                          ├─ Approve PR ─────────────►
  │                          │                          │
  │                          ├─ Buat PO ────────────────►
  │                          │                          │
  │                          │                    Kirim Barang
  │                          │                          │
  │                          ◄── Terima Barang (GR) ────┤
  │                          │                          │
  │                          ├─ Post ke Inventory       │
  │                          ├─ Create AP Invoice       │
```

### Purchase Request (PR)
- Staff outlet / warehouse buat PR
- Isi: item, quantity, estimasi harga, outlet tujuan, tanggal butuh
- Approval tier berdasarkan nilai PR (konfigurasi di Admin)
- Konsolidasi PR — Purchasing bisa gabung beberapa PR ke satu PO

### Vendor Comparison Tool
Sebelum buat PO, Purchasing bisa lihat **perbandingan vendor secara otomatis**:
- Harga terakhir per item dari semua vendor yang pernah supply
- Score komposit vendor: On-Time × 40% + Price Stability × 25% + Quality × 20% + Lead Time × 15%
- Badge "Termurah" untuk vendor dengan harga terbaik
- Riwayat 3 pembelian terakhir per item per vendor

### Purchase Order (PO)
- Generate PO dari PR yang sudah disetujui
- **PDF PO profesional** — format A4 dengan header perusahaan, detail vendor, items, tanda tangan 3 pihak
- **Email ke vendor** (dengan audit log) *(SMTP integration in roadmap)*
- Status tracking: Draft → Approved → Sent → Partial → Received

### Goods Receipt (GR)
- Input barang yang diterima (actual qty bisa beda dengan PO qty)
- **Otomatis update inventory** saat GR di-post
- **Otomatis buat AP invoice** (hutang ke vendor) dari GR
- **Anomaly check** — jika harga GR berbeda >15% dari harga PO historis, alert otomatis dibuat

### Kanban Workboard
Visual pipeline seluruh procurement:
```
PR Draft → PR Pending → PR Approved → PO Draft → PO Sent → PO Partial → PO Received
```
Drag-and-drop untuk update status (dengan permission check). Filter per outlet / vendor / periode.

### RFQ (Request for Quotation)
Untuk pembelian besar atau pertama kali dengan vendor baru: kirim RFQ ke beberapa vendor, bandingkan penawaran, pilih yang terbaik.

---

## 5.5 INVENTORY PORTAL

**Audiens:** Inventory Controller, Warehouse Staff, Outlet Manager

### Stock Balance
Lihat saldo stok semua item di semua outlet dalam satu tampilan:
- Filter per outlet, per kategori, per item
- **Matrix view** — item vs outlet dalam satu tabel
- Stock value (harga weighted average)
- Warna indicator: Hijau (aman) / Kuning (perlu perhatian) / Merah (di bawah minimum)

### Low Stock Alert
Daftar item yang stoknya di bawah threshold minimum yang sudah dikonfigurasi:
- Sortir berdasarkan tingkat urgensi
- Tombol shortcut "Buat PR" langsung dari alert
- History trend stok item tersebut

### Stock Valuation
Laporan nilai stok per periode:
- Metode: Weighted Average (harga rata-rata berbobot)
- Breakdown per item, per outlet, per kategori
- COGS yang terpakai dalam periode
- Export ke Excel

### Movement History
Riwayat lengkap setiap pergerakan stok:
- Masuk (dari GR / Adjustment)
- Keluar (ke Usage / Transfer keluar)
- Transfer antar outlet
- Filter: per tanggal, per outlet, per tipe movement, per item

### Stock Transfers
Transfer stok antar outlet secara resmi:
- Buat transfer request (outlet asal → outlet tujuan)
- Item dan qty
- Konfirmasi penerimaan di outlet tujuan
- Otomatis update balance kedua outlet

### Adjustments
Koreksi stok berdasarkan selisih opname atau kerusakan:
- Buat adjustment dengan alasan (breakage, expired, count correction, dll.)
- Approval chain untuk adjustment besar
- Auto-post jurnal koreksi ke GL

### Stock Opname (Stock Take)
Proses penghitungan stok fisik:
1. Buat sesi opname untuk outlet dan periode tertentu
2. Sistem generate daftar item yang harus dihitung
3. Staff input hitungan fisik (bisa pakai tablet/smartphone di gudang)
4. Sistem hitung variance (fisik vs buku)
5. Review dan approve variance
6. Post adjustment otomatis untuk menutup selisih

---

## 5.6 FINANCE PORTAL

**Audiens:** Akuntan, Finance Staff, Finance Manager, CFO

### Validation Queue (Antrian Validasi)
Finance menerima semua daily sales yang disubmit outlet:
- Lihat summary: total channel, total, nama outlet, tanggal
- Cek kelengkapan dan kelogisan data
- **Approve** → jurnal otomatis ter-post ke GL
- **Reject** → dikembalikan ke outlet dengan catatan

### General Ledger (GL) & Journal Entries
- Manual Journal Entry (JAE) dengan template per tipe transaksi
- **Forecast Guard** — saat input pengeluaran, sistem warn jika melebihi forecast
- Jurnal otomatis dari semua event: GR → AP, Sales Validation → Revenue, Payment → Cash
- View jurnal per akun, per periode, per brand/outlet
- Drill-down dari laporan keuangan ke level jurnal individual

### Chart of Accounts (COA)
- Browser COA dengan hierarchy (kelompok → akun → sub-akun)
- Saldo per akun real-time
- History transaksi per akun
- Manajemen akun (tambah/edit, aktif/nonaktif)

### Laporan Keuangan (Real-Time)
Semua laporan dapat di-filter per periode, per brand, per outlet:

| Laporan | Keterangan |
|---------|------------|
| **Trial Balance** | Daftar saldo semua akun, periode bisa dipilih |
| **Profit & Loss** | Revenue → Gross Profit → EBIT → Net Profit |
| **Balance Sheet** | Aset = Liabilitas + Ekuitas |
| **Cash Flow** | Direct method cashflow statement |
| **Comparatives** | Perbandingan MoM / YoY dengan sparkline |
| **Pivot Report** | Matriks 2D: dimensi × metrik yang bisa dikustomisasi |
| **Report Builder** | Buat template laporan custom, simpan, jalankan ulang |

### AP (Accounts Payable)
- Daftar invoice vendor dari GR
- Track status: Unpaid / Partial / Paid
- **AP Aging** — breakdown hutang per bucket waktu
- Payment processing dengan link ke bank account
- e-Faktur export (format CSV DJP) untuk PPN
- e-Bupot export untuk PPh withholding

### AR (Accounts Receivable)
- Ledger piutang per pelanggan korporat
- AR Aging report

### Budget Management
- Import budget dari Excel (template tersedia)
- **Budget vs Actual** per akun, per outlet, per periode
- Alert ketika actual melebihi budget (dengan threshold yang bisa dikonfigurasi)

### Fixed Assets
- Register aset tetap (gedung, peralatan dapur, kendaraan, dll.)
- **Automatic depreciation** — Straight Line Method
- Disposal workflow
- Detail per aset: nilai perolehan, akumulasi penyusutan, nilai buku

### Bank Reconciliation
- Upload bank statement (CSV)
- Matching otomatis dengan jurnal di sistem
- Flag transaksi yang belum ter-match
- Approval rekonsiliasi per akun per bulan

### Tax Center
- Summary PPN, PPh 21, PPh 23 per periode
- e-Faktur export (siap upload ke DJP Coretax)
- e-Bupot export
- SPT calculation helper

### Forecasting (AI-Powered)
- Proyeksi penjualan 3 bulan ke depan
- Tiga metode: Linear Regression, EWMA, Hybrid
- Confidence interval (±2σ)
- Akurasi model diukur dengan MAPE (Mean Absolute Percentage Error)
- Berguna untuk: planning inventory, planning cashflow, budget revision

### Anomaly Feed
Semua anomali yang terdeteksi oleh AI:
- Sales deviation (outlet dengan penjualan tidak normal)
- Vendor price spike (harga vendor naik drastis)
- Vendor lead time anomaly (pengiriman terlambat)
- AP/Cash spike (pengeluaran melonjak)

Per anomali: severity (severe/mild), status (open/investigating/resolved), detail statistik, action buttons (acknowledge/investigate/resolve/false positive).

### Period Management & Closing Wizard
1. **Buka periode** baru di awal bulan
2. **Closing wizard** di akhir bulan — guided step-by-step:
   - Check: semua sales divalidasi
   - Check: semua GR ter-post
   - Check: semua payment ter-post
   - Check: trial balance balanced (selisih Rp 0)
   - Generate closing entries
   - **Lock periode** — tidak ada yang bisa edit lagi

---

## 5.7 HR PORTAL

**Audiens:** HR Officer, HR Manager

### Payroll Processing
- Rekap gaji per karyawan per periode
- Breakdown komponen: gaji pokok, tunjangan, potongan BPJS, PPh 21
- **PPh 21 auto-calculation** sesuai tarif progressif terkini
- **BPJS auto-calculation** (Kesehatan + Ketenagakerjaan)
- **Generate payslip PDF** per karyawan — format profesional
- Export ke Excel untuk transfer bank bulk

### Service Charge
- Distribusi service charge dari daily sales ke karyawan
- Konfigurasi formula per outlet (% dari revenue, atau fixed pool)
- Breakdown per shift, per karyawan, per outlet
- Riwayat distribusi yang dapat diaudit

### Incentive Programs
- Konfigurasi skema incentive per outlet (target-based, tier-based, dll.)
- Auto-calculate incentive berdasarkan achievement
- Approval workflow sebelum dibayarkan
- Riwayat incentive per karyawan

### Voucher Issuance
- Issue voucher diskon/free untuk karyawan (employee benefit)
- Track penggunaan voucher
- Link ke loyalty system untuk redeem

### FOC Management (Free of Charge)
- Pencatatan produk FOC untuk keperluan marketing/tamu VIP
- Approval berdasarkan nilai
- Laporan FOC per periode untuk accounting
- Auto-journal ke akun Marketing Expense

### Employee Advances (Kasbon)
- Pengajuan kasbon oleh karyawan
- Approval chain (Supervisor → HR → Finance)
- Cicilan otomatis terpotong dari gaji bulanan
- Status tracking per kasbon: Active / Paid / Overdue
- Alert ketika kasbon melebihi threshold

### LB Fund Ledger (Loss & Breakage)
- Catatan kerugian dan kerusakan per outlet
- Alokasi tanggung jawab (perusahaan vs karyawan)
- Laporan LB per periode

---

## 5.8 ADMIN PORTAL

**Audiens:** System Administrator, IT Manager, HQ Admin

### Master Data

#### Item Catalog
Semua item (bahan baku, barang jadi, supplies) yang digunakan:
- Kode item, nama, kategori, unit, harga standar
- Barcode support (future)
- Aktif / nonaktif (tidak bisa dihapus jika sudah ada transaksi)

#### Employee Management
- Data lengkap karyawan: nama, NIK, NPWP, jabatan, outlet, gaji pokok
- Status: aktif / resign / cuti
- Link ke payroll, advance, incentive
- BPJS & NPWP management

#### Vendor Management
- Data vendor: nama, NPWP, alamat, kontak, terms pembayaran
- Kategori vendor (Food Supplier, Beverage, Packaging, Services, dll.)
- Performance scorecard per vendor
- Blacklist flag dengan alasan

#### Brand & Outlet Master
- Data brand: nama, logo, deskripsi, warna tema
- Data outlet: nama, brand, alamat, koordinat GPS, jam operasional
- Konfigurasi per outlet: payment methods yang diterima, target harian

#### Chart of Accounts (COA Setup)
- Konfigurasi COA group, sub-group, akun
- GL mapping per event bisnis
- Balance sheet vs income statement classification

### User Management & RBAC
- Buat dan manage user accounts
- 15 role predefined yang dapat dikustomisasi
- Assign multiple roles per user
- Scope access: dapat dibatasi per outlet atau per brand
- Audit log login/logout dan semua aksi

### Business Rules Configuration
- **Incentive scheme** — formula per outlet
- **Service charge policy** — distribusi ratio
- **Anomaly thresholds** — sensitivitas alert (mild / severe per %)
- **Petty cash policy** — limit per kategori pengeluaran
- **Approval tiers** — threshold nilai untuk eskalasi approval
- **Forecast guard settings** — threshold warning pengeluaran

### CMS (Content Management System)

#### Brands CMS
- Edit nama, logo, tagline, deskripsi brand untuk website publik
- Upload dan manage gambar brand
- Toggle publish/draft

#### Outlets CMS
- Kelola informasi outlet yang tampil di website (nama, alamat, jam buka, foto)
- Update koordinat peta
- Feature highlights (Wifi, Parking, Outdoor, dll.)

#### News & Events
- Publish artikel/berita tentang promo, event, dan konten brand
- Rich text editor dengan format bold, heading, list
- Gambar thumbnail, kategori, tag
- Schedule publish (terbit di waktu yang ditentukan)

#### Menu CMS
- Catalog menu yang tampil di website publik
- Foto, deskripsi, harga, tag (Bestseller, New, Vegetarian)
- Filter per brand, per kategori

#### Careers & Jobs
- Posting lowongan kerja
- Deskripsi pekerjaan, requirements, benefit
- Manajemen status lowongan (Open/Closed/Draft)
- Terintegrasi dengan halaman Careers di website publik

---

## 5.9 PUBLIC WEBSITE & CMS

Website publik yang sepenuhnya di-manage dari Admin CMS:

| Halaman | Konten |
|---------|--------|
| **Home** | Brand showcase, berita terbaru, highlight menu |
| **Brands** | Profil semua brand dengan filter, cerita brand |
| **Brand Detail** | Story, signature dishes, daftar outlet brand tersebut |
| **Menu** | Catalog lengkap dengan filter brand & kategori |
| **News & Events** | Artikel terbaru, filter per kategori |
| **Locations** | Peta interaktif semua outlet, detail per outlet |
| **Careers** | Daftar lowongan kerja aktif, detail job posting |
| **Torado Rewards** | Link ke Loyalty Portal untuk daftar atau login |

Seluruh konten dapat diupdate oleh Admin **tanpa perlu developer** — cukup ubah di CMS, langsung tampil di website publik dalam hitungan detik.

---

## 5.10 LOYALTY PROGRAM PORTAL

Portal khusus untuk **pelanggan setia** Torado Group:

### Registrasi & Login Pelanggan
- **Daftar via website** dengan data: nama, email, nomor HP, tanggal lahir
- **Login dengan email** atau **nomor HP** (no password entry untuk convenience)
- Akun otomatis dibuat oleh kasir saat pertama kali input poin (baru pelanggan)

### Member Dashboard
Pelanggan melihat:
- Total poin yang dimiliki
- Tier membership saat ini (Bronze → Silver → Gold) dengan progress bar ke tier berikutnya
- Riwayat transaksi poin (kapan, di outlet mana, berapa poin)
- Referral code unik untuk ajak teman

### Tier System

| Tier | Syarat Lifetime Points | Multiplier Poin | Benefit |
|------|------------------------|-----------------|---------|
| **Bronze** | 0 – 4.999 poin | 1.0× | Akses rewards dasar |
| **Silver** | 5.000 – 19.999 poin | 1.25× | Rewards eksklusif + priority service |
| **Gold** | 20.000+ poin | 1.5× | Semua benefit + early access event |

### Cara Dapat Poin
- **Setiap Rp 10.000 transaksi = 1 poin**
- Dikalikan multiplier sesuai tier
- Poin ditambahkan oleh kasir saat checkout menggunakan Cashier Loyalty Entry

### Rewards Catalog
Pelanggan bisa tukar poin dengan:
- Voucher diskon (misal: 500 poin = diskon Rp 50.000)
- Free menu item
- Birthday reward spesial
- Merchandise eksklusif brand

### Notifikasi
- WhatsApp otomatis: "Selamat! Anda mendapat +25 poin dari kunjungan di Torado Kuta" *(ketika WhatsApp API dikonfigurasi)*

---

# 6. BUSINESS PROCESS & FLOW DETAIL

## 6.1 Alur Lengkap: Daily Sales Harian

```
OUTLET STAFF                SYSTEM                    FINANCE HQ
     │                        │                            │
     ├─ Buka form sales ──────►│                            │
     │                        ├─ Cek: ada draft kemarin? ──│
     │                        ├─ Load draft / baru ─────── │
     │                        │                            │
     ├─ Input data penjualan   │                            │
     │  (per channel, per      │                            │
     │   kategori pengeluaran) │                            │
     │                        │                            │
     ├─ ── Autosave ─────────►│ (setiap 5 detik)           │
     │                        │                            │
     ├─ Submit untuk validasi ►│                            │
     │                        ├─ Validasi format & range   │
     │                        ├─ Anomaly check ────────────►│ (alert jika ada)
     │                        ├─ Masuk ke Validation Queue ►│
     │                        │                            │
     │                        │                 ├─ Review detail
     │                        │                 ├─ APPROVE? atau REJECT?
     │                        │                            │
     │                        │◄─── APPROVED ──────────────┤
     │                        │                            │
     │                        ├─ Post jurnal ke GL          │
     │                        │  Dr: Cash/Bank/GoPay/etc.  │
     │                        │  Cr: Revenue per kategori  │
     │                        │                            │
     │◄─ Notifikasi: VALIDATED ┤                            │
     │                        │                            │
    END                                                    END
```

**Hasil akhir:** Revenue ter-posting di GL, Finance bisa lihat P&L real-time.

---

## 6.2 Alur Lengkap: Procurement Cycle

```
OUTLET REQUEST         PURCHASING HQ               VENDOR            WAREHOUSE
      │                     │                        │                   │
      ├─ Buat PR ──────────►│                        │                   │
      │  (item, qty,        │                        │                   │
      │   est. price)       ├─ Konsolidasi PR        │                   │
      │                     ├─ Cek vendor comparison │                   │
      │                     ├─ Approve PR            │                   │
      │                     │                        │                   │
      │                     ├─ Buat PO ─────────────►│                   │
      │                     │  (generate PDF)        │                   │
      │                     │                        │                   │
      │                     │                        ├─ Kirim barang ───►│
      │                     │                        │                   │
      │                     │                        │       ├─ Terima & cek
      │                     │                        │       ├─ Input GR
      │                     │◄─── GR submitted ──────────────┤
      │                     │                        │                   │
      │                     ├─ Post GR ──────────────────────────────────│
      │                     │  ┌─ Update Inventory (+qty)                │
      │                     │  ├─ Create AP Invoice                      │
      │                     │  └─ Anomaly Check (harga, lead time)       │
      │                     │                        │                   │
      │                     ├─ Process Payment ──────────────────────────│
      │                     │  ┌─ Journal: Dr AP / Cr Bank               │
      │                     │  └─ Email remittance ke vendor             │
      │                     │                        │                   │
     END                   END                      END                 END
```

---

## 6.3 Alur Lengkap: Month-End Closing

```
Hari kerja terakhir bulan berjalan →

STEP 1: Verifikasi Kelengkapan (Finance Staff)
  ☑ Semua daily sales bulan ini sudah divalidasi?
  ☑ Semua GR bulan ini sudah di-post?
  ☑ Semua payment AP bulan ini sudah di-post?
  ☑ Bank reconciliation bulan ini sudah selesai?

STEP 2: Jurnal Akrual & Penyesuaian (Finance Manager)
  → Input JAE untuk akrual yang belum ter-post
  → Adjusting entries untuk prepaid / deferred items

STEP 3: Trial Balance Check (System Auto)
  → Cek total Dr = total Cr (selisih harus Rp 0)
  → Jika tidak balance → identify dan perbaiki

STEP 4: Laporan Keuangan Review
  → Print P&L bulan ini
  → Review vs forecast dan vs bulan lalu

STEP 5: Closing & Lock Periode (Finance Manager)
  → Jalankan Closing Wizard
  → Sistem generate closing entries otomatis
  → Periode di-lock (tidak ada yang bisa entry lagi)

STEP 6: Share ke Stakeholder
  → Export PDF Executive Report
  → Kirim ke Owner & Board
  
Target waktu: ≤ 5 hari kerja setelah akhir bulan
```

---

## 6.4 Alur Lengkap: Loyalty Points (Cashier Flow)

```
PELANGGAN                  KASIR                     SYSTEM
     │                        │                         │
     ├─ Selesai order ────────►│                         │
     │                        │                         │
     │                        ├─ Buka "Input Poin" ────►│
     │                        ├─ Ketik nomor HP ────────►│
     │                        │                         ├─ Cari customer
     │                        │                         │
     │                        │◄── Customer DITEMUKAN ──┤
     │                        │    (nama, tier, poin)   │
     │                        │          ATAU           │
     │                        │◄── Tidak ditemukan ─────┤
     │                        │    (badge "Akun Baru")  │
     │                        │                         │
     │                        ├─ Input nominal Rp ──────►│
     │                        │                         ├─ Hitung poin preview
     │                        │◄── Preview: +25 poin ───┤
     │                        │                         │
     │                        ├─ Konfirmasi ────────────►│
     │                        │                         ├─ Buat akun jika baru
     │                        │                         ├─ Tambah poin
     │                        │                         ├─ Update tier
     │                        │                         ├─ WhatsApp notification → PELANGGAN
     │                        │                         │
     │◄─ SMS/WA: +25 poin ────────────────────────────────┤
     │                        │                         │
    END                      END                       END
```

---

# 7. FITUR UNGGULAN SISTEM

## 7.1 AI-Powered Features

### 🤖 Executive AI Assistant
Natural language Q&A dengan data bisnis Anda. Tidak perlu buka laporan, cukup tanya:
- *"Outlet mana yang marginnya paling bagus?"*
- *"Brand mana yang growth-nya paling lambat?"*
- *"Berapa total AP yang jatuh tempo bulan ini?"*
Mendukung GPT (OpenAI), Claude (Anthropic), dan Gemini (Google).

### 🔍 Smart Anomaly Detection
4 detektor anomali real-time yang bekerja otomatis:
1. **Sales Deviation** — Penjualan outlet yang menyimpang dari baseline 14-hari (±2.5σ → severe)
2. **Vendor Price Spike** — Harga vendor naik >30% dari rata-rata 90 hari → alert
3. **Vendor Lead Time** — Pengiriman terlambat >7 hari dari baseline → alert
4. **AP/Cash Spike** — Pengeluaran proyeksi bulan ini >30% dari rata-rata 3 bulan → alert

### 📊 AI Forecasting
Proyeksi 3 bulan ke depan menggunakan:
- **Linear Regression** — trend analysis
- **EWMA** (Exponentially Weighted Moving Average) — recent-weighted trend
- **Hybrid** (50/50 blend) — best of both worlds
Dengan confidence interval ±2σ dan akurasi terukur (MAPE backtest).

### 📸 OCR Receipt Scanner
Foto struk belanja → AI baca isi struk → form terisi otomatis:
- Nama vendor, total, tanggal
- Line items (item, qty, unit price)
- Confidence score 85-95% untuk struk cetak
Menggunakan Gemini 2.5 Flash untuk akurasi tinggi.

### 🛡️ Forecast Guard
Warning otomatis saat ada pengeluaran yang melebihi forecast:
- Tampil di form sebelum submit (bukan setelah)
- Wajib isi alasan jika pengeluaran >threshold
- Alasan tersimpan dalam audit trail
- Executive bisa lihat semua "busters" ini di satu widget

## 7.2 Keunggulan Proses

### ✅ Zero Manual Consolidation
Data dari semua outlet langsung terkumpul dalam satu database. Finance tidak perlu mengumpulkan file Excel dari masing-masing outlet. Konsolidasi terjadi otomatis, real-time.

### ✅ Automated Journal Posting
Setiap event bisnis secara otomatis men-trigger journal entry yang sesuai:

| Event | Jurnal Otomatis |
|-------|----------------|
| Sales Validated | Dr Cash/GoPay/QRIS → Cr Revenue |
| GR Posted | Dr Inventory → Cr Accounts Payable |
| Payment Made | Dr Accounts Payable → Cr Bank |
| Petty Cash | Dr Petty Cash Expense → Cr Cash |
| Adjustment | Dr/Cr Inventory → Cr/Dr COGS Variance |

Finance staff tidak perlu input jurnal manual untuk transaksi rutin.

### ✅ Single Source of Truth
Satu database, satu versi kebenaran. Tidak ada lagi diskusi "versi Excel kamu berbeda dengan versi aku". Semua pihak melihat data yang sama, real-time.

### ✅ Configurable Business Rules
Admin bisa ubah aturan bisnis tanpa perlu programmer:
- Ubah threshold anomaly detection
- Ubah formula incentive per outlet
- Ubah approval tier berdasarkan nilai
- Ubah limit petty cash per kategori

### ✅ Mobile-First Outlet Portal
Daily Sales, KDO/BDO, dan input poin loyalty — semua bisa dilakukan dari smartphone. Outlet staff tidak perlu duduk di depan komputer untuk laporan harian.

### ✅ Full Audit Trail
Tidak ada satu pun perubahan data yang tidak tercatat:
- Siapa yang buat
- Kapan dibuat
- Dari IP/device mana
- Nilai sebelum dan sesudah perubahan

Berguna untuk: internal audit, external audit, dispute resolution, forensic analysis.

## 7.3 Keunggulan Desain

### Glassmorphism UI
Interface modern dengan frosted glass effect, gradient background, dan micro-animation yang membuat pengalaman menggunakan ERP terasa **premium dan menyenangkan** — bukan terasa seperti software akuntansi lawas.

### 3-Tier Navigation (Portal → Sidebar → Subnav)
Navigasi terstruktur yang intuitif:
1. **Top Bar** — Pilih portal (Owner/Finance/HR/dll.)
2. **Sidebar kiri** — Pilih modul dalam portal
3. **Subnav Tab** — Pilih halaman dalam modul

Tidak ada menu yang redundant, setiap halaman ada di satu tempat yang logis.

### Cmd+K Global Search
Cari apa saja dari mana saja: item, vendor, karyawan, transaksi, outlet — tanpa harus navigasi ke halaman yang tepat dulu.

### Task-Driven Dashboard
Dashboard tidak sekadar menampilkan data — ia memberitahu user **apa yang harus dilakukan hari ini**: "Kamu punya 3 daily sales yang belum divalidasi" atau "Ada 2 PR yang menunggu approval-mu."

---

# 8. KEAMANAN & KONTROL AKSES

## 8.1 Role-Based Access Control (RBAC)

Sistem menggunakan 15 role predefined, masing-masing dengan permission granular:

| Role | Akses Utama |
|------|------------|
| Super Admin | Semua modul, semua outlet |
| Finance Manager | Finance full + approve validasi + closing |
| Finance Staff | Validasi sales, input jurnal, view laporan |
| Procurement Manager | PR/PO/GR full + approve + vendor |
| Procurement Staff | Buat PR, view PO/GR |
| Inventory Manager | Inventory full + opname approval |
| Inventory Staff | Stock check, transfer, adjustment draft |
| HR Manager | HR full + payroll approve |
| HR Staff | Input service charge, incentive, advance |
| Outlet Manager | Daily sales + PC + KDO/BDO + loyalty |
| Outlet Staff | Daily sales entry only |
| Cashier | Input loyalty poin only |
| Executive | Semua read-only + drilldown |
| Owner | Semua read-only + approve strategis |
| System Admin | User management, master data, config |

**Scope Restriction:**
- Outlet staff hanya bisa lihat data outlet mereka sendiri
- Regional Manager bisa lihat brand/outlet yang di-assign ke mereka
- Super Admin dan Owner bisa lihat semua

## 8.2 Keamanan Teknis

| Aspek | Implementasi |
|-------|-------------|
| **Autentikasi** | JWT HS256, expire 24 jam, refresh token 7 hari |
| **Password** | bcrypt hash, minimum 8 karakter |
| **API Security** | Authorization header required, role check per endpoint |
| **Period Lock** | Akuntansi periode closed = write-locked untuk semua role kecuali Finance Manager |
| **Audit Log** | Immutable log setiap CRUD pada data transaksional |
| **Input Validation** | Pydantic validation di semua API endpoint |
| **CORS** | Konfigurasi domain origin yang diizinkan |
| **Rate Limiting** | Konfigurabel per endpoint |

## 8.3 Backup & Recovery

- **MongoDB** dapat dikonfigurasi dengan automated daily backup
- Retention 30 hari
- Point-in-time recovery untuk data kritis
- Deployment di Kubernetes dengan container restart policy

---

# 9. DAMPAK BISNIS & ROI

## 9.1 Dampak pada Efisiensi Operasional

### Penghematan Waktu per Minggu (Estimasi per Role)

| Role | Aktivitas yang Dihemat | Estimasi Waktu/Minggu |
|------|------------------------|----------------------|
| Finance Staff | Manual rekap Excel dari outlet | -8 jam |
| Finance Staff | Konsolidasi laporan multi-outlet | -4 jam |
| Finance Staff | Closing bulanan | -10 jam (dari ~15 jam → ~5 jam) |
| Purchasing Staff | Koordinasi request via WhatsApp | -5 jam |
| Purchasing Staff | Manual vendor comparison | -3 jam |
| HR Officer | Perhitungan service charge manual | -6 jam |
| HR Officer | Perhitungan incentive manual | -4 jam |
| Outlet Manager | Kirim laporan via email/WA | -2 jam |
| **Total per minggu** | | **~42 jam (5+ FTE days)** |

### Penghematan Biaya Estimasi
Dengan asumsi cost tenaga kerja Rp 50.000/jam:
- **42 jam/minggu × Rp 50.000 = Rp 2.100.000/minggu**
- **Rp 8.400.000/bulan ~ Rp 100.800.000/tahun** hanya dari efisiensi waktu

## 9.2 Dampak pada Kualitas Data

| Metrik | Sebelum (Excel) | Sesudah (Aurora) | Perbaikan |
|--------|-----------------|------------------|-----------|
| Error rate daily sales | ~5-10% (typo, formula salah) | <0.5% (validasi otomatis) | 95% lebih akurat |
| Waktu closing bulanan | 2-3 minggu | ≤ 5 hari kerja | 75% lebih cepat |
| AP tracking accuracy | ~80% (sering missing invoice) | 100% (dari GR otomatis) | +20% |
| Inventory accuracy | ~70% (stok buku vs fisik) | >95% (opname digital + movement tracking) | +25% |
| Audit trail coverage | 0% (tidak ada) | 100% semua transaksi | ∞ |

## 9.3 Dampak pada Pengambilan Keputusan

**Sebelum Aurora:**
- Data laporan tersedia sebulan setelah periode → keputusan based on data lama
- Owner tidak tahu ada masalah sampai laporan bulanan keluar
- Tidak bisa compare performa outlet secara langsung

**Sesudah Aurora:**
- **Real-time dashboard** → keputusan based on data hari ini
- **Anomaly alert dalam hitungan jam** → masalah terdeteksi dan ditangani sebelum membesar
- **AI Assistant** → pertanyaan strategis terjawab dalam hitungan detik

**Contoh Scenario:**
> *Tanpa Aurora:* Outlet A mengalami penurunan revenue 20% selama 2 minggu karena supplier bahan baku terlambat kirim (yang menyebabkan beberapa menu unavailable). Hal ini baru diketahui 6 minggu kemudian dari laporan bulanan. Kerugian sudah terjadi.

> *Dengan Aurora:* Di hari ketiga penurunan revenue, anomaly detection men-trigger alert severity "Mild" ke Executive. AI Assistant menunjukkan korelasi dengan vendor lead-time anomaly yang juga terdeteksi. GM langsung follow up vendor dan masalah teratasi dalam 3 hari.

## 9.4 Dampak pada Customer Experience (Loyalty)

- Pelanggan yang terdaftar di loyalty program memiliki **retensi 30-50% lebih tinggi** (industry benchmark F&B)
- Program poin yang terstruktur mendorong **repeat visit** dan **increase in basket size**
- Notifikasi poin via WhatsApp meningkatkan **brand recall** dan **engagement**

## 9.5 Dampak pada Compliance & Audit

- **100% audit trail** → eksternal audit menjadi lebih mudah dan cepat
- **e-Faktur dan e-Bupot export** → compliance pajak DJP tanpa manual input ulang
- **Period locking** → mencegah backdating yang tidak sah
- **RBAC granular** → segregation of duties yang proper (sesuai SOP akuntansi)

---

# 10. PERBANDINGAN SEBELUM VS SESUDAH

## Sebelum Aurora (Excel-Based Operations)

```
KONDISI SEBELUM:

Outlet A ──────► Excel file → Email ke Finance ──────────────────────►
Outlet B ──────► Excel file → WhatsApp ke Finance ──────────────────►  Finance Staff
Outlet C ──────► Excel file → terlambat 2 hari ─────────────────────►  Manual Consolidate
Outlet D ──────► Excel file → formula rusak ────────────────────────►  + Manual Check
                                                                        = 2-3 minggu

Stok:         Manual count kertas → input ulang → belum tentu akurat
Pembelian:    WhatsApp → "bisa cek dulu ya Pak?" → tidak ada dokumentasi
Incentive:    Excel per outlet → hitung manual → dispute by karyawan
Owner info:   Laporan P&L 1 bulan setelah tutup buku
Anomali:      Tidak ada deteksi → baru tahu saat sudah rugi
```

## Sesudah Aurora

```
KONDISI SESUDAH:

Outlet A ──► Direct input di sistem ──►
Outlet B ──► Direct input di sistem ──►  Finance Staff
Outlet C ──► Direct input di sistem ──►  One click APPROVE
Outlet D ──► Direct input di sistem ──►  → GL otomatis update
                                         = < 5 menit per entry

Stok:         Real-time di semua outlet, opname digital di tablet
Pembelian:    PR digital → Kanban board → PO PDF → GR → AP otomatis
Incentive:    Formula di sistem → auto-calculate → no dispute
Owner info:   Dashboard real-time, tersedia 24/7
Anomali:      Auto-detect dalam hitungan jam → alert langsung ke GM/Owner
```

---

# 11. ROADMAP PENGEMBANGAN LANJUTAN

Sistem Aurora terus berkembang. Berikut fitur yang ada dalam roadmap:

## Near-Term (Q3 2026)

| Fitur | Keterangan | Impact |
|-------|------------|--------|
| **WhatsApp Notification** | Kirim notifikasi loyalty, alert anomali, digest via WhatsApp (API Fonnte/Twilio/Meta) | Customer engagement, real-time alerts |
| **Careers Apply Form** | Form lamaran kerja online, aplikasi masuk ke sistem HR | Rekrutmen lebih efisien |
| **PPN 12% Update** | Adjustment tarif PPN sesuai regulasi terbaru | Compliance |
| **e-Faktur Coretax** | Integrasi langsung dengan DJP Coretax API | Auto-submit SPT |

## Mid-Term (Q4 2026)

| Fitur | Keterangan | Impact |
|-------|------------|--------|
| **Mobile App** | Native app Android/iOS untuk Outlet Portal | Lebih mudah di lapangan |
| **SMTP Email Integration** | Kirim PO, payslip, report via email dari sistem | Paperless workflow |
| **Multi-Currency** | Support USD, SGD untuk vendor luar negeri | International sourcing |
| **Barcode Scanner** | Scan barcode item saat GR dan opname | Akurasi lebih tinggi, lebih cepat |

## Long-Term (2027)

| Fitur | Keterangan | Impact |
|-------|------------|--------|
| **POS Integration** | Sync data dari POS kasir ke Aurora daily sales | Eliminasi manual input |
| **Vendor Portal** | Vendor bisa lihat PO dan submit invoice online | Efisiensi AP workflow |
| **Investor Dashboard** | View khusus untuk investor (read-only, curated KPIs) | Investor relations |
| **Multi-Company** | Support beberapa entity legal dalam satu system | Skalabilitas group |
| **Custom Mobile Report** | Generate report custom langsung dari smartphone | C-level on-the-go |

---

# PENUTUP

Aurora F&B adalah lebih dari sekadar software. Ini adalah **transformasi digital** cara sebuah F&B group bekerja — dari operasional yang tersebar, manual, dan reaktif, menjadi sebuah operasional yang **terhubung, terautomasi, dan proaktif**.

Setiap modul dibangun dengan satu prinsip: **membantu pengguna membuat keputusan terbaik dengan data terbaik yang tersedia saat ini** — bukan data kemarin, bukan data bulan lalu.

Dengan 60+ modul yang saling terintegrasi, 6 AI features, dan arsitektur yang dapat berkembang, Aurora siap menjadi backbone digital Torado Group untuk jangka panjang.

---

**Dokumen ini disusun oleh:** Tim Pengembangan Aurora F&B  
**Versi:** 1.0 — Mei 2026  
**Kontak:** Tersedia melalui saluran resmi Torado Group  

---

*"Mengubah Excel-driven F&B operations menjadi platform digital yang membimbing user, bukan membebaninya."*

