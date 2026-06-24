# Panduan Deploy Docker (No Build Image)

> Prasyarat: Docker dan Docker Compose sudah terinstall di VPS.
> Database MySQL/MariaDB sudah berjalan di VPS (tidak perlu container terpisah).

---

## 1. Clone Project

```bash
git clone <url-repo> utbk2
cd utbk2
```

---

## 2. Build Frontend

Jalankan di VPS atau di komputer yang ada Bun:

```bash
cd frontend
bun install
bun run build
cd ..
```

Hasilnya: folder `frontend/dist/` berisi file HTML, JS, CSS siap serving.

---

## 3. Install Backend Dependencies

```bash
cd backend
bun install
cd ..
```

---

## 4. Setup Environment

```bash
cp .env.production.example .env
nano .env
```

Isi file `.env`:

```
DB_HOST=172.17.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password-mysql-anda
DB_NAME=utbk_belajar
APP_PASSWORD=password-untuk-akses-aplikasi
```

**Catatan DB_HOST:**
- `172.17.0.1` — IP Docker bridge gateway (akses MySQL dari container, Linux default)
- Kalau tidak bisa, coba `host.docker.internal` (Mac/Windows)
- Alternatif: jalankan container dengan `network_mode: host` dan set `DB_HOST=127.0.0.1`

---

## 5. Pastikan MySQL Bisa Diakses dari Container

MySQL di host harus terima koneksi TCP, bukan cuma Unix socket.
Cek di VPS:

```bash
# Cek apakah MySQL dengar di port 3306
ss -tlnp | grep 3306

# Kalau cuma dengar di 127.0.0.1:3306, itu aman — container tetap bisa
# lewat IP gateway 172.17.0.1
```

Pastikan user MySQL (root) bisa login via TCP:

```bash
# Test dari VPS langsung
mysql -h 127.0.0.1 -u root -p
```

---

## 6. Buat Database (jika belum ada)

```bash
mysql -h 127.0.0.1 -u root -p -e "CREATE DATABASE IF NOT EXISTS utbk_belajar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

## 7. Jalankan Container

```bash
docker compose up -d
```

Penjelasan:

| Baris | Arti |
|---|---|
| `image: oven/bun:1.3.14` | Pakai image bun langsung, tanpa build |
| `volumes` | Mount folder project ke container — tidak perlu build image |
| `working_dir: /app/backend` | Masuk ke folder backend |
| `command: ["bun", "src/index.ts"] | Jalankan backend |

---

## 8. Jalankan Migrasi & Seed

```bash
# Masuk ke container
docker compose exec app bun src/db/migrate.ts
docker compose exec app bun src/lib/seed.ts
```

---

## 9. Cek Apakah Berjalan

```bash
# Cek status container
docker compose ps

# Cek log
docker compose logs -f

# Test API
curl http://localhost:3000/api/subjects -H "x-auth-token: $(curl -s http://localhost:3000/api/auth -X POST -H 'Content-Type: application/json' -d '{"password":"PASSWORD_APP_ANDA"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')"
```

---

## 10. Update Kode

```bash
git pull

# Kalau ada perubahan di frontend
cd frontend && bun install && bun run build && cd ..

# Restart container
docker compose restart

# Kalau ada perubahan tabel database
docker compose exec app bun src/db/migrate.ts
docker compose exec app bun src/lib/seed.ts
```

---

## Troubleshooting

### Container tidak bisa konek ke MySQL

Error: `connect ECONNREFUSED 172.17.0.1:3306`

Penyebab:
1. MySQL hanya bind ke `127.0.0.1` bukan `0.0.0.0`
2. Firewall blokir port 3306

Cek:
```bash
# Lihat bind address MySQL
sudo grep bind-address /etc/mysql/mariadb.conf.d/50-server.cnf

# Kalau 127.0.0.1, ganti jadi 0.0.0.0
# Lalu restart MySQL
sudo systemctl restart mariadb
```

### MySQL user root tidak bisa login via TCP

```bash
# Masuk ke MySQL
sudo mysql -u root

# Beri akses root dari IP Docker
CREATE USER IF NOT EXISTS 'root'@'172.17.0.%' IDENTIFIED BY 'PASSWORD';
CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY 'PASSWORD';
FLUSH PRIVILEGES;
```

Atau cara lebih simpel: pakai `network_mode: host` di docker-compose.

### Alternative: network_mode host

Edit `docker-compose.yml`:

```yaml
services:
  app:
    image: oven/bun:1.3.14
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./frontend/dist:/app/frontend/dist
      - ./backend:/app/backend
      - ./seed.json:/app/seed.json
    working_dir: /app/backend
    command: ["bun", "src/index.ts"]
    environment:
      DB_HOST: 127.0.0.1
      DB_PORT: "3306"
      DB_USER: root
      DB_PASSWORD: ${DB_PASSWORD:-}
      DB_NAME: utbk_belajar
      APP_PORT: "3000"
      APP_PASSWORD: ${APP_PASSWORD:-}
      NODE_ENV: production
```

Dengan `network_mode: host`, container bisa akses `127.0.0.1:3306` langsung.
Tapi app juga jalan di `localhost:3000` tanpa port mapping.
Untuk publik, pasang reverse proxy (Caddy/Nginx) di host.
