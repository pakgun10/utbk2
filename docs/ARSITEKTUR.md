# UTBK Belajar — Arsitektur & Fitur

> Dokumen ini menggambarkan kondisi aktual aplikasi saat ini.
> Bukan rencana — apa yang sudah jadi.

---

## 1. Ringkasan

Aplikasi web belajar soal UTBK. Alur: pilih topik → mulai → soal acak → timer → jawab → lihat pembahasan → lanjut → resume akhir.

- Single-user, auth opsional (password)
- Tanpa riwayat — setiap sesi dimulai dari nol
- Fokus pada latihan per soal dengan pembahasan langsung

---

## 2. Stack Teknis

| Layer | Teknologi | Versi |
|---|---|---|
| Runtime | Bun | 1.3.x |
| Backend | Hono | ^4.8 |
| Database | MariaDB / MySQL 8 | |
| ORM | Drizzle ORM | |
| Validasi | Zod | |
| Frontend | Vue 3 (Composition API) | |
| Router | Vue Router | |
| Testing | Vitest | 51 test |
| Build | Vite | |
| Linter | ESLint | |
| Formatter | Prettier | |

---

## 3. Arsitektur

```text
┌───────────────┐     HTTP/JSON      ┌───────────┐     MySQL      ┌───────────┐
│  Vue 3 (SPA)  │ ◄───────────────►  │  Hono     │ ◄───────────►  │  MariaDB  │
│  :5173 (dev)  │     /api/*         │  :3000    │     Drizzle    │  :3306    │
└───────────────┘                    └───────────┘               └───────────┘
```

Production: backend serve frontend `dist/` langsung. Satu service, satu domain, tanpa nginx untuk frontend.

```
NPM → app:3000
         ├── /          → frontend SPA (index.html)
         ├── /assets/*  → file build Vite
         └── /api/*     → backend Hono
```

---

## 4. Model Data

```
subjects  ──<  topics  ──<  questions  ──<  question_options
```

4 tabel, relasi one-to-many. Tanpa tabel riwayat (attempt, answer, snapshot).

### subjects

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | int auto_increment | PK |
| slug | varchar(50) unique | `tps`, `literasi-bahasa-indonesia` |
| label | varchar(100) | `TPS`, `Literasi Bahasa Indonesia` |
| display_order | int | Urutan tampil |

### topics

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | int auto_increment | PK |
| subject_id | int FK | → subjects.id |
| slug | varchar(50) unique | `penalaran-umum` |
| label | varchar(100) | `Penalaran Umum` |
| display_order | int | |

### questions

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | int auto_increment | PK |
| topic_id | int FK | → topics.id |
| type | enum | `single_choice`, `multiple_response`, `multiple_choice`, `true_false` |
| difficulty | enum | `easy`, `medium`, `hard` |
| question_text | text | Isi soal |
| explanation_text | text | Pembahasan |
| external_id | varchar(100) nullable | ID stabil untuk dedup |
| created_at | timestamp | |

### question_options

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | int auto_increment | PK |
| question_id | int FK | → questions.id |
| option_key | varchar(5) | `A`, `B`, `C`, `D`, `true`, `false` |
| option_text | text | Teks opsi |
| is_correct | boolean | Kunci jawaban |
| score | int nullable | Skor per opsi (khusus `multiple_choice`) |
| display_order | int | |

### quiz_attempts

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | int auto_increment | PK |
| participant_id | int FK | → participants.id |
| topic_id | int FK | → topics.id |
| status | enum | `in_progress`, `finished`, `abandoned` |
| started_at | timestamp | Waktu mulai sesi |
| finished_at | timestamp nullable | Waktu selesai sesi |
| total_questions | int | Jumlah soal dalam sesi |
| answered_questions | int | Jumlah soal terjawab |
| total_correct | int | Jumlah jawaban binary benar |
| total_incorrect | int | Jumlah jawaban binary salah |
| total_score | int | Total skor tersimpan |
| max_score | int | Skor maksimal tersimpan |
| total_elapsed_seconds | int | Total waktu pengerjaan |
| created_at | timestamp | |
| updated_at | timestamp | |

