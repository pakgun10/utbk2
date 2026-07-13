# Contoh Per Tipe Soal

## Single Choice (Pilihan Ganda)

Satu jawaban benar dari beberapa opsi.

```json
{
  "topic_slug": "aljabar",
  "type": "single_choice",
  "difficulty": "easy",
  "external_id": "q_aljabar_001",
  "question_text": "Hasil dari 2x + 5 = 13, maka nilai x adalah...",
  "explanation_text": "2x + 5 = 13 → 2x = 8 → x = 4",
  "options": [
    { "key": "A", "text": "3", "is_correct": false },
    { "key": "B", "text": "4", "is_correct": true },
    { "key": "C", "text": "5", "is_correct": false },
    { "key": "D", "text": "6", "is_correct": false }
  ]
}
```

**Aturan:** tepat satu opsi `is_correct: true`.

---

## Multiple Response (Pilihan Ganda Kompleks)

Lebih dari satu jawaban benar. Penilaian all-or-nothing.

```json
{
  "topic_slug": "penalaran-umum",
  "type": "multiple_response",
  "difficulty": "hard",
  "question_text": "Manakah pernyataan berikut yang termasuk silogisme?",
  "explanation_text": "Silogisme memiliki premis umum dan khusus yang menghasilkan kesimpulan. Pernyataan 1 dan 3 memenuhi.",
  "options": [
    { "key": "A", "text": "Semua manusia akan mati. Socrates adalah manusia. Jadi Socrates akan mati.", "is_correct": true },
    { "key": "B", "text": "Jika hujan turun, tanah basah. Tanah basah, jadi hujan turun.", "is_correct": false },
    { "key": "C", "text": "Semua mamalia bernapas dengan paru-paru. Paus adalah mamalia. Jadi paus bernapas dengan paru-paru.", "is_correct": true },
    { "key": "D", "text": "Sebagian besar siswa suka matematika. Andi adalah siswa. Jadi Andi suka matematika.", "is_correct": false }
  ]
}
```

**Aturan:**
- Minimal 2 opsi `is_correct: true`
- User harus centang **semua** yang benar — kurang atau lebih dianggap salah

---

## True/False (Benar-Salah)

Pernyataan yang dinilai benar atau salah.

```json
{
  "topic_slug": "geometri",
  "type": "true_false",
  "difficulty": "medium",
  "question_text": "Sebuah lingkaran dengan jari-jari 7 cm memiliki luas 154 cm persegi.",
  "explanation_text": "Luas = πr² = 22/7 × 49 = 22 × 7 = 154 cm². Pernyataan BENAR.",
  "options": [
    { "key": "true", "text": "Benar", "is_correct": true },
    { "key": "false", "text": "Salah", "is_correct": false }
  ]
}
```

**Aturan:** tepat 2 opsi: `key: "true"` dan `key: "false"`. Salah satu `is_correct: true`.

---

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
