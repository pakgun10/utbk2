# Implementation Plan: Tipe Soal `multiple_choice` (Skor Bertingkat)

> **Status:** Implemented ✅  
> **Prinsip utama:** tidak mengubah logika 3 tipe soal existing (`single_choice`, `multiple_response`, `true_false`)

---

## Ringkasan

Menambahkan tipe soal keempat: **`multiple_choice`** — pilihan ganda di mana setiap opsi jawaban memiliki **skor numerik berbeda** (bukan binary benar/salah). User memilih **satu** opsi dan mendapat skor sesuai opsi yang dipilih.

Pada frontend, **huruf opsi (A, B, C, D, E) tidak ditampilkan** untuk tipe ini — hanya teks opsi dan badge skor di mode review.

---

## 1. Database

### 1.1 Migration: generate dengan `drizzle-kit generate`

Migration **tidak ditulis manual**. Folder `backend/drizzle/` sudah menggunakan workflow `drizzle-kit` dengan journal + snapshot (`meta/_journal.json`, `meta/0000_snapshot.json`, dst). File SQL manual tanpa update journal tidak akan dikenali oleh `drizzle-kit migrate`.

**Langkah:**
1. Update Drizzle schema di `questions.ts` dan `question-options.ts` (section 1.2 & 1.3).
2. Jalankan `bunx drizzle-kit generate` — ini akan otomatis menghasilkan:
   - File SQL migration baru (nomor berikutnya: `0002_<nama_otomatis>.sql`)
   - Update `meta/_journal.json` dengan entry baru
   - Snapshot baru `meta/0002_snapshot.json`
3. Verifikasi isi file SQL yang ter-generate — seharusnya berisi:

```sql
-- Tambah nilai enum baru
ALTER TABLE `questions` MODIFY `type` enum('single_choice','multiple_response','multiple_choice','true_false') NOT NULL;

-- Tambah kolom skor per opsi (NULL untuk tipe soal lain)
ALTER TABLE `question_options` ADD `score` int;
```

> **Catatan:** Migration yang sudah ada adalah `0000_parallel_ares.sql` dan `0001_great_la_nuit.sql`. Migration berikutnya akan bernomor `0002`, **bukan** `0003`. Nomor dan nama file di-generate otomatis oleh drizzle-kit.

### 1.2 Drizzle Schema: `backend/src/db/schema/questions.ts`

```diff
  type: mysqlEnum('type', [
    'single_choice',
    'multiple_response',
+   'multiple_choice',
    'true_false',
  ]).notNull(),
```

### 1.3 Drizzle Schema: `backend/src/db/schema/question-options.ts`

```diff
  is_correct: boolean('is_correct').notNull(),
+ score: int('score'),
  display_order: int('display_order').notNull(),
```

---

## 2. Backend — Scoring Logic

### 2.1 `backend/src/lib/scoring.ts`

**Prinsip:** fungsi `checkAnswer()` existing **tidak disentuh sama sekali**. Tambah fungsi baru khusus `multiple_choice`.

```ts
// Tambah ke union type (tidak mengubah branch existing)
export type QuestionType = 'single_choice' | 'multiple_response' | 'multiple_choice' | 'true_false';

// Interface existing TETAP — tidak diubah
export interface CheckResult {
  correct: boolean;
  correct_keys: string[];
  explanation: string;
}

// Interface BARU — opsi dengan skor
export interface ScoredOption {
  key: string;
  score: number;
}

// Interface BARU untuk hasil skor
export interface ScoredResult {
  score: number;
  max_score: number;
  best_keys: string[];
}

// Fungsi BARU — khusus multiple_choice
export function evaluateScoredAnswer(
  selectedKeys: string[],
  scoredOptions: ScoredOption[],
): ScoredResult {
  // Guard: jika tidak ada opsi (data tidak valid)
  if (scoredOptions.length === 0) {
    return { score: 0, max_score: 0, best_keys: [] };
  }

  const maxScore = Math.max(...scoredOptions.map((o) => o.score));
  const bestKeys = scoredOptions
    .filter((o) => o.score === maxScore)
    .map((o) => o.key);

  // Single-select: ambil skor opsi yang dipilih
  const selected = selectedKeys[0] ?? '';
  const matched = scoredOptions.find((o) => o.key === selected);
  const score = matched ? matched.score : 0;

  return { score, max_score: maxScore, best_keys: bestKeys };
}
```