### quiz_answers

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | int auto_increment | PK |
| attempt_id | int FK | → quiz_attempts.id |
| question_id | int FK | → questions.id |
| question_type | enum | Snapshot tipe soal saat dijawab |
| selected_keys_json | text | JSON array opsi yang dipilih |
| is_correct | boolean nullable | Hasil benar/salah untuk tipe binary |
| score | int nullable | Skor jawaban |
| max_score | int nullable | Skor maksimal soal |
| elapsed_seconds | int | Waktu menjawab soal |
| answered_at | timestamp | Waktu submit jawaban |

---

## 5. API Endpoints

### `GET /health`

Cek server. Tidak perlu auth.

```json
{ "status": "ok" }
```

### `GET /api/auth`

Cek status auth.

```json
{ "auth_enabled": true }
```

### `POST /api/auth`

Login. Hanya valid jika `APP_PASSWORD` diisi.

Request:
```json
{ "password": "..." }
```

Response:
```json
{ "token": "uuid-string" }
```

### `GET /api/subjects`

Daftar subject. Butuh header `x-auth-token` (jika auth aktif).

### `GET /api/topics?subject_id=<id>`

Daftar topic + `question_count`.

```json
{
  "topics": [
    { "id": 1, "subject_id": 1, "slug": "...", "label": "...", "display_order": 1, "question_count": 4 }
  ]
}
```

### `GET /api/topics/:id`

Detail satu topic + `question_count`. Untuk lookup subject dari topic.

```json
{
  "topic": { "id": 1, "subject_id": 1, "slug": "...", "label": "...", "display_order": 1, "question_count": 4 }
}
```

### `GET /api/questions/random?topic_id=<id>&exclude=<ids>`

1 soal acak. Option tidak menyertakan `is_correct`.

### `GET /api/questions/count?topic_id=<id>`

Jumlah soal dalam topic.

### `POST /api/questions/:id/check`

Koreksi jawaban.

Request:
```json
{ "selected_keys": ["B"] }
```

Response (benar/salah):
```json
{
  "correct": true | false,
  "correct_keys": ["B"],
  "explanation": "Pembahasan..."
}
```

---

## 6. Autentikasi

| `APP_PASSWORD` | Efek |
|---|---|
| Kosong | Auth nonaktif. Frontend tidak redirect ke /auth. API tidak perlu token. |
| Diisi | Halaman /auth muncul. Semua request API butuh header `x-auth-token`. |

Token bersifat in-memory di server. Hilang saat restart.

---

## 7. Alur Pengguna

```text
[Home] → Pilih Subject → [Topics] → Pilih Topic → [Quiz]
                                                       │
                                           [Siap berlatih?]
                                           [    Mulai    ]
                                               │
                                    Timer start + Soal
                                    User pilih jawaban
                                    Klik "Selesai"
                                               │
                                    Timer stop
                                    API /check
                                    Tampilkan: benarsalah + waktu + pembahasan
                                               │
                           ┌───────────────────┴──────────┐
                           │ Soal terakhir?                │ bukan?
                           │ YA: [Lihat Hasil]             │ [Soal Berikutnya]
                           │     → Resume (skor, waktu)    │     → soal baru
                           └────────────────────────────────┘
```

**Konfirmasi keluar:** jika klik "Ganti Topik" atau navigasi browser saat sesi berjalan, muncul modal "Yakin berhenti?".

---

## 8. Struktur Backend

