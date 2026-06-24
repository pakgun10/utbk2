# UTBK Belajar

Aplikasi web sederhana untuk belajar soal UTBK.
Satu soal, satu jawaban, satu pembahasan. Fokus.

---

## Ringkasan

- Backend: Bun + Hono + Drizzle ORM + MariaDB/MySQL
- Frontend: Vue 3 + Vue Router
- Validasi: Zod
- Testing: Vitest
- Tooling: ESLint + Prettier

Flow aplikasi:

1. Pilih mata uji
2. Pilih topik
3. Kerjakan soal acak
4. Lihat hasil dan pembahasan
5. Lanjut ke soal berikutnya

Jika `APP_PASSWORD` diisi, aplikasi memakai password sederhana.
Jika `APP_PASSWORD` kosong, aplikasi bisa diakses langsung tanpa login.

---

## Cara Menjalankan

### Prasyarat

- [Bun](https://bun.sh) v1.3+
- MariaDB / MySQL 8
- Database `utbk_belajar` sudah dibuat

### Setup Awal

```bash
# 1. Masuk ke direktori project
cd utbk2

# 2. Install dependency root + package
bun install
bun run install:all

# 3. Setup database
bun run db:migrate
bun run seed

# 4. Jalankan backend + frontend
bun run dev
```

Frontend berjalan di `http://localhost:5173`.
Backend berjalan di `http://localhost:3000`.

### Konfigurasi

Edit file `.env` di root project:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password-anda
DB_NAME=utbk_belajar
APP_PORT=3000
FRONTEND_PORT=5173
APP_PASSWORD=secretttt
CORS_ORIGIN=
```

Catatan:
- Jika `APP_PASSWORD` kosong, auth nonaktif.
- Jika `APP_PASSWORD` diisi, user harus login lewat `/auth`.
- `CORS_ORIGIN` biarkan kosong untuk development (auto `http://localhost:FRONTEND_PORT`).
  Isi untuk production, misal `https://domain-anda.com`.

---

## Perintah Penting

Semua perintah berikut dijalankan dari root project:

```bash
bun run dev           # Jalankan backend + frontend
bun run seed          # Insert/update bank soal dari seed.json
bun run seed:check    # Validasi seed.json tanpa menulis ke database
bun run db:migrate    # Jalankan migrasi database
bun run lint          # Lint backend + frontend
bun run format        # Format seluruh repo
bun run format:check  # Cek format tanpa mengubah file
bun run test          # Jalankan semua test
bun run typecheck     # TypeScript check backend + frontend
```

Per package:

```bash
cd backend && bun run test
cd frontend && bun run test
```

---

## Cara Pakai

### 1. Pilih Mata Uji

Di halaman utama, pilih salah satu mata uji UTBK:

- TPS
- Literasi Bahasa Indonesia
- Literasi Bahasa Inggris
- Penalaran Matematika

### 2. Pilih Topik

Setiap mata uji berisi beberapa topik.
Klik topik yang ingin dikerjakan.

### 3. Kerjakan Soal

- Soal diambil secara acak dari topik terpilih
- Timer menghitung waktu per soal
- Pilih jawaban
- Klik `Selesai`

### 4. Lihat Pembahasan

Setelah submit:

- status `Benar` / `Salah`
- waktu pengerjaan
- kunci jawaban
- pembahasan

Klik `Soal Berikutnya` untuk lanjut.

### 5. Ganti Topik

Klik `Ganti Topik` di halaman quiz untuk kembali ke daftar topik.

---

## Tipe Soal

| Tipe | Keterangan | Cara Jawab |
|---|---|---|
| `single_choice` | Pilihan ganda | Pilih satu jawaban |
| `multiple_response` | Pilihan ganda kompleks | Pilih semua jawaban benar |
| `true_false` | Benar / Salah | Pilih satu dari `Benar` atau `Salah` |

Aturan penilaian:

- `single_choice`: harus tepat satu jawaban benar
- `multiple_response`: all-or-nothing, semua yang benar harus dipilih dan tidak boleh ada yang salah
- `true_false`: harus tepat satu jawaban benar

---

## Menambah Soal

Soal disimpan di file `seed.json` di root project.

Contoh ringkas:

```json
{
  "subjects": [
    { "slug": "tps", "label": "TPS", "display_order": 1 }
  ],
  "topics": [
    { "slug": "penalaran-umum", "subject_slug": "tps", "label": "Penalaran Umum", "display_order": 1 }
  ],
  "questions": [
    {
      "topic_slug": "penalaran-umum",
      "type": "single_choice",
      "difficulty": "medium",
      "question_text": "Isi soal...",
      "explanation_text": "Pembahasan...",
      "options": [
        { "key": "A", "text": "Pilihan A", "is_correct": false },
        { "key": "B", "text": "Pilihan B", "is_correct": true },
        { "key": "C", "text": "Pilihan C", "is_correct": false },
        { "key": "D", "text": "Pilihan D", "is_correct": false }
      ]
    }
  ]
}
```

Setelah mengubah `seed.json`:

```bash
bun run seed:check
bun run seed
```

Penting:

- workflow ini paling aman untuk **menambah** subject, topic, dan soal baru
- workflow ini **bukan** editor penuh untuk data yang sudah pernah masuk
- menghapus item dari `seed.json` tidak otomatis menghapus data dari database
- mengganti `slug` subject/topic bukan rename aman
- dedup soal saat ini berbasis `question_text`

Lihat detail format dan batasan edit/hapus di [docs/FORMAT-SOAL.md](/home/DATA/Proyek/AHE/utbk2/docs/FORMAT-SOAL.md:1).

---

## API

### Endpoint utama

| Method | Path | Fungsi |
|---|---|---|
| GET | `/health` | Health check sederhana |
| GET | `/api/auth` | Status auth (`auth_enabled`) |
| POST | `/api/auth` | Login jika auth aktif |
| GET | `/api/subjects` | Daftar mata uji |
| GET | `/api/topics?subject_id=` | Daftar topik |
| GET | `/api/questions/count?topic_id=` | Jumlah soal dalam topik |
| GET | `/api/questions/random?topic_id=` | Soal acak |
| POST | `/api/questions/:id/check` | Koreksi jawaban |

### Response contoh

```json
{ "status": "ok" }
```

```json
{ "auth_enabled": true }
```

```json
{ "subjects": [] }
```

---

## Struktur Project

```text
utbk2/
├── README.md
├── RULES.md
├── seed.json
├── docs/
├── backend/
│   └── src/
│       ├── app.ts
│       ├── config.ts
│       ├── db/
│       ├── lib/
│       ├── mappers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       └── validators/
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── composables/
│       ├── router/
│       ├── types/
│       └── views/
└── package.json
```

Dokumen lain:

- [docs/STRUKTUR.md](/home/DATA/Proyek/AHE/utbk2/docs/STRUKTUR.md:1)
- [docs/DEPLOY.md](/home/DATA/Proyek/AHE/utbk2/docs/DEPLOY.md:1)
- [docs/RENCANA-PROFESIONALISASI.md](/home/DATA/Proyek/AHE/utbk2/docs/RENCANA-PROFESIONALISASI.md:1)

---

## Kualitas

Baseline kualitas repo saat ini:

- `seed:check` tersedia
- `lint` tersedia
- `format` tersedia
- backend dan frontend punya test aktif
- route backend utama sudah punya test
- state machine quiz frontend sudah punya test composable

Sebelum merge/perubahan besar, jalankan:

```bash
bun run seed:check
bun run lint
bun run test
bun run typecheck
```

---

## FAQ

**Q: Apakah aplikasi selalu memakai login?**  
A: Tidak. Login hanya aktif jika `APP_PASSWORD` diisi.

**Q: Kenapa tidak ada riwayat nilai?**  
A: Scope aplikasi memang latihan per soal tanpa history tersimpan.

**Q: Bisakah menambah soal lewat UI?**  
A: Tidak. Soal masuk lewat `seed.json` dan command seed.

**Q: Timer ini countdown atau stopwatch?**  
A: Stopwatch per soal, bukan countdown.

**Q: Apakah soal yang sudah dikerjakan bisa muncul lagi?**  
A: Dalam sesi yang sama, soal yang sudah dijawab dikecualikan. Di sesi baru, soal bisa muncul lagi.

---

## Dokumentasi Lainnya

| Topik | Lokasi |
|---|---|
| Arsitektur & API | `docs/ARSITEKTUR.md` |
| Panduan deploy production | `docs/DEPLOY/README.md` |
| Format & cara menambah soal | `docs/FORMAT-SOAL/README.md` |
| Catatan rilis | `docs/CHANGELOG.md` |
| Aturan project untuk developer | `RULES.md` |

---

## Lisensi

Private — untuk penggunaan pribadi.
