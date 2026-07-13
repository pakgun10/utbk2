# Implementation Plan: Penyimpanan Hasil Tes Peserta ke Database

> **Status:** Draft — belum diimplementasikan  
> **Tujuan:** menyimpan sesi pengerjaan, jawaban per soal, skor, waktu, dan ringkasan akhir peserta secara persisten di database.

---

## 1. Ringkasan Audit Saat Ini

Saat ini aplikasi UTBK sudah bisa:

- Menyimpan data peserta dasar di tabel `participants`
- Mengambil soal acak per topik
- Mengecek jawaban via `POST /api/questions/:id/check`
- Menghitung benar/salah untuk:
  - `single_choice`
  - `multiple_response`
  - `true_false`
- Menghitung skor untuk `multiple_choice`
- Menampilkan resume akhir sesi di frontend:
  - Benar
  - Salah
  - Total waktu
  - Akurasi
  - Total skor
  - Skor maksimal
  - Persentase skor

Namun saat ini hasil tersebut **belum persisten**.

### 1.1 Kondisi Database Saat Ini

Schema yang ada:

```txt
participants
subjects
topics
questions
question_options
```

Belum ada tabel untuk:

```txt
quiz_attempts
quiz_answers
quiz_results
```

### 1.2 Kondisi Backend Saat Ini

Endpoint check jawaban:

```txt
POST /api/questions/:id/check
```

Saat ini hanya:

1. Menerima `selected_keys`
2. Mengambil data soal dan opsi
3. Menghitung hasil
4. Mengembalikan hasil ke frontend

Belum melakukan `insert` ke database untuk jawaban peserta.

### 1.3 Kondisi Frontend Saat Ini

Di `frontend/src/composables/useQuizSession.ts`, hasil disimpan sementara di memory:

```ts
const sessionResults = ref<SessionResult[]>([]);
```

Data hilang jika:

- Browser refresh
- User keluar halaman
- Device berganti
- Session selesai tapi tidak disimpan

### 1.4 Catatan Aturan Lama

`RULES.md` masih menyatakan:

```md
### 3.2 Tidak Ada Riwayat / Skor Tersimpan
Setiap soal selesai dibahas, selesai. Tidak ada tabel attempt, answer, snapshot, atau penyimpanan hasil apa pun di database.
```

Jika fitur persistence diterapkan, bagian ini harus diubah karena sudah tidak sesuai.

---

## 2. Target Fitur

Setelah implementasi, aplikasi harus bisa:

| Kebutuhan | Target |
|---|---|
| Menyimpan sesi pengerjaan peserta | Ya |
| Menyimpan jawaban per soal | Ya |
| Menyimpan `selected_keys` | Ya |
| Menyimpan benar/salah | Ya, untuk tipe binary |
| Menyimpan skor numerik | Ya, terutama untuk `multiple_choice` |
| Menyimpan waktu per soal | Ya |
| Menyimpan total waktu | Ya |
| Menyimpan ringkasan akhir | Ya |
| Menampilkan hasil akhir dari data yang tersimpan | Ya |
| Tetap mendukung mode existing tanpa merusak 4 tipe soal | Ya |

---

## 3. Prinsip Desain

1. **Tidak mengubah logika scoring existing**  
   Fungsi `checkAnswer()` dan `evaluateScoredAnswer()` tetap menjadi sumber kebenaran.

2. **Backend sebagai source of truth untuk persistence**  
   Frontend boleh menghitung sementara untuk UI, tetapi data final harus tersimpan di DB.

3. **Setiap sesi tes = satu attempt**  
   Satu peserta mengerjakan satu topik → satu record `quiz_attempts`.

4. **Setiap jawaban = satu answer row**  
   Setiap submit jawaban disimpan ke `quiz_answers`.

5. **Idempotent / aman dari double submit**  
   Satu `attempt_id + question_id` sebaiknya hanya punya satu jawaban.

6. **Support mixed question type**  
   Attempt bisa berisi soal binary dan soal scored.

7. **Tidak menyimpan pembahasan sebagai snapshot**  
   Pembahasan tetap dibaca dari `questions.explanation_text`.

8. **Tidak menyimpan `correct_keys` untuk user-facing data kecuali diperlukan audit**  
   Jika perlu audit, bisa disimpan sebagai JSON string, tetapi default cukup simpan hasil evaluasi.

---

## 4. Desain Database