### 2.2 `backend/src/routes/questions.ts`

Di handler `POST /:id/check`, branch berdasarkan tipe soal.

**Penting:** `findQuestionAnswerKey()` (dipanggil di awal handler) hanya mengembalikan `{ key, is_correct }` — **tidak ada field `score`**. Untuk `multiple_choice`, harus memanggil `findQuestionScoredOptions()` secara terpisah untuk mendapatkan `{ key, score }`.

```ts
// ... setelah validasi selected_keys ...

if (question.type === 'multiple_choice') {
  // Query terpisah — ambil { key, score }, BUKAN dari `options` (yang hanya { key, is_correct })
  // Konversi null → 0 karena kolom score nullable
  const scoredOptions = (await findQuestionScoredOptions(db, id)).map((o) => ({
    key: o.key,
    score: o.score ?? 0,
  }));

  const scoredResult = evaluateScoredAnswer(parsed.data.selected_keys, scoredOptions);
  return c.json(mapCheckScoredResponse(question, scoredResult));
}

// Path existing — tidak berubah
const result = checkAnswer(question.type as QuestionType, parsed.data.selected_keys, options);
return c.json(mapCheckAnswerResponse(question, result));
```

> **Catatan:** Validasi `selectedKeys` (sebelum branch) tetap menggunakan `options` dari `findQuestionAnswerKey()` karena hanya butuh `option.key` — tidak perlu `score`.

### 2.3 `backend/src/services/question-service.ts`

Tambah fungsi:

```ts
export interface QuestionOptionKeyScore {
  key: string;
  score: number | null;
}

export async function findQuestionScoredOptions(
  db: QuestionsDb,
  questionId: number,
): Promise<QuestionOptionKeyScore[]> {
  return db
    .select({
      key: questionOptions.option_key,
      score: questionOptions.score,
    })
    .from(questionOptions)
    .where(eq(questionOptions.question_id, questionId));
}
```

> **Catatan:** `score` dari DB bisa `null` (kolom nullable). Di route handler (section 2.2), `evaluateScoredAnswer` menerima `ScoredOption[]` dengan `score: number`. Konversi `null` → `0` dilakukan saat mapping di route, atau ubah signature `evaluateScoredAnswer` untuk menerima `number | null`. Rekomendasi: konversi di route handler:
>
> ```ts
> const scoredOptions = (await findQuestionScoredOptions(db, id)).map((o) => ({
>   key: o.key,
>   score: o.score ?? 0,
> }));
> ```

Route handler juga perlu import `findQuestionScoredOptions` dan `mapCheckScoredResponse`. Lihat diff import:

```diff
 import {
   mapCheckAnswerResponse,
   mapEmptyRandomQuestionResponse,
   mapRandomQuestionResponse,
+  mapCheckScoredResponse,
 } from '../mappers/question-response';
 import {
   countQuestionsForTopic,
   createQuestionsDb,
   findQuestionAnswerKey,
   findQuestionById,
   findQuestionOptions,
   findRandomQuestion,
+  findQuestionScoredOptions,
 } from '../services/question-service';
```

### 2.4 `backend/src/mappers/question-response.ts`

Tambah mapper untuk respons skor:

```ts
export function mapCheckScoredResponse(
  question: CheckQuestionRow,
  result: { score: number; max_score: number; best_keys: string[] },
) {
  return {
    score: result.score,
    max_score: result.max_score,
    best_keys: result.best_keys,
    explanation: question.explanation_text,
  };
}
```

Mapper existing `mapCheckAnswerResponse()` **tidak diubah**.

### 2.5 `backend/src/validators/question-validator.ts`

Tambahkan validasi untuk `multiple_choice` di `validateSelectedKeys()`:

```ts
// Di akhir fungsi, sebelum return null:
if (questionType === 'multiple_choice' && selectedKeys.length !== 1) {
  return 'Tipe soal ini hanya menerima satu jawaban.';
}
```

