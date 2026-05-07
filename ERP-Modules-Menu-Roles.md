# ERP PT Kecil - Modul, Menu, dan Role User

Dokumen ini menurunkan workflow `PR -> Approval -> PO -> Receive -> COA Posting` menjadi struktur ERP yang siap dipakai untuk desain layar, pengembangan aplikasi, dan penyusunan hak akses.

## 0. Prinsip Multi-Company

ERP kecil ini harus mendukung `multi-company` untuk seluruh modul dan menu, dengan aturan dasar:

- User login membawa `company scope` yang menentukan data perusahaan mana yang boleh diakses
- Semua modul utama seperti `PR`, `PO`, `Approval`, `Receive`, `Asset`, `Accounting`, dan `Reports` wajib memfilter data berdasarkan company aktif
- User dapat memiliki akses ke `satu` atau `lebih dari satu` company, tergantung role dan otorisasi
- Jika user memiliki lebih dari satu company, sistem menyediakan `company selector` setelah login
- Approval, numbering, master data, COA, cost center, asset register, dan laporan harus dapat dipisahkan per company
- Hak akses tidak hanya berbasis role, tetapi juga berbasis `company assignment`

Implikasi desain:

- Header aplikasi perlu menampilkan `company aktif`
- Semua list dan form perlu menyimpan `company_id`
- Semua workflow approval dan jurnal perlu membaca company context dari dokumen transaksi
- Menu yang sama dapat dipakai lintas company, tetapi isi data dan otorisasinya mengikuti company aktif user

## 1. Modul ERP

### 1. Procurement Planning

Fungsi:
- Mengajukan kebutuhan pembelian barang atau jasa
- Memilih COA, cost center, dan kategori `asset` atau `non-asset`
- Menjadi titik awal approval dan pembentukan PO

Sub-proses:
- Purchase Request
- Approval PR
- Konversi PR approved ke proses procurement

### 2. Purchasing

Fungsi:
- Menangani sourcing, vendor selection, dan pembuatan PO
- Menjalankan approval tambahan untuk PO bila melebihi limit
- Mengirim PO ke vendor

Sub-proses:
- RFQ / perbandingan vendor
- Evaluasi vendor
- Purchase Order
- Approval PO

### 3. Receiving

Fungsi:
- Mencatat penerimaan barang atau jasa berdasarkan PO
- Memisahkan receive `asset` dan `non-asset`
- Menjadi dasar pencatatan akuntansi

Sub-proses:
- Goods / Service Receive
- Receive document
- Klasifikasi asset vs non-asset

### 4. Asset Management

Fungsi:
- Membuat nomor asset
- Membentuk kartu asset
- Menghubungkan receive asset ke register asset

Sub-proses:
- Asset registration
- Asset card
- Asset capitalization reference

### 5. Inventory / Expense Recording

Fungsi:
- Menentukan apakah receive masuk ke persediaan atau langsung beban
- Menjadi sumber jurnal non-asset

Sub-proses:
- Inventory receipt
- Expense recognition reference

### 6. Accounting & COA Posting

Fungsi:
- Mencatat jurnal otomatis berbasis COA
- Menjembatani transaksi receive ke GR/IR atau AP
- Menyiapkan ledger untuk proses invoice AP

Sub-proses:
- Journal posting asset
- Journal posting inventory / expense
- Ledger update
- AP readiness

### 7. Master Data & Control

Fungsi:
- Menyediakan data master yang dipakai lintas modul
- Menjaga kontrol limit approval dan struktur akuntansi

Sub-proses:
- Master vendor
- Master item / jasa
- Master COA
- Master cost center
- Approval matrix
- Budget / spending control

### 8. Reporting & Audit

Fungsi:
- Menyediakan monitoring proses end-to-end
- Menyediakan jejak audit transaksi

Sub-proses:
- Monitoring status PR / PO / Receive
- Laporan outstanding approval
- Laporan asset acquisition
- Laporan GR/IR
- Audit trail

## 2. Struktur Menu ERP

### Dashboard

Menu:
- Dashboard Overview
- My Tasks
- Pending Approvals
- Outstanding PR / PO / Receive
- Alerts & Exceptions
- Company Switcher / Active Company

### Procurement Planning

Menu:
- Purchase Request
- Create PR
- Draft PR
- Submitted PR
- Approved / Rejected PR

### Purchasing

Menu:
- Vendor Comparison / RFQ
- Purchase Order
- Create PO
- Approved PO
- Sent PO
- Closed PO

### Receiving

Menu:
- Receive from PO
- Goods Receive
- Service Receive
- Receive Register
- Pending Receive Validation

### Asset Management

Menu:
- Asset Registration
- Asset Card
- Asset Acquisition List
- Asset in Progress

### Inventory / Expense

Menu:
- Inventory Receipt Register
- Expense Allocation Register
- Non-Asset Receive List

### Accounting

Menu:
- Journal Posting
- Auto Journal Review
- GR/IR Register
- AP Ready Transactions
- Ledger Update Log

### Master Data

Menu:
- Vendor Master
- Item / Service Master
- COA Master
- Cost Center Master
- Asset Category Master
- Approval Matrix
- Spending Limit Rules
- Company Master / Company Access Mapping

### Reports

Menu:
- PR Status Report
- PO Status Report
- Receive Status Report
- Asset Acquisition Report
- Inventory / Expense Report
- GR/IR Report
- Audit Trail Report

### Administration

Menu:
- User Management
- Role Management
- User Company Assignment
- Workflow Settings
- Company Settings

## 3. Role User