### 4.1 Tabel Baru: `quiz_attempts`

Menyimpan satu sesi pengerjaan peserta.

```sql
CREATE TABLE `quiz_attempts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `participant_id` int NOT NULL,
  `topic_id` int NOT NULL,
  `status` enum('in_progress','finished','abandoned') NOT NULL DEFAULT 'in_progress',
  `started_at` timestamp NOT NULL DEFAULT (now()),
  `finished_at` timestamp NULL,
  `total_questions` int NOT NULL DEFAULT 0,
  `answered_questions` int NOT NULL DEFAULT 0,
  `total_correct` int NOT NULL DEFAULT 0,
  `total_incorrect` int NOT NULL DEFAULT 0,
  `total_score` int NOT NULL DEFAULT 0,
  `max_score` int NOT NULL DEFAULT 0,
  `total_elapsed_seconds` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `quiz_attempts_id` PRIMARY KEY (`id`),
  CONSTRAINT `quiz_attempts_participant_id_participants_id_fk`
    FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`),
  CONSTRAINT `quiz_attempts_topic_id_topics_id_fk`
    FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`)
);
```

#### Catatan Kolom

| Kolom | Keterangan |
|---|---|
| `participant_id` | Peserta yang mengerjakan |
| `topic_id` | Topik yang dikerjakan |
| `status` | `in_progress`, `finished`, atau `abandoned` |
| `total_questions` | Jumlah soal tersedia/ditargetkan |
| `answered_questions` | Jumlah soal yang sudah dijawab |
| `total_correct` | Jumlah soal binary yang benar |
| `total_incorrect` | Jumlah soal binary yang salah |
| `total_score` | Akumulasi skor numerik |
| `max_score` | Akumulasi skor maksimal numerik |
| `total_elapsed_seconds` | Total waktu pengerjaan |

---

### 4.2 Tabel Baru: `quiz_answers`

Menyimpan jawaban per soal.

```sql
CREATE TABLE `quiz_answers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `attempt_id` int NOT NULL,
  `question_id` int NOT NULL,
  `question_type` enum('single_choice','multiple_response','multiple_choice','true_false') NOT NULL,
  `selected_keys_json` text NOT NULL,
  `is_correct` boolean NULL,
  `score` int NULL,
  `max_score` int NULL,
  `elapsed_seconds` int NOT NULL DEFAULT 0,
  `answered_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `quiz_answers_id` PRIMARY KEY (`id`),
  CONSTRAINT `quiz_answers_attempt_id_question_id_unique` UNIQUE (`attempt_id`, `question_id`),
  CONSTRAINT `quiz_answers_attempt_id_quiz_attempts_id_fk`
    FOREIGN KEY (`attempt_id`) REFERENCES `quiz_attempts`(`id`),
  CONSTRAINT `quiz_answers_question_id_questions_id_fk`
    FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`)
);
```

#### Catatan Kolom

| Kolom | Keterangan |
|---|---|
| `selected_keys_json` | JSON string dari array selected keys, contoh `["A"]` atau `["A","C"]` |
| `is_correct` | `true/false` untuk tipe binary; `NULL` untuk `multiple_choice` |
| `score` | Skor jawaban; untuk binary bisa `1/0`, untuk `multiple_choice` sesuai skor opsi |
| `max_score` | Skor maksimal soal; binary = `1`, `multiple_choice` = skor tertinggi opsi |
| `elapsed_seconds` | Waktu menjawab soal tersebut |

---

## 5. Drizzle Schema

Tambah file baru:

```txt
backend/src/db/schema/quiz-attempts.ts
backend/src/db/schema/quiz-answers.ts
```

Update export di:

```txt
backend/src/db/schema/index.ts
```

### 5.1 `quiz-attempts.ts`

```ts
import { mysqlTable, int, mysqlEnum, timestamp } from 'drizzle-orm/mysql-core';
import { participants } from './participants';
import { topics } from './topics';

export const quizAttempts = mysqlTable('quiz_attempts', {
  id: int('id').autoincrement().primaryKey(),
  participant_id: int('participant_id').notNull().references(() => participants.id),
  topic_id: int('topic_id').notNull().references(() => topics.id),
  status: mysqlEnum('status', ['in_progress', 'finished', 'abandoned']).notNull().default('in_progress'),
  started_at: timestamp('started_at').defaultNow().notNull(),
  finished_at: timestamp('finished_at'),
  total_questions: int('total_questions').notNull().default(0),
  answered_questions: int('answered_questions').notNull().default(0),
  total_correct: int('total_correct').notNull().default(0),
  total_incorrect: int('total_incorrect').notNull().default(0),
  total_score: int('total_score').notNull().default(0),
  max_score: int('max_score').notNull().default(0),
  total_elapsed_seconds: int('total_elapsed_seconds').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
```