Branch `single_choice` / `true_false` existing **tidak diubah**.

---

## 3. Backend — Seed & Validasi

### 3.1 `backend/src/lib/seed.ts`

**a) Zod schema — tambah enum + field score:**

```diff
const optionSchema = z.object({
  key: z.string().min(1),
  text: z.string().min(1),
  is_correct: z.boolean(),
+ score: z.number().int().optional(),
});

const questionSchema = z.object({
  // ...
- type: z.enum(['single_choice', 'multiple_response', 'true_false']),
+ type: z.enum(['single_choice', 'multiple_response', 'multiple_choice', 'true_false']),
  // ...
});
```

**b) `superRefine` — tambah validasi untuk `multiple_choice`:**

```ts
if (question.type === 'multiple_choice') {
  // 1. Minimal 2 opsi
  if (question.options.length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Soal multiple_choice harus memiliki minimal dua opsi.',
      path: ['questions', index, 'options'],
    });
  }

  // 2. Setiap opsi wajib punya score
  const missingScore = question.options.some((opt) => opt.score === undefined);
  if (missingScore) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Setiap opsi pada soal multiple_choice wajib memiliki field score.',
      path: ['questions', index, 'options'],
    });
  }

  // 3. Minimal satu opsi dengan score > 0 (ada "jawaban terbaik")
  if (!missingScore) {
    const hasPositive = question.options.some((opt) => (opt.score ?? 0) > 0);
    if (!hasPositive) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Soal multiple_choice harus memiliki minimal satu opsi dengan score > 0.',
        path: ['questions', index, 'options'],
      });
    }
  }

  // 4. is_correct harus false untuk semua opsi (tidak relevan untuk tipe ini)
  const hasCorrectTrue = question.options.some((opt) => opt.is_correct);
  if (hasCorrectTrue) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Soal multiple_choice tidak boleh memiliki opsi dengan is_correct true. Gunakan field score.',
      path: ['questions', index, 'options'],
    });
  }
}
```

**c) Insert — sisipkan `score`:**

```diff
await db.insert(questionOptions).values({
  question_id: questionId,
  option_key: opt.key,
  option_text: opt.text,
  is_correct: opt.is_correct,
+ score: opt.score ?? null,
  display_order: i + 1,
});
```

### 3.2 `backend/src/__tests__/lib/seed.test.ts`

Tambah test case:
- `multiple_choice` valid dengan skor berbeda-beda → sukses
- `multiple_choice` tanpa `score` → gagal
- `multiple_choice` semua skor ≤ 0 → gagal
- `multiple_choice` dengan 1 opsi → gagal
- `multiple_choice` dengan `is_correct: true` → gagal
- `multiple_choice` dengan duplikat key → gagal (existing test sudah cover via unique keys)

---

## 4. Backend — Tests

### 4.1 `backend/src/__tests__/lib/scoring.test.ts`

Tambah test untuk `evaluateScoredAnswer()`:

```ts
describe('evaluateScoredAnswer', () => {
  const scoredOptions = [
    { key: 'A', score: 2 },
    { key: 'B', score: 4 },
    { key: 'C', score: 1 },
    { key: 'D', score: -1 },
  ];

  it('returns full score and best key when selecting best option', () => {
    const result = evaluateScoredAnswer(['B'], scoredOptions);
    expect(result.score).toBe(4);
    expect(result.max_score).toBe(4);
    expect(result.best_keys).toEqual(['B']);
  });

  it('returns partial score for non-best option', () => {
    const result = evaluateScoredAnswer(['A'], scoredOptions);
    expect(result.score).toBe(2);
    expect(result.max_score).toBe(4);
    expect(result.best_keys).toEqual(['B']);
  });

  it('returns negative score for negative option', () => {
    const result = evaluateScoredAnswer(['D'], scoredOptions);
    expect(result.score).toBe(-1);
  });

  it('returns 0 for unmatched key', () => {
    const result = evaluateScoredAnswer(['X'], scoredOptions);
    expect(result.score).toBe(0);
  });

  it('returns all best keys when multiple have same max score', () => {
    const options = [
      { key: 'A', score: 4 },
      { key: 'B', score: 4 },
      { key: 'C', score: 2 },
    ];
    const result = evaluateScoredAnswer(['A'], options);
    expect(result.best_keys).toEqual(['A', 'B']);
  });
});
```

