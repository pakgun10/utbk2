# RULES — UTBK Belajar

> Dokumen ini WAIB dibaca oleh siapa pun (manusia atau AI) sebelum
> mengerjakan perubahan pada project ini. Setiap model/editor baru
> WAJIB membaca dan mematuhi aturan ini.

---

## 1. Gambaran Project

Aplikasi web belajar soal UTBK. Single-user, tanpa login, tanpa riwayat.
Flow: pilih topik -> soal acak -> timer -> jawab -> lihat pembahasan -> lanjut.

Lokasi: `/home/DATA/Proyek/AHE/utbk2/`

---

## 2. Stack Wajib

| Komponen | Wajib | Catatan |
|---|---|---|
| Runtime | Bun | Jangan pakai Node.js |
| Backend | Hono | Jangan Express/Fastify |
| ORM | Drizzle ORM | Jangan Prisma/TypeORM langsung |
| DB Driver | mysql2 | Via Drizzle |
| Validasi | Zod | Setiap input/request wajib divalidasi |
| Frontend | Vue 3 + Composition API | Jangan pakai Options API |
| Router | Vue Router | |
| Testing | Vitest | Wajib untuk backend & frontend |
| TypeScript | Strict mode | `strict: true` di tsconfig |
| Database | MariaDB / MySQL 8 | |

---

## 3. Arsitektur & Keputusan Tak Bisa Diganggu

Aturan berikut TIDAK BOLEH diubah tanpa diskusi eksplisit:

### 3.1 Autentikasi Opsional
Aplikasi punya lapisan password sederhana. Jika `APP_PASSWORD` diisi di `.env`:
- User harus login via halaman `/auth` sebelum bisa mengakses
- Backend mewajibkan header `x-auth-token` untuk semua request API
- Token bersifat in-memory di server (hilang saat server restart)

Jika `APP_PASSWORD` kosong, autentikasi tidak aktif.
Aplikasi bisa diakses langsung tanpa login.

### 3.2 Riwayat dan Skor Tersimpan
Aplikasi menyimpan sesi pengerjaan (`quiz_attempts`) dan jawaban per soal (`quiz_answers`) untuk kebutuhan rekap hasil peserta. Logika scoring tetap berada di backend dan menggunakan fungsi scoring resmi.

### 3.3 Seed-First, Bukan Admin Panel
Data soal masuk via file `seed.json` di root project. Tidak perlu UI admin untuk CRUD soal. Tidak perlu endpoint POST/PUT/DELETE untuk subjects, topics, atau questions.

### 3.4 Timer Per Soal
Timer dihitung per soal: mulai saat soal tampil, berhenti saat user submit jawaban. Bukan countdown. Waktu hanya ditampilkan, tidak ada batas waktu pengerjaan.

### 3.5 Evaluasi All-Or-Nothing untuk Multiple Response
Untuk tipe `multiple_response`, semua opsi benar harus terpilih dan tidak ada opsi salah yang terpilih. Tidak ada partial credit.

---

## 4. API Design Rules

### 4.1 Endpoints (Hanya Ini)

| Method | Path | Fungsi |
|---|---|---|
| GET | `/api/subjects` | Semua subject |
| GET | `/api/topics?subject_id=` | Topics dalam subject |
| GET | `/api/questions/random?topic_id=` | 1 soal acak (opsi tanpa is_correct) |
| POST | `/api/questions/:id/check` | Cek jawaban non-persisten, return pembahasan |
| POST | `/api/attempts/start` | Mulai sesi pengerjaan tersimpan |
| POST | `/api/attempts/:id/answers` | Simpan jawaban per soal dan return pembahasan |
| POST | `/api/attempts/:id/finish` | Selesaikan sesi dan simpan ringkasan akhir |
| GET | `/api/attempts/:id` | Ambil ringkasan attempt dan jawaban tersimpan |

### 4.2 Response Format

Semua response berupa JSON dengan struktur:

```typescript
// Sukses
{ "subjects": [...] }
{ "topics": [...] }
{ "question": { ... } | null }
{ "correct": boolean, "correct_keys": string[], "explanation": string }

// Error
{ "error": string, "message": string }
```

### 4.3 Error Handling
- 404 untuk resource tidak ditemukan
- 400 untuk validasi gagal
- 500 untuk error server, jangan bocorkan stack trace

---

## 5. Database Rules

### 5.1 Naming Convention
- Tabel: `snake_case` (subjects, topics, questions, question_options)
- Kolom: `snake_case`
- Primary key: `id` di semua tabel
- Foreign key: `{table}_id` (topic_id, subject_id, question_id)

### 5.2 Migration
- Gunakan Drizzle Kit untuk generate migrasi
- Semua perubahan skema via Drizzle schema files, bukan SQL manual
- Migration dijalankan otomatis saat server start