### 5.2 `quiz-answers.ts`

```ts
import { mysqlTable, int, mysqlEnum, text, boolean, timestamp, unique } from 'drizzle-orm/mysql-core';
import { quizAttempts } from './quiz-attempts';
import { questions } from './questions';

export const quizAnswers = mysqlTable('quiz_answers', {
  id: int('id').autoincrement().primaryKey(),
  attempt_id: int('attempt_id').notNull().references(() => quizAttempts.id),
  question_id: int('question_id').notNull().references(() => questions.id),
  question_type: mysqlEnum('question_type', ['single_choice', 'multiple_response', 'multiple_choice', 'true_false']).notNull(),
  selected_keys_json: text('selected_keys_json').notNull(),
  is_correct: boolean('is_correct'),
  score: int('score'),
  max_score: int('max_score'),
  elapsed_seconds: int('elapsed_seconds').notNull().default(0),
  answered_at: timestamp('answered_at').defaultNow().notNull(),
}, (table) => ({
  uniqueAttemptQuestion: unique('quiz_answers_attempt_id_question_id_unique').on(
    table.attempt_id,
    table.question_id,
  ),
}));
```

---

## 6. Migration

Setelah schema ditambah:

```bash
cd backend
bun run db:generate
```

Drizzle akan membuat migration baru, misalnya:

```txt
backend/drizzle/0003_<nama_otomatis>.sql
backend/drizzle/meta/0003_snapshot.json
backend/drizzle/meta/_journal.json
```

Semua file tersebut harus ikut di-commit.

---

## 7. Backend Service Baru

Tambah service:

```txt
backend/src/services/attempt-service.ts
```

### 7.1 Fungsi yang Dibutuhkan

```ts
createAttempt(db, data)
getAttemptById(db, attemptId)
getAttemptWithParticipant(db, attemptId, sessionToken)
saveAnswer(db, data)
recalculateAttemptSummary(db, attemptId)
finishAttempt(db, attemptId)
listAttemptsForParticipant(db, participantId)
```

### 7.2 `createAttempt`

Input:

```ts
{
  participant_id: number;
  topic_id: number;
  total_questions: number;
}
```

Output:

```ts
{ id, participant_id, topic_id, status, started_at }
```

### 7.3 `saveAnswer`

Input:

```ts
{
  attempt_id: number;
  question_id: number;
  question_type: QuestionType;
  selected_keys: string[];
  is_correct: boolean | null;
  score: number | null;
  max_score: number | null;
  elapsed_seconds: number;
}
```

Behavior:

- Insert ke `quiz_answers`
- Jika duplicate `attempt_id + question_id`, return error `answer_already_submitted`
- Setelah insert, panggil `recalculateAttemptSummary`

### 7.4 `recalculateAttemptSummary`

Query seluruh `quiz_answers` untuk attempt tersebut, lalu update `quiz_attempts`:

```txt
answered_questions
sum correct
sum incorrect
sum score
sum max_score
sum elapsed_seconds
updated_at
```

> Rekomendasi awal: pakai recalculation dari tabel answers agar aman dari double-counting.

---

## 8. Backend Routes Baru

Tambah file:

```txt
backend/src/routes/attempts.ts
```

Daftarkan di:

```txt
backend/src/app.ts
```

```ts
app.route('/api/attempts', attemptsRoutes(config.pool));
```

Jika auth aktif, tambahkan middleware:

```ts
app.use('/api/attempts', requireAuth);
```

---

### 8.1 `POST /api/attempts/start`

Membuat attempt baru untuk peserta saat sesi dimulai.

Request:

```json
{
  "topic_id": 1,
  "total_questions": 20
}
```

Backend mengambil participant berdasarkan session token dari cookie/header yang sudah digunakan route participant saat ini.

Response:

```json
{
  "attempt": {
    "id": 123,
    "topic_id": 1,
    "status": "in_progress",
    "started_at": "..."
  }
}
```

Error:

| Status | Error |
|---|---|
| 400 | `invalid_body` |
| 401 | `participant_required` |

