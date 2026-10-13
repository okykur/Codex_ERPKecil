# ERP Kecil React + NestJS + PostgreSQL

Migrasi ini mengubah prototype `localStorage` menjadi arsitektur aplikasi web multi-user.

## Target Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: NestJS + TypeScript
- Database: PostgreSQL
- Database name: `erplittle`
- ORM: TypeORM
- Runtime process di EC2: direkomendasikan `pm2` atau `systemd`
- Reverse proxy: Nginx untuk `appskecil.kcsi-id.com`

## Struktur Folder

```text
apps/
  api/    NestJS backend API
  web/    React TypeScript frontend
database/
  init/   SQL create schema dan seed awal
```

## Environment

Gunakan `.env.example` sebagai dasar:

```env
API_PORT=8001
API_HOST=127.0.0.1
WEB_PORT=3002
DATABASE_URL=postgresql://erp_app:<DB_PASSWORD>@127.0.0.1:5432/erplittle
JWT_SECRET=<LONG_RANDOM_JWT_SECRET>
```

## Local Development

1. Install dependency:

```bash
npm install
```

2. Jalankan PostgreSQL lokal:

```bash
docker compose up -d postgres
```

3. Jalankan backend:

```bash
npm run dev:api
```

4. Jalankan frontend:

```bash
npm run dev:web
```

Frontend berjalan di `http://localhost:3002`, backend di `http://localhost:8001/api`.

## EC2 Deployment Notes

Jika PostgreSQL sudah tersedia di EC2, buat database dan user:

```bash
sudo -u postgres psql -d postgres -v erp_app_password='<DB_PASSWORD>' -f database/init/000_create_database.sql
sudo -u postgres psql -d erplittle -f database/init/001_schema.sql
sudo -u postgres psql -d erplittle -f database/init/002_seed.sql
```

Jalankan backend di port internal `8001`, frontend static build via Nginx atau Vite preview/internal Node.

Contoh Nginx routing:

```nginx
server {
    server_name appskecil.kcsi-id.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Migrasi Berikutnya

- Tambah endpoint create/update/cancel PR
- Tambah endpoint PO, RFQ quotation, approval PO, cancel PO
- Tambah endpoint receive partial berdasarkan quantity, amount, dan deliverable
- Tambah posting journal dan asset register
- Tambah JWT guard dan role-based access control per module
