# Codex ERP Kecil

Prototype ERP PT kecil untuk alur `Purchase Request -> Approval -> Purchase Order -> Receive -> Posting COA`.

Fokus solusi ini:
- Purchase Request dengan pemilihan `COA`, `cost center`, dan kategori `asset` / `non-asset`
- Approval bertingkat untuk PR dan approval tambahan untuk PO
- Pembuatan Purchase Order dari PR yang sudah approved
- Proses receive untuk barang, jasa, asset, dan non-asset
- Posting jurnal otomatis berbasis COA

## Workflow

Blueprint bisnis tersedia di FigJam:

- [ERP PR-PO Workflow](https://www.figma.com/board/wwgzqs4pg0dUCHsNBuMZQ3)

## Dokumentasi

Dokumen yang sudah tersedia:

- [Struktur Modul, Menu, dan Role User](./ERP-Modules-Menu-Roles.md)
- [Index dokumentasi](./docs/README.md)

## Menjalankan Aplikasi

```bash
npm start
```

Lalu buka `http://localhost:3000`.

## Struktur Repo

- `index.html`: layout dashboard dan halaman modul utama
- `styles.css`: styling dan responsive behavior
- `app.js`: state management dan logika workflow
- `server.js`: static server ringan tanpa dependency tambahan
- `ERP-Modules-Menu-Roles.md`: turunan workflow menjadi struktur ERP
- `docs/`: dokumentasi pendukung repo

## Catatan MVP

- Data masih disimpan di `localStorage`
- Belum ada database, login, atau backend API
- Approval PR tambahan saat nominal `> Rp 50.000.000`
- Approval PO tambahan saat nominal `> Rp 75.000.000`
- Receive memicu jurnal otomatis ke akun transaksi versus `2105 - GR/IR Clearing`

## Roadmap Singkat

1. Tambahkan autentikasi dan role-based access control
2. Pindahkan state ke database relasional
3. Tambahkan master vendor, item, asset register, dan invoice AP
4. Lengkapi audit trail, reporting, dan export dokumen