---

### 8.2 `POST /api/attempts/:id/answers`

Menyimpan jawaban per soal.

Request:

```json
{
  "question_id": 10,
  "selected_keys": ["A"],
  "elapsed_seconds": 23
}
```

Backend:

1. Validasi attempt milik participant tersebut
2. Ambil soal berdasarkan `question_id`
3. Validasi selected keys
4. Hitung hasil memakai logic existing:
   - `checkAnswer()` untuk binary
   - `evaluateScoredAnswer()` untuk `multiple_choice`
5. Insert ke `quiz_answers`
6. Recalculate summary
7. Return hasil check seperti endpoint lama, plus metadata attempt

Response binary:

```json
{
  "correct": true,
  "correct_keys": ["B"],
  "explanation": "...",
  "attempt": {
    "id": 123,
    "answered_questions": 5,
    "total_correct": 4,
    "total_incorrect": 1
  }
}
```

Response scored:

```json
{
  "score": 2,
  "max_score": 4,
  "best_keys": ["B"],
  "explanation": "...",
  "attempt": {
    "id": 123,
    "answered_questions": 5,
    "total_score": 14,
    "max_score": 20
  }
}
```

Error:

| Status | Error |
|---|---|
| 400 | `invalid_body` |
| 403 | `attempt_not_owned` |
| 404 | `attempt_not_found` / `question_not_found` |
| 409 | `answer_already_submitted` |

---

### 8.3 `POST /api/attempts/:id/finish`

Menandai attempt selesai.

Request:

```json
{}
```

Response:

```json
{
  "attempt": {
    "id": 123,
    "status": "finished",
    "answered_questions": 20,
    "total_correct": 15,
    "total_incorrect": 5,
    "total_score": 32,
    "max_score": 40,
    "total_elapsed_seconds": 780,
    "finished_at": "..."
  }
}
```

---

### 8.4 `GET /api/attempts/:id`

Mengambil ringkasan attempt + jawaban.

Response:

```json
{
  "attempt": { ... },
  "answers": [
    {
      "question_id": 10,
      "question_type": "multiple_choice",
      "selected_keys": ["A"],
      "is_correct": null,
      "score": 2,
      "max_score": 4,
      "elapsed_seconds": 23,
      "answered_at": "..."
    }
  ]
}
```

---

### 8.5 `GET /api/attempts?participant=current`

Opsional untuk riwayat peserta.

Response:

```json
{
  "attempts": [
    {
      "id": 123,
      "topic_id": 1,
      "topic_label": "Penalaran Umum",
      "status": "finished",
      "total_score": 32,
      "max_score": 40,
      "finished_at": "..."
    }
  ]
}
```

---

## 9. Endpoint Lama `/api/questions/:id/check`

Ada dua opsi:

### Opsi A — Tetap Ada untuk Preview / Legacy

Endpoint lama tetap tidak menyimpan jawaban.

Kelebihan:

- Risiko kecil
- Test existing tidak banyak berubah
- Bisa dipakai untuk mode latihan tanpa simpan

Kekurangan:

- Ada dua jalur check jawaban

### Opsi B — Tambah optional `attempt_id`

Request lama bisa menerima:

```json
{
  "selected_keys": ["A"],
  "attempt_id": 123,
  "elapsed_seconds": 23
}
```

Jika `attempt_id` ada, backend menyimpan jawaban.

Kelebihan:

- Satu endpoint check

Kekurangan:

- Endpoint lama jadi lebih kompleks
- Risiko regressi lebih besar

### Rekomendasi

Gunakan **Opsi A**: buat endpoint baru `/api/attempts/:id/answers`, endpoint lama tetap untuk check non-persisten.

---

## 10. Frontend Changes

### 10.1 Types

Update:

```txt
frontend/src/types/index.ts
```

Tambah:

```ts
export interface QuizAttempt {
  id: number;
  topic_id: number;
  status: 'in_progress' | 'finished' | 'abandoned';
  answered_questions: number;
  total_correct: number;
  total_incorrect: number;
  total_score: number;
  max_score: number;
  total_elapsed_seconds: number;
  started_at: string;
  finished_at?: string | null;
}

export interface PersistedQuizAnswer {
  question_id: number;
  question_type: Question['type'];
  selected_keys: string[];
  is_correct: boolean | null;
  score: number | null;
  max_score: number | null;
  elapsed_seconds: number;
  answered_at: string;
}
```