Test existing untuk `checkAnswer` **tidak diubah**.

### 4.2 `backend/src/__tests__/routes/questions.test.ts`

Tambah test case: `POST /questions/:id/check` dengan soal `multiple_choice` → respons mengandung `score`, `max_score`, `best_keys` (bukan `correct`, `correct_keys`).

---

## 5. Frontend — Types

### 5.1 `frontend/src/types/index.ts`

```diff
export interface QuestionOption {
  key: string;
  text: string;
+ score?: number;
}

export interface Question {
  id: number;
- type: 'single_choice' | 'multiple_response' | 'true_false';
+ type: 'single_choice' | 'multiple_response' | 'multiple_choice' | 'true_false';
  difficulty: 'easy' | 'medium' | 'hard';
  question_text: string;
  options: QuestionOption[];
}

// TETAP — untuk tipe binary
export interface CheckResult {
  correct: boolean;
  correct_keys: string[];
  explanation: string;
}

+ // BARU — untuk tipe scored
+ export interface CheckScoredResult {
+   score: number;
+   max_score: number;
+   best_keys: string[];
+   explanation: string;
+ }
```

---

## 6. Frontend — Components

### 6.1 `QuestionCard.vue`

Tambah label untuk tipe baru:

```diff
const typeLabel = computed(() => {
  switch (props.type) {
    case 'single_choice': return 'Pilihan Ganda';
    case 'multiple_response': return 'Pilihan Ganda Kompleks';
+   case 'multiple_choice': return 'Skor Bertingkat';
    case 'true_false': return 'Benar - Salah';
    default: return props.type;
  }
});
```

### 6.2 `OptionList.vue`

**Perubahan 1:** Sembunyikan huruf opsi untuk `multiple_choice`.

```diff
- <span class="option-key">{{ option.key }}</span>
+ <span v-if="type !== 'multiple_choice'" class="option-key">{{ option.key }}</span>
  <span class="option-text">{{ option.text }}</span>
```

**Perubahan 2:** Tambah badge skor di mode review untuk `multiple_choice`.

```html
<span
  v-if="type === 'multiple_choice' && showResult && option.score !== undefined"
  class="option-score-badge"
  :class="{
    'score-positive': (option.score ?? 0) > 0,
    'score-negative': (option.score ?? 0) < 0,
    'score-zero': (option.score ?? 0) === 0,
  }"
>
  {{ (option.score ?? 0) > 0 ? '+' : '' }}{{ option.score }}
</span>
```

**Perubahan 3:** Highlight berdasarkan skor (bukan binary correct/wrong):

```ts
// Tambah computed
const bestKeys = computed(() => props.bestKeys ?? []);

// Modifikasi isCorrectKey — untuk multiple_choice, best_keys bukan correct_keys
function isBestKey(key: string): boolean {
  return bestKeys.value.includes(key);
}
```

Template class binding untuk `multiple_choice`:
```html
:class="{
  'option-selected': isSelected(option.key),
  'option-best': showResult && type === 'multiple_choice' && isBestKey(option.key),
  'option-wrong': showResult && type === 'multiple_choice' && isSelected(option.key) && (option.score ?? 0) < 0,
  'option-disabled': disabled,
}"
```

**Perubahan 4:** Props tambahan:

```diff
const props = defineProps<{
  options: QuestionOption[];
  type: string;
  selectedKeys: string[];
  disabled: boolean;
  correctKeys?: string[];
+ bestKeys?: string[];
  showResult?: boolean;
}>();
```

**Perubahan 5:** `isMulti` computed — `multiple_choice` adalah single-select (radio):

```diff
- const isMulti = computed(() => props.type === 'multiple_response');
+ const isMulti = computed(() => props.type === 'multiple_response');
+ // multiple_choice tetap pakai radio (single-select)
```

