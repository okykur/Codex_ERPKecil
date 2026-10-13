# Codex ERP Kecil

ERP PT kecil untuk alur `Purchase Request -> Approval -> Purchase Order -> Receive -> Posting COA`.

> Status terbaru: repository mulai dimigrasikan dari prototype `localStorage` menjadi monorepo `React TypeScript + NestJS TypeScript + PostgreSQL`.

Fokus solusi ini:
- Purchase Request dengan detail kebutuhan dan kategori `asset` / `non-asset`
- Approval bertingkat untuk PR dan approval tambahan untuk PO
- Pembuatan Purchase Order dari PR yang sudah approved
- RFQ / quotation vendor dikelola pada proses `Purchase Order`
- Proses receive untuk barang, jasa, asset, dan non-asset
- Posting jurnal otomatis berbasis COA
- Dukungan `multi-company` berdasarkan scope company saat login

## Workflow

Blueprint bisnis tersedia di FigJam:

- [ERP PR-PO Workflow](https://www.figma.com/board/wwgzqs4pg0dUCHsNBuMZQ3)

## Dokumentasi

Dokumen yang sudah tersedia:

- [Struktur Modul, Menu, dan Role User](./ERP-Modules-Menu-Roles.md)
- [Wireframe Field List](./ERP-Wireframe-Field-Lists.md)
- [Template Email Approval PR / PO](./docs/approval-email-template.md)
- [Index dokumentasi](./docs/README.md)

## Prinsip Multi-Company

Repo ini dirancang agar semua modul dan menu bisa dipakai untuk lebih dari satu company, dengan aturan:

- company aktif ditentukan dari login atau company selector
- setiap transaksi utama membawa `company_id`
- approval, receive, asset, jurnal, dan report dipisahkan per company
- role user bekerja bersama `company assignment`, bukan role saja

## Menjalankan Aplikasi

### Arsitektur Baru

```bash
npm install
docker compose up -d postgres
npm run dev:api
npm run dev:web
```

Frontend React berjalan di `http://localhost:3002`.
Backend NestJS berjalan di `http://localhost:8001/api`.
Database PostgreSQL menggunakan nama `erplittle`.

Lihat detail migrasi di [React + NestJS + PostgreSQL](./docs/architecture/react-nest-postgres.md).

### Prototype Lama

```bash
npm run legacy:start
```

Lalu buka `http://localhost:3000`.

Untuk akses dari perangkat lain di LAN, jalankan command yang sama di komputer server lalu buka alamat IP LAN yang muncul di terminal, misalnya:

```text
http://10.0.63.181:3000
```

Jika tidak bisa dibuka dari perangkat lain, pastikan perangkat berada di jaringan yang sama dan Windows Firewall mengizinkan koneksi masuk ke port `3000`.

## Struktur Repo

- `index.html`: layout dashboard dan halaman modul utama
- `styles.css`: styling dan responsive behavior
- `app.js`: state management dan logika workflow
- `server.js`: static server ringan tanpa dependency tambahan
- `ERP-Modules-Menu-Roles.md`: turunan workflow menjadi struktur ERP
- `docs/`: dokumentasi pendukung repo

## Catatan MVP

- Prototype lama masih menyimpan data di `localStorage`
- Arsitektur baru memakai PostgreSQL `erplittle`
- Backend API awal sudah menggunakan NestJS + TypeORM
- Frontend baru sudah menggunakan React + TypeScript + Vite
- Endpoint workflow transaksi masih akan dimigrasikan bertahap dari prototype lama
- Approval PR tambahan saat nominal `> Rp 50.000.000`
- Approval PO tambahan saat nominal `> Rp 75.000.000`
- Receive memicu jurnal otomatis ke akun transaksi versus `2105 - GR/IR Clearing`

## Roadmap Singkat

1. Tambahkan autentikasi dan role-based access control
2. Pindahkan state ke database relasional
3. Tambahkan master vendor, item, asset register, dan invoice AP
4. Lengkapi audit trail, reporting, dan export dokumen