---

### 10.2 API Client

Update:

```txt
frontend/src/api/client.ts
```

Tambah fungsi:

```ts
startAttempt(topicId: number, totalQuestions: number): Promise<QuizAttempt>
submitAttemptAnswer(attemptId: number, payload): Promise<CheckResult | CheckScoredResult>
finishAttempt(attemptId: number): Promise<QuizAttempt>
fetchAttempt(attemptId: number): Promise<{ attempt: QuizAttempt; answers: PersistedQuizAnswer[] }>
```

---

### 10.3 `useQuizSession.ts`

Tambah state:

```ts
const attempt = ref<QuizAttempt | null>(null);
```

Flow baru:

1. Saat `startQuiz()` pertama kali dipanggil:
   - panggil `startAttempt(topicId, questionCount)`
   - simpan `attempt.value`
2. Saat `submitAnswer()`:
   - panggil `submitAttemptAnswer(attempt.id, { question_id, selected_keys, elapsed_seconds })`
   - backend menghitung dan menyimpan
   - frontend tetap update `sessionResults` untuk UI langsung
3. Saat `finishSession()`:
   - panggil `finishAttempt(attempt.id)`
   - update resume dari response attempt final

---

### 10.4 Resume Akhir

Resume akhir tetap tampil seperti sekarang, tetapi sumber datanya idealnya dari `attempt` final:

```txt
Benar                -> attempt.total_correct
Salah                -> attempt.total_incorrect
Total Waktu          -> attempt.total_elapsed_seconds
Akurasi              -> total_correct / answered_questions
Total Skor           -> attempt.total_score
Skor Maksimal        -> attempt.max_score
Persentase Skor      -> total_score / max_score
```

Jika `finishAttempt()` gagal, fallback ke `sessionResults` lokal dan tampilkan error kecil:

```txt
Hasil lokal tampil, tetapi gagal menyimpan ke server.
```

---

## 11. Auth & Participant Ownership

Sebelum attempt dibuat, peserta harus sudah ada.

Existing participant flow:

```txt
POST /api/participant
GET /api/participant
```

Attempt harus dikaitkan dengan participant berdasarkan `session_token`.

### Ownership Rules

- Peserta hanya boleh membuat attempt untuk dirinya sendiri
- Peserta hanya boleh submit answer ke attempt miliknya
- Peserta hanya boleh melihat attempt miliknya

Jika tidak sesuai:

```json
{ "error": "attempt_not_owned" }
```

---

## 12. Testing Plan

### 12.1 Backend Unit Tests

Tambah test untuk:

```txt
attempt-service.test.ts
```

Coverage:

- create attempt
- save binary answer
- save scored answer
- reject duplicate answer
- recalculate summary
- finish attempt

### 12.2 Backend Route Tests

Tambah:

```txt
backend/src/__tests__/routes/attempts.test.ts
```

Coverage:

- `POST /attempts/start`
- `POST /attempts/:id/answers` binary
- `POST /attempts/:id/answers` scored
- duplicate answer → 409
- finish attempt
- get attempt summary

### 12.3 Frontend Tests

Update:

```txt
frontend/src/__tests__/composables/useQuizSession.test.ts
```

Coverage:

- start quiz creates attempt
- submit answer persists to API
- finish session calls finish endpoint
- fallback when save fails

---

## 13. Migration & Deployment

### 13.1 Generate Migration

```bash
cd backend
bun run db:generate
```

### 13.2 Local Validation

```bash
bun run typecheck
bun run test
bun run seed:check
```

### 13.3 VPS Deployment

Ikuti:

```txt
docs/DEPLOY/07-update-vps.md
```

Migration akan otomatis berjalan saat PM2 restart karena `backend/src/index.ts` memanggil `applyMigrations(pool)` saat startup.

---

## 14. Update Dokumentasi & Rules

### 14.1 `RULES.md`

Update section lama:

```md
### 3.2 Tidak Ada Riwayat / Skor Tersimpan
```

Menjadi:

```md
### 3.2 Riwayat dan Skor Tersimpan
Aplikasi menyimpan sesi pengerjaan (`quiz_attempts`) dan jawaban per soal (`quiz_answers`) untuk kebutuhan rekap hasil peserta. Logika scoring tetap berada di backend dan menggunakan fungsi scoring resmi.
```

### 14.2 Docs Format Soal

