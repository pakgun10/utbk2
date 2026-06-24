# Rencana Profesionalisasi Proyek

Dokumen ini memecah langkah peningkatan kualitas proyek menjadi unit kerja yang konkret, kecil, dan bisa dieksekusi bertahap tanpa mengganggu flow aplikasi yang sudah berjalan.

---

## Tujuan

Target utama:

1. Kode lebih mudah dirawat
2. Risiko bug integrasi lebih kecil
3. Kesiapan deploy lebih rapi
4. Kualitas engineering lebih konsisten

---

## Fase 1 — Quick Wins

Fase ini murah, cepat, dan berdampak langsung.

### 1.1 Rapikan Struktur Router Frontend

Tujuan:
- Menyesuaikan dengan struktur yang diwajibkan di `RULES.md`
- Mengurangi beban bootstrap di `main.ts`

Perubahan:
- Buat `frontend/src/router/index.ts`
- Pindahkan definisi routes dan navigation guard dari `frontend/src/main.ts`
- Sisakan `createApp(App).use(router).mount(...)` di `main.ts`

Checklist:
- [x] Tambah file `frontend/src/router/index.ts`
- [x] Pindahkan route guard auth ke file router
- [x] Pastikan import alias tetap valid
- [x] Tambahkan test ringan jika perlu

### 1.2 Sentralisasi Config Backend

Tujuan:
- Menghilangkan pembacaan env yang tersebar
- Mencegah drift antara runtime app dan koneksi DB

