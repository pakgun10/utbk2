# Troubleshooting

## Frontend jalan, tapi `/api` gagal dari domain publik

Periksa:
1. NPM meneruskan **seluruh domain** ke app, bukan hanya `/`
2. `CORS_ORIGIN` sesuai domain publik
3. App benar-benar menerima request `/api/*`
4. Jika NPM dalam Docker, target upstream bukan `127.0.0.1` melainkan hostname service yang benar

## Container tidak bisa konek ke MySQL

Error:

```
connect ECONNREFUSED 172.17.0.1:3306
```

Kemungkinan:
1. MySQL hanya bind ke `127.0.0.1`
2. Firewall blokir port 3306

Cek:

```bash
sudo grep bind-address /etc/mysql/mariadb.conf.d/50-server.cnf
```

Jika perlu, ubah bind address lalu restart MySQL:

```bash
sudo systemctl restart mariadb
```

## User MySQL tidak bisa login via TCP

```bash
sudo mysql -u root
```

Beri akses dari IP Docker:

```sql
CREATE USER IF NOT EXISTS 'root'@'172.17.0.%' IDENTIFIED BY 'PASSWORD';
CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY 'PASSWORD';
FLUSH PRIVILEGES;
```

## Alternatif: `network_mode: host`

Jika bridge Docker bermasalah, pakai host networking:

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
      FRONTEND_PORT: "5173"
      APP_PASSWORD: ${APP_PASSWORD:-}
      NODE_ENV: production
```

Dengan `network_mode: host`:
- App bisa akses `127.0.0.1:3306` langsung
- App jalan di `localhost:3000` tanpa port mapping
- Pasang reverse proxy (Caddy/Nginx) di host jika ingin dibuka publik

## File `.js`, `.vue.js`, `tsconfig.tsbuildinfo` muncul setelah pull

File generated, bukan untuk di-commit. Hapus:

```bash
git clean -fdX
```

## `bun.lock` berubah setelah install

Ada 3 file `bun.lock` (root, backend, frontend). Gunakan frozen:

```bash
bun install --frozen-lockfile          # root
bun run install:all:frozen             # backend + frontend
```

Jika gagal, ada dependency baru. Jalankan `bun install` biasa di dev, commit semua `bun.lock`, deploy ulang.