### 5.3 Connection
- Pool via `mysql2/promise`
- Koneksi dari env variable
- Connection limit: 10

---

## 6. Frontend Rules

### 6.1 Component Structure
- `views/`: halaman utama (HomeView, TopicView, QuizView)
- `components/`: komponen reusable (QuestionCard, TimerBar, OptionList, ExplanationPanel)
- `api/`: HTTP client ke backend
- `router/`: Vue Router config
- `types/`: TypeScript interfaces

### 6.2 State Management
- Tidak perlu Pinia atau store global
- State cukup di component level dengan `ref`/`reactive`
- QuizView punya state machine: `loading -> answering -> reviewing`

### 6.3 Vue Router Paths
```
/               -> HomeView
/topics/:id     -> TopicView (id = subject_id)
/quiz/:id       -> QuizView (id = topic_id)
```

### 6.4 Proxy
Vite dev server proxy `/api` ke `http://localhost:3000` (backend).

---

## 7. Testing Rules

### 7.1 Backend
- `scoring.test.ts`: unit test logika koreksi (single_choice, multiple_response, true_false)
- `subjects.test.ts`: test GET /api/subjects
- `topics.test.ts`: test GET /api/topics
- `questions.test.ts`: test GET random + POST check

### 7.2 Frontend
Setiap komponen dan view WAJIB punya test:
- TimerBar: format display, start/stop
- OptionList: single select, multi select, disabled state
- ExplanationPanel: render benar/salah, pembahasan
- QuizView: flow loading -> answering -> reviewing

### 7.3 Coverage
Tidak wajib 100%, tapi setiap logika bisnis harus ditest.
Test wajib passing sebelum commit.

### 7.4 Testing Workflow
Setiap selesai satu unit kerja (fitur/fix/refactor):

1. **Jalankan test** — `bun run test` (backend dan frontend)
2. **Ada fail?** — perbaiki kode atau test, ulangi langkah 1
3. **Semua pass?** — lanjut ke unit kerja berikutnya

Gunakan `bun run test:watch` saat development aktif agar test
otomatis jalan ulang tiap perubahan file.

---

## 8. File & Code Convention

### 8.1 TypeScript
- Strict mode
- Jangan pakai `any` kecuali terpaksa (kasih komentar why)
- Jangan pakai `@ts-ignore` atau `@ts-expect-error`
- Tipe ekspor dari `types/` di frontend

### 8.2 Format
- Indentasi: 2 spasi
- Single quotes untuk string
- Titik koma di akhir statement
- Nama file: `kebab-case.ts`

### 8.3 File Structure
```
utbk2/
├── .env                 # Hanya di local, jangan commit
├── seed.json            # Data soal
├── RULES.md             # WAJIB BACA
├── docs/                # Dokumentasi konsep & rencana
├── backend/
│   └── src/
│       ├── db/schema/   # Drizzle schema
│       ├── routes/      # Hono route handlers
│       ├── lib/         # Utility functions
│       └── index.ts     # Entry point
├── frontend/
│   └── src/
│       ├── views/       # Halaman
│       ├── components/  # Komponen
│       ├── api/         # HTTP client
│       ├── router/      # Router config
│       └── types/       # TypeScript types
```

---

## 9. Cara Menjalankan

```bash
# Backend
cd backend
bun install
bun run dev          # Development dengan watch mode
bun run test         # Test
bun run seed         # Inject data dari seed.json

# Frontend
cd frontend
bun install
bun run dev          # Vite dev server (dengan proxy ke backend)
bun run test         # Test
```

Pastikan database MariaDB/MySQL sudah running dan database `utbk_belajar` sudah dibuat sebelum menjalankan backend.

---

## 10. Larangan (Jangan Pernah Lakukan)

1. **Jangan** tambah fitur di luar scope (auth, riwayat, leaderboard, dll)
2. **Jangan** ubah stack tanpa diskusi (pindah ke Express, Prisma, React, dll)
3. **Jangan** buat endpoint POST/PUT/DELETE untuk data master (cukup seed)
4. **Jangan** simpan state user di server (semua di frontend)
5. **Jangan** gunakan AI untuk generate kode yang melanggar aturan di atas
6. **Jangan** tambah dependency yang tidak diperlukan
7. **Jangan** commit .env atau node_modules

---

## 11. Jika Ganti Model / Editor

1. **Baca `RULES.md` ini** — aturan main project.
2. **Baca `docs/README.md`** — indeks dokumentasi, tentukan yang relevan.
3. **Baca `docs/ARSITEKTUR.md`** — paham struktur dan API.
4. **Baca `docs/STRUKTUR.md`** — navigasi direktori.
5. **Jalankan `bun run test`** — pastikan kondisi awal hijau.
6. Jangan mulai koding sebelum paham semua aturan di atas.

---

*Last updated: 24 Juni 2026*