> `multiple_choice` tidak perlu ditambah ke `isMulti` karena ia single-select seperti `single_choice`.

**Style tambahan:**

```css
.option-score-badge {
  margin-left: auto;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 2px 8px;
  border-radius: 6px;
}

.score-positive {
  color: #2f855a;
  background: #e6ffe6;
}

.score-negative {
  color: #c53030;
  background: #ffe6e6;
}

.score-zero {
  color: #778899;
  background: #f0f0f0;
}

.option-best {
  border-color: #2f855a;
  background: #e6ffe6;
}
```

### 6.3 `ExplanationPanel.vue`

**Desain:** komponen dibuat **polymorphic** — jika `score !== undefined`, tampilkan header skor; jika tidak, tampilkan header benar/salah (existing).

```html
<template>
  <div
    class="explanation-panel"
    :class="{
      correct: isCorrect && score === undefined,
      incorrect: !isCorrect && score === undefined,
      scored: score !== undefined,
    }"
  >
    <div class="explanation-header">
      <!-- Binary: Benar / Salah -->
      <span v-if="score === undefined && isCorrect" class="explanation-status correct-status">&#10003; Benar</span>
      <span v-else-if="score === undefined && !isCorrect" class="explanation-status incorrect-status">&#10007; Salah</span>

      <!-- Scored: Skor -->
      <span v-else class="explanation-status scored-status">
        Skor: {{ score }} / {{ maxScore }}
      </span>

      <span class="explanation-time">{{ formattedTime }}</span>
    </div>

    <!-- Jawaban benar / terbaik -->
    <div class="explanation-answer">
      <strong>{{ score === undefined ? 'Jawaban benar:' : 'Jawaban terbaik:' }}</strong>
      <span class="correct-keys">{{ score === undefined ? correctKeysDisplay : bestKeysDisplay }}</span>
    </div>

    <div class="explanation-body">
      <strong>Pembahasan:</strong>
      <p>{{ explanation }}</p>
    </div>

    <button v-if="is_last" class="explanation-next" @click="$emit('finish')">Lihat Hasil</button>
    <button v-else class="explanation-next" @click="$emit('next')">Soal Berikutnya</button>
  </div>
</template>
```

Props:

```ts
const props = defineProps<{
  correct: boolean;
  correct_keys: string[];
  explanation: string;
  elapsed_seconds: number;
  is_last?: boolean;
  // BARU — opsional, hanya untuk multiple_choice
  score?: number;
  maxScore?: number;
  bestKeys?: string[];
}>();
```

Computed tambahan:

```ts
const bestKeysDisplay = computed(() => (props.bestKeys ?? []).join(', '));
```

Style tambahan:

```css
.explanation-panel.scored {
  border-left-color: #1e40af; /* biru — bukan hijau/merah */
}

.scored-status {
  color: #1e40af;
}
```

### 6.4 `QuizView.vue`

**a)** Props ke `ExplanationPanel` dibranch berdasarkan apakah result adalah scored atau binary:

```html
<!-- Saat ini: -->
<ExplanationPanel
  v-if="state === 'reviewing' && result"
  :correct="result.correct"
  :correct_keys="result.correct_keys"
  :explanation="result.explanation"
  :elapsed_seconds="finalTime"
  :is_last="isLastQuestion"
  @next="nextQuestion"
  @finish="finishSession"
/>

<!-- Menjadi: -->
<ExplanationPanel
  v-if="state === 'reviewing' && (binaryResult || scoredResult)"
  :correct="binaryResult?.correct ?? false"
  :correct_keys="binaryResult?.correct_keys ?? []"
  :explanation="(binaryResult ?? scoredResult)!.explanation"
  :elapsed_seconds="finalTime"
  :is_last="isLastQuestion"
  :score="scoredResult?.score"
  :max-score="scoredResult?.max_score"
  :best-keys="scoredResult?.best_keys"
  @next="nextQuestion"
  @finish="finishSession"
/>
```

Atau lebih baik: gunakan computed yang mengekstrak nilai:

