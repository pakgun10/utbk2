# Update VPS (non-Docker + PM2 + Nginx)

Panduan update aplikasi di VPS tanpa Docker, menggunakan PM2 dan Nginx.

---

## Prasyarat

- VPS dengan Bun terpasang
- Database MySQL/MariaDB berjalan
- PM2 menjalankan aplikasi dengan nama `utbk`
- Nginx sebagai reverse proxy dengan SSL (Certbot)
- Environment variable `NODE_ENV=production` sudah diset di PM2

---

## Langkah Update

```bash
# 1. Pull kode terbaru
cd ~/utbk
git pull origin main

# 2. Install dependency (root + backend + frontend)
bun install --frozen-lockfile
bun run install:all:frozen

# 3. Build frontend
bun run build:frontend

# 4. Validasi seed (opsional — cek dulu sebelum eksekusi)
bun run seed:check

# 5. Jalankan seed (jika ada soal baru)
bun run seed

# 6. Restart PM2 dengan environment production
NODE_ENV=production pm2 restart utbk --update-env

# 7. Simpan process list PM2
pm2 save
```

> **Catatan migration:** Tidak perlu menjalankan `db:migrate` secara terpisah.
> File `backend/src/index.ts` otomatis menjalankan migration saat server start (langkah 6).

---

## Verifikasi

```bash
# Cek server jalan
curl http://localhost:3007/health

# Cek PM2
pm2 logs utbk --lines 10

# Cek domain publik
curl -I https://cbt.gezytech.web.id/
curl https://cbt.gezytech.web.id/health
```

Response yang benar:

```
{"status":"ok"}
```

---

## Troubleshooting

### 404 di browser

Pastikan `NODE_ENV=production`:

```bash
pm2 env utbk | grep NODE_ENV
```

Jika kosong:

```bash
cd ~/utbk/backend
NODE_ENV=production pm2 restart utbk --update-env
pm2 save
```

### EADDRINUSE (port sudah dipakai)

```bash
lsof -i :3007
kill -9 <PID>
pm2 restart utbk
```

### Process PM2 hilang

```bash
cd ~/utbk/backend
NODE_ENV=production pm2 start "bun src/index.ts" --name utbk
pm2 save
```

### Migration gagal

Jalankan migration manual:

```bash
cd ~/utbk/backend
NODE_ENV=production bun src/db/migrate.ts
pm2 restart utbk
```