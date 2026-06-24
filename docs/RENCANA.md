# Changelog

> Catatan perubahan dan fitur yang sudah diimplementasikan.
> Dari awal (Juni 2026) sampai kondisi terkini.

---

## v1.0 — Launch

### Backend

- Hono API dengan 6 endpoint: subjects, topics, questions (random, count, check), auth, health
- Drizzle ORM + 4 tabel: subjects, topics, questions, question_options
- Service layer (`question-service.ts`) — query terpusat
- Validator layer (`question-validator.ts`) — Zod + validasi manual
- Mapper layer (`question-response.ts`) — response shaping terpisah
- Central config (`config.ts`) — baca dari `process.env` dulu, fallback ke file `.env`
- Scoring logic — single_choice, multiple_response (all-or-nothing), true_false
- Migration runner — auto migrate saat server start
- Seed system — `bun run seed` + `bun run seed:check`
- Auth opsional — `APP_PASSWORD` di `.env`, token in-memory
- CORS configurable — `CORS_ORIGIN` env variable
- Request ID + structured error logging
- Health check endpoint (`GET /health`)
- Production mode — serve frontend `dist/` langsung dari Hono

### Frontend

- Vue 3 + Composition API
- Vue Router dengan auth guard
- AuthView — halaman login password
- HomeView — daftar subject
- TopicView — daftar topic + jumlah soal
- QuizView — state machine: ready → answering → reviewing → resume
- Composables — `useQuizSession.ts` untuk state quiz
- 4 komponen: QuestionCard, TimerBar, OptionList, ExplanationPanel
- Timer per soal (stopwatch)
- Counter real-time (1/4, 2/4, dst)
- Resume sesi setelah semua soal terjawab
- Modal konfirmasi keluar saat sesi berjalan
- Auto-start (soal berikutnya langsung tanpa klik Mulai)

### Testing

- 12 test files, 51 test (27 backend + 24 frontend)
- Backend: scoring logic, route test (subjects, topics, questions), auth store, seed, app factory
- Frontend: TimerBar, OptionList, ExplanationPanel, useQuizSession, TopicView

### Tooling

- ESLint + Prettier + script lint/format
- TypeScript strict mode
- `bun run test`, `bun run typecheck`, `bun run seed:check`

### Deployment

- `docker-compose.yml` — tanpa build image, langsung `image: oven/bun:1.3.14`
- Frontend dist di-mount, backend source di-mount
- Panduan deploy dengan Nginx Proxy Manager (opsi host & container)
- Panduan: `docs/DEPLOY/`
- Troubleshooting untuk koneksi MySQL, `network_mode: host`

### Dokumentasi

- `README.md` — panduan pengguna
- `RULES.md` — aturan project
- `docs/KONSEP.md` — arsitektur & fitur
- `docs/DEPLOY/` — deploy production (9 file)
- `docs/FORMAT-SOAL/` — format data soal (7 file)
- `docs/RENCANA-PROFESIONALISASI.md` — rencana pengembangan lanjutan
- `CONTRIBUTING.md` — panduan kontribusi