```ts
const binaryResult = computed(() =>
  result.value && 'correct' in result.value ? result.value : null
);
const scoredResult = computed(() =>
  result.value && 'score' in result.value ? result.value : null
);
```

**b)** Props ke `OptionList` — tambah `bestKeys`:

```html
<OptionList
  :options="question.options"
  :type="question.type"
  :selected-keys="selectedKeys"
  :disabled="state !== 'answering'"
  :correct-keys="binaryResult?.correct_keys"
  :best-keys="scoredResult?.best_keys"
  :show-result="state === 'reviewing'"
  @update:selected-keys="onSelectKeys"
/>
```

**c)** Halaman Resume — tambah baris statistik skor (jika ada soal `multiple_choice`):

```html
<div v-if="totalScoredQuestions > 0" class="resume-stats resume-stats-scored">
  <div class="resume-stat">
    <span class="resume-value scored-total">{{ totalScore }}</span>
    <span class="resume-label">Total Skor</span>
  </div>
  <div class="resume-stat">
    <span class="resume-value">{{ maxPossibleScore }}</span>
    <span class="resume-label">Skor Maksimal</span>
  </div>
  <div class="resume-stat">
    <span class="resume-value">{{ scorePercentage }}%</span>
    <span class="resume-label">Persentase Skor</span>
  </div>
</div>
```

---

## 7. Frontend — State Management

### 7.1 `frontend/src/composables/useQuizSession.ts`

**a) Type result:**

```ts
import type { CheckResult, CheckScoredResult } from '@/types';

// ...

const result = ref<CheckResult | CheckScoredResult | null>(null);
```

**b) Session tracking — tambah skor:**

```diff
interface SessionResult {
- correct: boolean;
+ correct?: boolean;
+ score?: number;
+ maxScore?: number;
  elapsed: number;
}
```

**c) `submitAnswer()` — simpan hasil sesuai tipe:**

```ts
async function submitAnswer() {
  if (!question.value || selectedKeys.value.length === 0) return;
  timerRunning.value = false;

  try {
    const checkResult = await apiCheckAnswer(question.value.id, selectedKeys.value);
    result.value = checkResult;
    answeredIds.value.add(question.value.id);

    if ('correct' in checkResult) {
      sessionResults.value.push({ correct: checkResult.correct, elapsed: finalTime.value });
    } else {
      sessionResults.value.push({
        score: checkResult.score,
        maxScore: checkResult.max_score,
        elapsed: finalTime.value,
      });
    }

    state.value = 'reviewing';
  } catch (error) {
    // ...
  }
}
```

**d) Computed — pisahkan binary vs scored:**

```diff
- const correctCount = computed(() => sessionResults.value.filter((e) => e.correct).length);
+ const correctCount = computed(() => sessionResults.value.filter((e) => e.correct === true).length);

- const incorrectCount = computed(() => sessionResults.value.filter((e) => !e.correct).length);
+ const incorrectCount = computed(() => sessionResults.value.filter((e) => e.correct === false).length);
```

> Karena `correct` sekarang optional (`undefined` untuk soal scored), filter eksplisit `=== true` / `=== false`.

**e) Computed baru untuk skor:**

```ts
const totalScore = computed(() =>
  sessionResults.value.reduce((sum, e) => sum + (e.score ?? 0), 0)
);

const maxPossibleScore = computed(() =>
  sessionResults.value.reduce((sum, e) => sum + (e.maxScore ?? 0), 0)
);

const totalScoredQuestions = computed(() =>
  sessionResults.value.filter((e) => e.score !== undefined).length
);

const scorePercentage = computed(() => {
  if (maxPossibleScore.value === 0) return 0;
  return Math.round((totalScore.value / maxPossibleScore.value) * 100);
});
```

**f) Return statement — expose computed baru:**

```diff
  return {
    // ... existing ...
+   totalScore,
+   maxPossibleScore,
+   totalScoredQuestions,
+   scorePercentage,
+   binaryResult,     // computed: CheckResult | null
+   scoredResult,     // computed: CheckScoredResult | null
  };
```

---

## 8. Frontend — API Layer

### 8.1 `frontend/src/api/client.ts`

