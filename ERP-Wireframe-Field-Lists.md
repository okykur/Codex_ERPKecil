# ERP PT Kecil - Wireframe Field List

Dokumen ini merinci field utama yang perlu muncul pada wireframe ERP kecil untuk modul:

- Permintaan Barang
- Pesanan Pembelian
- Persetujuan
- Penerimaan Barang
- Jurnal Umum
- Company Management
- Master Reference
- User Management
- Roles Management

Semua screen diasumsikan `multi-company`, sehingga field company context selalu tersedia atau terbawa dari `Data Usaha` aktif.

## 1. Permintaan Barang

### Header

- Data Usaha
- Nomor Permintaan
- Tanggal Permintaan
- Departemen
- Peminta
- Prioritas
- Tipe Permintaan: Barang / Jasa
- Status Dokumen

### Cari / Pilih Barang

- Kode Barang / Jasa
- Nama Barang / Jasa
- Deskripsi
- Kuantitas
- Satuan
- Estimasi Harga
- Tanggal Dibutuhkan
- Gudang Tujuan / Lokasi Pakai
- Kategori: Asset / Non-Asset
- Catatan Item

### Info Permintaan

- Lokasi Pakai / Unit Tujuan
- Tanggal Dibutuhkan
- Prioritas Permintaan
- Catatan Permintaan

### Approval & Action

- Daftar Approval Manual
- Nama Approver
- Jabatan Approver
- Email Approver
- Multi Approval Entry
- Attachment Pendukung
- Tombol Simpan Draft
- Tombol Ajukan Permintaan
- Tombol Batalkan / Revisi

## 2. Pesanan Pembelian

### Header Pesanan

- Data Usaha
- Nomor Pesanan Pembelian
- Tanggal Pesanan
- Pemasok
- Mata Uang
- Kurs
- Referensi Permintaan Barang
- Syarat Pembayaran
- Tanggal Pengiriman
- Status Pesanan

### Cari / Pilih Barang

- Kode Barang / Jasa
- Nama Barang / Jasa
- Deskripsi
- Kuantitas Pesan
- Satuan
- Harga Satuan
- Diskon
- Pajak
- Subtotal
- Gudang Tujuan
- Tanggal Kirim

### Info Lainnya

- Alamat Pengiriman
- PIC Vendor
- Catatan Pembelian
- RFQ ke Vendor
- Nama Vendor RFQ
- File Quotation Vendor
- Tanggal Quotation Vendor
- Preview / View PDF Quotation
- Lampiran Penawaran
- Lampiran RFQ / Perbandingan Vendor
- Approval Tambahan PO

### Action

- Simpan Draft
- Simpan & Kirim
- Minta Persetujuan Tambahan
- Print / Export PO

## 3. Persetujuan

### Filter Daftar Persetujuan

- Data Usaha
- Jenis Dokumen: PR / PO
- Nomor Dokumen
- Rentang Nilai
- Departemen
- Peminta
- Status Persetujuan
- SLA / Urgensi

### Daftar Persetujuan

- Nomor Dokumen
- Jenis Dokumen
- Tanggal
- Peminta
- Departemen
- Nilai Transaksi
- Approval Saat Ini
- Status

### Detail Dokumen

- Ringkasan Header
- Informasi Approval Manual
- Daftar Item
- Catatan Peminta
- Lampiran Dokumen
- Histori Persetujuan

### Action Persetujuan

- Setujui
- Tolak
- Minta Revisi
- Tambah Komentar
- Forward / Escalate

## 4. Penerimaan Barang

### List Receive

- Nomor Pesanan Pembelian
- Tanggal Pesanan
- Pemasok
- Gudang / User Receive
- Nilai Transaksi
- Status Receive: Siap Receive / Parsial / Completed / Need Review
- Action: Create Receive / Lanjutkan / View / Review

### Header Penerimaan

- Data Usaha
- Nomor Penerimaan
- Tanggal Penerimaan
- Nomor Pesanan Pembelian
- Pemasok
- Gudang / User Receive
- Jenis Penerimaan: Barang / Jasa
- Status Dokumen

### Barang dari Pesanan

- Kode Barang / Jasa
- Nama Barang / Jasa
- Qty Pesan
- Qty Diterima
- Qty Sisa
- Satuan
- Asset / Non-Asset
- Kondisi Barang
- Nomor Seri / Batch
- Catatan Penerimaan

### Asset / Non-Asset Decision