Perubahan:
- Buat `backend/src/config.ts`
- Satukan parsing env untuk:
  - `APP_PORT`
  - `FRONTEND_PORT`
  - `APP_PASSWORD`
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`

Checklist:
- [x] Buat `backend/src/config.ts`
- [x] Refactor `backend/src/index.ts`
- [x] Refactor `backend/src/db/connection.ts`
- [x] Pastikan fallback `.env` tetap berjalan

### 1.3 Tambahkan Health Endpoint

Tujuan:
- Mempermudah health check docker/reverse proxy/monitoring

Perubahan:
- Tambahkan `GET /health`
- Return minimal:

```json
{ "status": "ok" }
```

Checklist:
- [x] Tambah route health di backend
- [x] Tambahkan test route
- [x] Dokumentasikan di `README.md` atau `docs/DEPLOY.md`

### 1.4 Lengkapi Empty/Error State Frontend

Tujuan:
- UX lebih profesional
- User tidak berhenti di layar statis tanpa tindakan

Area:
- `frontend/src/views/HomeView.vue`
- `frontend/src/views/TopicView.vue`
- `frontend/src/views/QuizView.vue`

Checklist:
- [x] Tambahkan tombol retry saat fetch gagal
- [x] Tambahkan empty state saat subject/topic kosong
- [x] Tambahkan state saat tidak ada soal tersedia

### 1.5 Tambahkan Tooling Dasar

Tujuan:
- Menjaga konsistensi style dan workflow tim

Perubahan:
- Tambah `lint`
- Tambah `format`
- Tambah `seed:check`

Checklist:
- [x] Pilih linter/formatter
- [x] Tambahkan script root + package backend/frontend bila perlu
- [x] Tambahkan validasi `seed.json` tanpa insert DB

---

## Fase 2 — Refactor Inti

Fase ini fokus pada maintainability.

### 2.1 Pecah Route Questions Backend

Masalah saat ini:
- Handler memegang validasi, query, response shaping, dan orchestration sekaligus

Target struktur:

```text
backend/src/
├── routes/questions.ts
├── services/question-service.ts
├── validators/question-validator.ts
└── mappers/question-response.ts
```

Checklist:
- [x] Pindahkan validasi request ke validator
- [x] Pindahkan query soal/random/check ke service
- [x] Pindahkan mapping response ke helper terpisah
- [x] Pastikan route tinggal wire-up

### 2.2 Pecah State Quiz Frontend

Masalah saat ini:
- `QuizView.vue` memegang terlalu banyak state dan flow

Target:
- Buat composable `frontend/src/composables/useQuizSession.ts`

Isi minimal:
- load question
- start quiz
- submit answer
- next question
- session summary
- exit flow

Checklist:
- [x] Buat composable baru
- [x] Pindahkan state machine quiz dari `QuizView.vue`
- [x] Sisakan `QuizView.vue` sebagai presenter/container tipis
- [x] Tambahkan test composable atau view flow

### 2.3 Rapikan Kontrak API

Tujuan:
- Mencegah backend/frontend drift
- Response shape lebih eksplisit

Opsi:
- Buat folder shared DTO manual
- Atau buat `frontend/src/types/api.ts` dan backend response mapper yang konsisten

Checklist:
- [ ] Pisahkan tipe domain dari tipe response API
- [ ] Definisikan payload `subjects`, `topics`, `question`, `check result`, `auth`, `health`
- [ ] Gunakan tipe itu di client frontend

### 2.4 Perkuat Seed Identity

Masalah saat ini:
- Dedup soal masih berbasis `question_text` identik

Saran:
- Tambah fingerprint/hash atau natural key yang lebih stabil

Checklist:
- [ ] Tentukan strategi unique soal
- [ ] Perbarui seed logic
- [ ] Tambahkan test duplikasi

---

## Fase 3 — Hardening Produksi

Fase ini fokus pada reliability dan operasional.

### 3.1 Tambahkan Rate Limit Auth

Tujuan:
- Mengurangi brute force pada `/api/auth`

Saran implementasi:
- In-memory rate limiting sederhana per IP
- Batas ringan, misalnya 5-10 percobaan per menit

Checklist:
- [ ] Tambahkan middleware rate limit
- [ ] Terapkan hanya ke `/api/auth`
- [ ] Tambahkan test untuk limit dan reset window

### 3.2 Tambahkan Structured Logging

Tujuan:
- Debugging production lebih cepat

Minimal field:
- timestamp
- route
- method
- status
- duration
- request_id

Checklist:
- [ ] Tambah middleware request logging
- [ ] Tambah request ID per request
- [ ] Pastikan error log terhubung ke request ID

### 3.3 Tambahkan Integration Test App Factory

Tujuan:
- Mengunci perilaku auth on/off dan wiring route

Target:
- test `createApp()`
- auth disabled
- auth enabled
- unauthorized request
- static JSON error shape

Checklist:
- [ ] Buat test untuk `backend/src/app.ts`
- [ ] Mock dependency yang perlu
- [ ] Pastikan kontrak response stabil

### 3.4 Perjelas Jalur Deploy Resmi

Masalah saat ini:
- Dokumen deploy masih membuka terlalu banyak jalur alternatif

Target:
- Satu jalur deploy utama yang direkomendasikan
- Alternatif dipindah ke bagian appendix/troubleshooting

Checklist:
- [ ] Sederhanakan `docs/DEPLOY.md`
- [ ] Pilih satu baseline deploy resmi
- [ ] Tambahkan health check dan checklist pasca deploy

---

## Fase 4 — CI dan Standar Tim

### 4.1 Tambahkan GitHub Actions

Pipeline minimal:
- install dependencies
- backend test
- frontend test
- typecheck
- lint

Checklist:
- [ ] Buat workflow CI
- [ ] Pastikan Bun setup stabil
- [ ] Fail fast jika test/typecheck gagal

### 4.2 Tambahkan CONTRIBUTING

Isi minimal:
- cara setup
- cara run test
- aturan sebelum merge
- konvensi commit/branch bila diperlukan

Checklist:
- [ ] Tambah `CONTRIBUTING.md`
- [ ] Sinkronkan dengan `RULES.md`

### 4.3 Tambahkan Checklist PR / Release

Tujuan:
- Menjaga kualitas saat perubahan mulai sering

Checklist standar:
- [ ] test lulus
- [ ] typecheck lulus
- [ ] seed valid
- [ ] docs diperbarui jika kontrak berubah

---

## Prioritas Eksekusi

Urutan yang disarankan:

1. Fase 1.1 — router frontend
2. Fase 1.2 — config backend
3. Fase 1.3 — health endpoint
4. Fase 1.4 — empty/error state
5. Fase 1.5 — tooling dasar
6. Fase 2.1 — refactor questions backend
7. Fase 2.2 — refactor quiz frontend
8. Fase 2.3 — kontrak API
9. Fase 3.1 sampai 3.4 — hardening produksi
10. Fase 4 — CI dan standar tim

---

## Definisi Selesai

Satu item dianggap selesai jika:

- kode sudah diubah
- test relevan sudah ditambahkan/diupdate
- `bun run test` lulus
- `bun run typecheck` lulus
- dokumentasi diperbarui jika kontrak atau workflow berubah

---

## Catatan

Jika proyek ini tetap single-user dan scope dijaga kecil, tidak semua langkah harus dilakukan sekaligus. Yang paling bernilai untuk kondisi sekarang adalah:

1. sentralisasi config
2. refactor `QuizView.vue`
3. refactor `questions.ts`
4. CI otomatis

Empat item itu akan memberi rasio manfaat terhadap effort paling baik.