```diff
import type { Subject, Topic, Question, CheckResult, CheckScoredResult } from '@/types';

- export async function checkAnswer(questionId: number, selectedKeys: string[]): Promise<CheckResult> {
+ export async function checkAnswer(questionId: number, selectedKeys: string[]): Promise<CheckResult | CheckScoredResult> {
    return request<CheckResult | CheckScoredResult>(`/questions/${questionId}/check`, {
      method: 'POST',
      body: JSON.stringify({ selected_keys: selectedKeys }),
    });
  }
```

> Return type menjadi union. Frontend mendiskriminasi lewat `'correct' in result` vs `'score' in result`.

---

## 9. Dokumentasi

### 9.1 `docs/FORMAT-SOAL/02-tipe-soal.md`

Tambah section **Multiple Choice — Skor Bertingkat**:

````markdown
## Multiple Choice — Skor Bertingkat

Satu jawaban dipilih dari beberapa opsi. Setiap opsi memiliki skor numerik berbeda.
Cocok untuk soal dengan gradasi kebenaran (jawaban terbaik, setengah benar, salah).

```json
{
  "topic_slug": "penalaran-umum",
  "type": "multiple_choice",
  "difficulty": "hard",
  "question_text": "Manakah strategi yang PALING efektif untuk meningkatkan daya ingat jangka panjang?",
  "explanation_text": "Spaced repetition melibatkan pengulangan materi dalam interval yang semakin panjang, yang terbukti paling efektif berdasarkan kurva lupa Ebbinghaus. Strategi lain memiliki efektivitas lebih rendah atau hanya melengkapi.",
  "options": [
    { "key": "A", "text": "Spaced repetition (pengulangan terjadwal)", "is_correct": false, "score": 4 },
    { "key": "B", "text": "Menghafal satu kali dalam durasi panjang", "is_correct": false, "score": 1 },
    { "key": "C", "text": "Membaca berulang tanpa jeda", "is_correct": false, "score": 0 },
    { "key": "D", "text": "Menunda belajar hingga mendekati ujian", "is_correct": false, "score": -1 }
  ]
}
```

**Aturan:**
- User memilih **satu** opsi
- Skor user = skor opsi yang dipilih
- `best_keys` = opsi dengan skor tertinggi (jawaban terbaik)
- `max_score` = skor tertinggi di antara semua opsi
- Semua `is_correct` diisi `false` (tidak relevan untuk tipe ini)
- Setiap opsi **wajib** memiliki field `score` (integer, bisa negatif)
- Minimal 2 opsi, minimal satu opsi dengan `score > 0`
````

### 9.2 `docs/FORMAT-SOAL/01-struktur-data.md`

Update tabel Options:

```diff
| `key` | string | Ya | `A`, `B`, `C`, `D`. Untuk `true_false`: `true` / `false` |
| `text` | string | Ya | Teks opsi. |
| `is_correct` | boolean | Ya | `true` jika ini kunci jawaban. |
+ | `score` | number | Khusus `multiple_choice` | Skor jika opsi ini dipilih. Bisa negatif. |
```

### 9.3 `docs/ARSITEKTUR.md`

Update tabel `questions` — kolom `type`:

```diff
- | type | enum | `single_choice`, `multiple_response`, `true_false` |
+ | type | enum | `single_choice`, `multiple_response`, `multiple_choice`, `true_false` |
```

---

## 10. Daftar File — Checklist Implementasi