### 1. Requestor / User

Tanggung jawab:
- Membuat PR
- Memilih item, qty, estimasi harga
- Memilih COA, cost center, dan kategori asset / non-asset
- Melihat status PR, PO, dan receive miliknya
- Bekerja dalam company scope sesuai assignment login

Akses utama:
- Dashboard
- Purchase Request
- My Requests
- Tracking status transaksi

### 2. Approver

Tanggung jawab:
- Mereview PR dari bawahan / unit terkait
- Menyetujui atau menolak PR
- Mereview transaksi yang melewati limit
- Melakukan approval hanya untuk company yang menjadi otoritasnya

Akses utama:
- Pending Approvals
- Approval History
- PR detail dan dokumen pendukung

Catatan:
- Role ini bisa dibagi lagi menjadi `Dept Head`, `Finance Manager`, atau `Director`

### 3. Procurement

Tanggung jawab:
- Menerima PR yang sudah approved
- Melakukan RFQ / perbandingan vendor
- Memilih vendor
- Membuat dan mengirim PO
- Memproses approval tambahan PO jika diperlukan
- Menjalankan proses procurement sesuai company aktif

Akses utama:
- Approved PR Queue
- Vendor Comparison
- Purchase Order
- Vendor master

### 4. Warehouse / User Receive

Tanggung jawab:
- Mencatat receive barang atau jasa
- Memastikan receive sesuai PO
- Menentukan receive asset atau non-asset
- Membuat dokumen receive
- Menjaga receive tercatat pada company yang benar

Akses utama:
- Receive from PO
- Receive Register
- Pending receive list

Catatan:
- Untuk jasa, penerima bisa berasal dari user peminta, bukan warehouse fisik

### 5. Accounting

Tanggung jawab:
- Menjalankan atau memverifikasi auto journal
- Memastikan posting sesuai COA
- Mengelola GR/IR atau AP readiness
- Mengupdate ledger
- Menjaga posting jurnal dan ledger tetap terpisah per company

Akses utama:
- Journal Posting
- GR/IR Register
- AP Ready Transactions
- Ledger update log

### 6. Asset Admin

Tanggung jawab:
- Membuat nomor asset
- Membentuk kartu asset
- Memastikan receive asset masuk ke register asset
- Menjaga register asset tetap terpisah per company

Akses utama:
- Asset Registration
- Asset Card
- Asset acquisition list

### 7. Finance Controller / Admin ERP

Tanggung jawab:
- Mengelola approval matrix
- Mengelola COA, cost center, dan limit transaksi
- Menjaga parameter workflow dan kontrol sistem
- Mengelola company master dan assignment user ke company

Akses utama:
- Master Data
- Approval Matrix
- Workflow Settings
- User / Role Management

## 4. Matriks Role ke Modul

| Modul | Requestor | Approver | Procurement | Warehouse / Receive | Accounting | Asset Admin | ERP Admin |
|---|---|---|---|---|---|---|---|
| Dashboard | View | View | View | View | View | View | Full |
| Purchase Request | Create/View own | View/Approve | View approved | View related | View related | View related | Full |
| Purchase Order | View own | View approval impact | Create/Edit/Send | View | View | View | Full |
| Receiving | View own | View | View | Create/Edit | View | View | Full |
| Asset Management | View own | View | View | Input trigger | View | Create/Edit | Full |
| Inventory / Expense | View own | View | View | Input trigger | Review/Post | View | Full |
| Accounting Posting | No | No | No | No | Create/Review/Post | No | Full |
| Master Data | No | No | Limited vendor view | No | Limited COA view | Limited category view | Full |
| Reports | Own data | Approval reports | Procurement reports | Receive reports | Finance reports | Asset reports | Full |

## 5. Aturan Data Scope per Company

Setiap transaksi dan master minimal perlu membawa atribut berikut:

- `company_id`
- `business_unit` atau `branch` bila diperlukan
- `created_by`
- `approval_scope`

Objek yang wajib company-aware:

- Purchase Request
- Purchase Order
- Approval Inbox
- Receive Document
- Asset Register
- Journal Posting
- GR/IR Register
- Vendor Master
- COA
- Cost Center
- Approval Matrix

Aturan akses minimum:

- User biasa hanya melihat data company yang di-assign ke akunnya
- Approver hanya melihat transaksi approval untuk company yang menjadi scope-nya
- Accounting melihat jurnal dan ledger per company aktif
- ERP Admin dapat diberi akses lintas company
- Numbering dokumen dapat dibuat per company, misalnya `PR-HO-2026-0001` dan `PR-MFG-2026-0001`

## 6. Saran Tahap Implementasi

### Tahap 1 - Core MVP

Bangun lebih dulu:
- Purchase Request
- Approval PR
- Purchase Order
- Receive
- Auto journal
- Dashboard pending task
- Company scope dari login

### Tahap 2 - Operational Control

Tambahkan:
- Vendor master
- Item / service master
- Approval matrix
- Cost center dan COA master
- GR/IR register
- Company access mapping

### Tahap 3 - Governance

Tambahkan:
- Asset register
- Audit trail
- Role-based access control penuh
- Reporting dan export
- Cross-company governance dan konsolidasi laporan

## 7. Output untuk Desain Screen Berikutnya

Urutan screen yang paling cocok dibuat sesudah workflow:

1. Dashboard
2. PR List dan PR Form
3. Approval Inbox
4. PO List dan PO Form
5. Receive Form
6. Asset / Non-Asset Decision Screen
7. Journal Review Screen
8. Master Data Screen