- Tipe Receive: Asset / Non-Asset
- Kategori Asset
- Nomor Asset
- Register ke Kartu Asset
- Flag Persediaan
- Flag Beban
- Preview hasil posting

### Dokumen & Posting Preview

- Dokumen Penerimaan
- BAST / Berita Acara
- Lampiran Foto / Bukti
- Preview Jurnal
- Status Sinkron ke Asset Register
- Status Siap Invoice AP

### Action Receive

- Tombol Simpan Draft
- Tombol Posting Receive
- Tombol Simpan Koreksi
- Tombol Posting Ulang

## 5. Jurnal Umum

### Header / Filter

- Data Usaha
- Periode
- Nomor Jurnal
- Referensi Penerimaan
- Tipe Transaksi
- Status Posting
- GR/IR atau AP

### Daftar Jurnal

- Nomor Jurnal
- Tanggal
- Referensi
- Akun Debit
- Akun Kredit
- Nilai
- Status

### Detail Jurnal

- Tanggal Jurnal
- Memo
- Baris Akun
- COA Debit
- COA Kredit
- Cost Center
- Department / Unit
- Nilai per Baris
- Catatan Accounting

### Posting & Audit

- Tombol Simpan Draft
- Tombol Posting
- Tombol Batalkan Posting
- Posting Log
- User Posting
- Tanggal Posting
- Status Ledger Update
- Status AP Ready

## 6. User Management

### List User

- User ID
- Nama User
- Email
- Scope PT: Single PT / Multi PT
- Nama PT
- Role: User Maker / Procurement / Administrator
- Status User
- Action: Create / Edit / View / Review

### Header User

- Data Usaha
- User ID
- Tanggal Buat
- Nama Lengkap
- Email Kantor
- Departemen
- Jabatan
- Status User

### Akses Login & Profil

- Email Login / Username
- Password Awal / Reset Password
- Konfirmasi Pengiriman Login
- Tipe User: Internal / External
- Status MFA
- Bahasa Default
- No. HP
- Catatan Admin

### Penugasan PT

- Mode Akses PT: Single PT / Multi PT
- PT Utama
- PT Tambahan
- Default Login PT
- Daftar PT yang Diizinkan
- Scope per PT
- Status Assignment PT

### Role & Module Scope

- Role Utama
- Role Tambahan
- Flag Administrator
- Daftar Role Aktif
- Scope PT per Role
- Status Role

### Action User

- Simpan Draft
- Aktifkan User
- Simpan Perubahan
- Nonaktifkan User

## 7. Company Management

### List Company

- Kode Company
- Nama Company
- Tipe Company
- Default Login
- Status Company
- Action: Tambah / View / Edit / Active-Inactive

### Header Company

- Nama Company
- Kode Company
- Tipe Company
- Status Company
- Default Login Scope
- Catatan Penggunaan

### Penggunaan Lintas Modul

- Dipakai di Login
- Dipakai di Purchase Request
- Dipakai di Purchase Order
- Dipakai di Approval
- Dipakai di Receive
- Historical / Nonaktif

### Access Policy

- Hanya Administrator yang dapat tambah company
- Hanya Administrator yang dapat edit company
- Hanya Administrator yang dapat delete company
- Export company master

## 8. Master Reference

### List Kategori Master

- Nama Kategori
- Deskripsi Kategori
- Status Kategori
- Action: Tambah Nilai / Edit / Active-Inactive

### Nilai per Kategori

- Kode Nilai
- Nama Nilai
- Status Nilai
- Action: View / Edit / Active-Inactive

### Kategori Awal

- Jenis Permintaan
- Prioritas Permintaan

### Access Policy

- Hanya Administrator yang dapat tambah kategori
- Hanya Administrator yang dapat tambah nilai
- Hanya Administrator yang dapat edit nilai
- Hanya Administrator yang dapat aktif/nonaktifkan nilai

## 9. Roles Management

### Header Role

- Role ID
- Nama Role
- Tipe Role
- Status Role
- Deskripsi Role

### Module Access Matrix

- Nama Modul
- Level Akses: View / Create / Update / Delete / Approve
- Menu Scope
- PT Scope
- Status Rule
- Catatan Role

### Daftar Modul per Role

- Modul Baru
- Level Akses
- Menu Scope
- Status Modul
- Action Tambah / Edit / Hapus

### Menu & Action Scope

- Role
- Menu Detail
- Action Detail
- PT Scope
- Status Rule
- Pembatasan Tambahan

### Action Role

- Simpan Draft
- Simpan Role
- Nonaktifkan Role