| # | File | Jenis Perubahan |
|---|---|---|
| **DB** |||
| 1 | `backend/drizzle/0002_*.sql` + `meta/_journal.json` + `meta/0002_snapshot.json` | **GENERATE** via `drizzle-kit generate` (setelah update schema #2 & #3) |
| 2 | `backend/src/db/schema/questions.ts` | tambah `'multiple_choice'` ke enum |
| 3 | `backend/src/db/schema/question-options.ts` | tambah kolom `score` |
| **Backend — Core** |||
| 4 | `backend/src/lib/scoring.ts` | tambah `QuestionType`, `ScoredResult`, `ScoredOption`, `evaluateScoredAnswer()` |
| 5 | `backend/src/routes/questions.ts` | branch `multiple_choice` di handler `/check` + import `findQuestionScoredOptions` & `mapCheckScoredResponse` |
| 6 | `backend/src/services/question-service.ts` | tambah `findQuestionScoredOptions()` |
| 7 | `backend/src/mappers/question-response.ts` | tambah `mapCheckScoredResponse()` |
| 8 | `backend/src/validators/question-validator.ts` | validasi `multiple_choice` (1 jawaban) |
| **Backend — Seed** |||
| 9 | `backend/src/lib/seed.ts` | tambah enum zod, `score` optional, validasi `superRefine`, insert `score` |
| **Backend — Tests** |||
| 10 | `backend/src/__tests__/lib/scoring.test.ts` | test `evaluateScoredAnswer()` |
| 11 | `backend/src/__tests__/lib/seed.test.ts` | test validasi seed `multiple_choice` |
| 12 | `backend/src/__tests__/routes/questions.test.ts` | test endpoint `/check` untuk `multiple_choice` |
| **Frontend — Types** |||
| 13 | `frontend/src/types/index.ts` | `QuestionOption.score?`, `CheckScoredResult`, union type |
| **Frontend — Components** |||
| 14 | `frontend/src/components/QuestionCard.vue` | `typeLabel` + `'multiple_choice'` |
| 15 | `frontend/src/components/OptionList.vue` | sembunyikan key, badge skor, highlight best, props `bestKeys` |
| 16 | `frontend/src/components/ExplanationPanel.vue` | polymorphic: header skor vs binary |
| 17 | `frontend/src/views/QuizView.vue` | props ke ExplanationPanel, OptionList; resume scored stats |
| **Frontend — State & API** |||
| 18 | `frontend/src/composables/useQuizSession.ts` | `SessionResult` optional fields, computed skor, discriminated result |
| 19 | `frontend/src/api/client.ts` | return type union `CheckResult \| CheckScoredResult` |
| **Dokumentasi** |||
| 20 | `docs/FORMAT-SOAL/02-tipe-soal.md` | contoh soal `multiple_choice` |
| 21 | `docs/FORMAT-SOAL/01-struktur-data.md` | tambah `score` di tabel opsi |
| 22 | `docs/ARSITEKTUR.md` | update enum `type` |

---

## 11. Urutan Implementasi (Rekomendasi)

1. **Drizzle schema** — update `questions.ts` dan `question-options.ts` (section 1.2 & 1.3)
2. **Migration** — jalankan `bunx drizzle-kit generate` untuk menghasilkan file SQL + journal + snapshot (section 1.1)
3. **Scoring function** — `evaluateScoredAnswer()` + test
4. **Service + Mapper + Route** — agar endpoint `/check` bisa menerima `multiple_choice` (section 2.2–2.4)
5. **Validator** — validasi input (section 2.5)
6. **Seed** — validasi + insert `score` (section 3.1)
7. **Route test** — memastikan response format benar (section 4.2)
8. **Frontend types** — fondasi type-safe (section 5.1)
9. **OptionList** — perubahan visual terbesar (sembunyikan key + badge skor) (section 6.2)
10. **ExplanationPanel** — polymorphic header (section 6.3)
11. **QuizView + useQuizSession** — wiring result ke UI + resume stats (section 6.4 & 7.1)
12. **QuestionCard** — label tipe baru (section 6.1)
13. **API client** — union return type (section 8.1)
14. **Dokumentasi** — update semua docs (section 9)

---

## 12. Yang Tidak Berubah

| Komponen | Keterangan |
|---|---|
| `single_choice` | Logika binary, tampilan, seed validation — **100% tidak disentuh** |
| `multiple_response` | All-or-nothing, tampilan checkbox — **100% tidak disentuh** |
| `true_false` | Binary true/false — **100% tidak disentuh** |
| `checkAnswer()` | Fungsi dan return type `CheckResult` — **tidak diubah** |
| `mapCheckAnswerResponse()` | Mapper existing — **tidak diubah** |
| Resume binary stats | `correctCount`, `incorrectCount`, `accuracy` tetap berfungsi untuk soal binary |