Tidak perlu perubahan besar, karena format soal tidak berubah.

### 14.3 Docs Arsitektur

Tambahkan tabel:

```txt
quiz_attempts
quiz_answers
```

---

## 15. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| Double submit jawaban | Unique constraint `attempt_id + question_id` |
| Frontend refresh di tengah sesi | Simpan `attempt_id` di sessionStorage, lalu fetch ulang attempt |
| Attempt tidak selesai | Status tetap `in_progress`; bisa diberi tombol lanjutkan atau auto-abandon |
| Score mismatch frontend/backend | Backend menjadi source of truth; frontend hanya render hasil response |
| Data peserta bocor | Ownership check berdasarkan session token |
| Migration gagal di VPS | Backup DB sebelum deploy; migration otomatis saat restart |

---

## 16. Implementasi Bertahap

### Tahap 1 — Backend Persistence

- Tambah schema `quiz_attempts`
- Tambah schema `quiz_answers`
- Generate migration
- Tambah `attempt-service`
- Tambah `attemptsRoutes`
- Tambah backend tests

### Tahap 2 — Frontend Integration

- Tambah API client attempts
- Update `useQuizSession`
- Update resume final dari persisted attempt
- Tambah frontend tests

### Tahap 3 — Recovery & History

- Simpan `attempt_id` di `sessionStorage`
- Resume attempt jika refresh
- Tambah halaman riwayat peserta jika dibutuhkan

---

## 17. Checklist File

| # | File | Perubahan |
|---|---|---|
| 1 | `backend/src/db/schema/quiz-attempts.ts` | Baru |
| 2 | `backend/src/db/schema/quiz-answers.ts` | Baru |
| 3 | `backend/src/db/schema/index.ts` | Export schema baru |
| 4 | `backend/drizzle/0003_*.sql` | Migration baru |
| 5 | `backend/drizzle/meta/_journal.json` | Auto update |
| 6 | `backend/drizzle/meta/0003_snapshot.json` | Auto update |
| 7 | `backend/src/services/attempt-service.ts` | Baru |
| 8 | `backend/src/routes/attempts.ts` | Baru |
| 9 | `backend/src/app.ts` | Register route `/api/attempts` |
| 10 | `backend/src/validators/attempt-validator.ts` | Baru |
| 11 | `backend/src/__tests__/routes/attempts.test.ts` | Baru |
| 12 | `backend/src/__tests__/services/attempt-service.test.ts` | Baru |
| 13 | `frontend/src/types/index.ts` | Tambah attempt types |
| 14 | `frontend/src/api/client.ts` | Tambah attempt API functions |
| 15 | `frontend/src/composables/useQuizSession.ts` | Integrasi persistence |
| 16 | `frontend/src/views/QuizView.vue` | Resume dari persisted attempt |
| 17 | `frontend/src/__tests__/composables/useQuizSession.test.ts` | Update tests |
| 18 | `RULES.md` | Update aturan persistence |
| 19 | `docs/ARSITEKTUR.md` | Tambah tabel baru |

---

## 18. Keputusan yang Perlu Dikonfirmasi Sebelum Implementasi

1. Apakah satu attempt selalu untuk **satu topik**, atau bisa lintas topik?
2. Apakah peserta boleh mengulang topik yang sama berkali-kali?
3. Jika user refresh di tengah sesi, apakah harus bisa lanjut attempt yang sama?
4. Apakah hasil akhir perlu bisa dilihat admin/owner?
5. Apakah jawaban benar (`correct_keys` / `best_keys`) perlu disimpan untuk audit, atau cukup hasil skor?
6. Apakah skor binary perlu disimpan sebagai `1/0`, atau cukup `is_correct` saja?

---

## 19. Rekomendasi Default

Jika tidak ada kebutuhan khusus, gunakan default berikut:

- Satu attempt = satu peserta + satu topik + satu sesi pengerjaan
- Peserta boleh mengulang topik berkali-kali
- Refresh tidak langsung didukung di tahap awal, tetapi `attempt_id` disiapkan agar bisa ditambah di tahap berikutnya
- Simpan jawaban peserta, skor, dan waktu; tidak perlu simpan `correct_keys`
- Endpoint lama `/api/questions/:id/check` tetap ada dan tidak persisten
- Endpoint baru `/api/attempts/:id/answers` menjadi jalur resmi untuk mode tes yang tersimpan