```
backend/src/
├── config.ts                  # Load env (process.env + .env file)
├── app.ts                     # Hono factory: routes, CORS, error, health, static
├── index.ts                   # Entry point: pool → migrasi → serve
│
├── db/
│   ├── connection.ts          # MySQL pool
│   ├── migrate.ts             # Migration runner
│   └── schema/                # Drizzle schema (4 tabel)
│
├── routes/
│   ├── auth.ts                # GET (status), POST (login)
│   ├── subjects.ts            # GET list
│   ├── topics.ts              # GET list + count
│   └── questions.ts           # GET random, GET count, POST check
│
├── services/
│   └── question-service.ts     # Query logic (random, count, check)
│
├── validators/
│   └── question-validator.ts   # Zod + manual validation
│
├── mappers/
│   └── question-response.ts    # Response shaping
│
├── middleware/
│   └── require-auth.ts         # Token validation
│
├── lib/
│   ├── auth-store.ts           # In-memory token storage
│   ├── scoring.ts              # Answer evaluation
│   ├── seed.ts                 # Seed runner
│   └── seed-check.ts           # Seed validator
│
└── __tests__/                  # 7 test files, 27 tests
```

---

## 9. Struktur Frontend

```
frontend/src/
├── main.ts                               # Bootstrap: createApp + router
├── App.vue                               # Root + global layout
│
├── router/
│   └── index.ts                          # Routes + auth guard + async init
│
├── views/
│   ├── AuthView.vue                      # Login form
│   ├── HomeView.vue                      # Daftar subject
│   ├── TopicView.vue                     # Daftar topic + count
│   └── QuizView.vue                      # Quiz container (tipis)
│
├── components/
│   ├── QuestionCard.vue                  # Soal + type/difficulty badge
│   ├── TimerBar.vue                      # Stopwatch display
│   ├── OptionList.vue                    # Opsi (radio/checkbox)
│   └── ExplanationPanel.vue              # Benarsalah + pembahasan
│
├── composables/
│   └── useQuizSession.ts                 # State machine quiz (load → answer → review → resume)
│
├── api/
│   └── client.ts                         # HTTP client + token header
│
├── types/
│   └── index.ts                          # TypeScript interfaces
│
└── __tests__/                             # 5 test files, 24 tests
```

---

## 10. Environment

File `.env` di root project:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=rahaSi4Hasan
DB_NAME=utbk_belajar
APP_PORT=3000
FRONTEND_PORT=5173
APP_PASSWORD=
CORS_ORIGIN=
```

| Variabel | Fungsi |
|---|---|
| `DB_*` | Koneksi database |
| `APP_PORT` | Port backend |
| `FRONTEND_PORT` | Port Vite dev + fallback CORS |
| `APP_PASSWORD` | Kosong = auth nonaktif. Diisi = login required |
| `CORS_ORIGIN` | Kosong = `http://localhost:FRONTEND_PORT`. Isi untuk production. |

---

## 11. Testing

| Area | File Test | Jumlah |
|---|---|---|
| Backend | 7 files | 27 tests |
| Frontend | 5 files | 24 tests |
| **Total** | **12 files** | **51 tests** |

---

## 12. Tooling

```bash
bun run lint           # ESLint
bun run format         # Prettier
bun run format:check   # Prettier check only
bun run test           # Backend + Frontend
bun run typecheck      # TypeScript strict
bun run seed:check     # Validasi seed.json
```

---

## 13. Deployment

- Image: `oven/bun:1.3.14` (tanpa build image)
- Frontend build di-mount dari host
- Backend source di-mount dari host
- Reverse proxy: Nginx Proxy Manager / Caddy
- Satu domain, satu service
- Panduan lengkap: `docs/DEPLOY/`

---

## 14. Prinsip Desain

1. **Kesederhanaan** — fitur minimum yang berguna
2. **Auth opsional** — password via env, nonaktif jika dikosongkan
3. **Tanpa state server** — sesi belajar di frontend saja
4. **Tanpa riwayat** — tidak ada tabel attempt/history
5. **Seed-first** — data masuk via JSON, bukan UI admin
6. **Timer per soal** — stopwatch dari tampil sampai submit
7. **All-or-nothing** — multiple_response harus tepat semua
