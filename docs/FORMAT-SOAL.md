# Panduan Memasukkan Soal

Soal dimasukkan melalui file `seed.json` di root project.

Workflow resminya:

```bash
bun run seed:check
bun run seed
```

Penting:

- `seed:check` memvalidasi struktur JSON dan aturan domain soal
- `seed` saat ini paling aman dipakai untuk **menambah data baru**
- `seed` **bukan** mekanisme upsert penuh untuk edit/hapus data yang sudah pernah masuk ke database

Jangan berasumsi bahwa mengubah isi `seed.json` otomatis mengubah data lama di database.

---

## 1. Struktur Utama

File `seed.json` memiliki tiga bagian wajib:

```json
{
  "subjects": [ ... ],
  "topics": [ ... ],
  "questions": [ ... ]
}
```

Tiga array ini tetap wajib ada walaupun salah satunya kosong.

---

## 2. Subjects — Mata Uji

Setiap subject adalah mata uji UTBK.

```json
{
  "slug": "tps",
  "label": "TPS",
  "display_order": 1
}
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `slug` | string | Ya | ID unik. Gunakan huruf kecil + strip. Contoh: `tps`, `literasi-bahasa-indonesia`. Tidak boleh duplikat. |
| `label` | string | Ya | Nama tampilan. Contoh: `"TPS"`, `"Penalaran Matematika"` |
| `display_order` | number | Ya | Urutan tampil di halaman utama. `1` = paling atas. |

Subject yang sudah ada (default):

```json
{ "slug": "tps",                            "label": "TPS",                         "display_order": 1 },
{ "slug": "literasi-bahasa-indonesia",      "label": "Literasi Bahasa Indonesia",   "display_order": 2 },
{ "slug": "literasi-bahasa-inggris",        "label": "Literasi Bahasa Inggris",     "display_order": 3 },
{ "slug": "penalaran-matematika",           "label": "Penalaran Matematika",        "display_order": 4 }
```

Catatan penting:

- `slug` harus dianggap **tetap** setelah data pernah di-seed
- Mengganti `slug` subject bukan rename, tetapi berpotensi membuat subject baru
- Subject yang dihapus dari `seed.json` tidak otomatis terhapus dari database

---

## 3. Topics — Topik

Setiap topic berada di bawah satu subject.

```json
{
  "slug": "penalaran-umum",
  "subject_slug": "tps",
  "label": "Penalaran Umum",
  "display_order": 1
}
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `slug` | string | Ya | ID unik global. Huruf kecil + strip. Tidak boleh duplikat. |
| `subject_slug` | string | Ya | Harus merujuk ke salah satu `slug` subject yang ada. |
| `label` | string | Ya | Nama tampilan. |
| `display_order` | number | Ya | Urutan tampil dalam subject. |

Contoh tambahan jika ingin menambah topic baru:

```json
{ "slug": "geometri", "subject_slug": "penalaran-matematika", "label": "Geometri", "display_order": 2 }
```

Catatan penting:

- `slug` topic juga harus dianggap **tetap**
- Mengganti `slug` topic setelah data lama masuk bukan rename aman
- Topic yang dihapus dari `seed.json` tidak otomatis terhapus dari database

---

## 4. Questions — Soal

### 4.1 Struktur Soal

```json
{
  "topic_slug": "penalaran-umum",
  "type": "single_choice",
  "difficulty": "medium",
  "question_text": "Isi soal...",
  "explanation_text": "Pembahasan...",
  "options": [ ... ]
}
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `topic_slug` | string | Ya | Merujuk ke `slug` topic yang sudah ada. |
| `type` | string | Ya | `single_choice` / `multiple_response` / `true_false` |
| `difficulty` | string | Ya | `easy` / `medium` / `hard` |
| `question_text` | string | Ya | Isi soal. Teks bebas, bisa multi-baris. |
| `explanation_text` | string | Ya | Pembahasan lengkap. Wajib diisi walau singkat. |
| `options` | array | Ya | Array opsi jawaban. |

Catatan penting:

- Deteksi duplikasi soal saat ini berbasis `question_text`
- `question_text` yang identik akan dianggap soal yang sama, walaupun topiknya berbeda
- Perubahan `question_text`, `explanation_text`, atau `options` pada soal lama tidak dijamin meng-update data yang sudah ada

### 4.2 Options — Opsi Jawaban

```json
{ "key": "A", "text": "Pilihan A", "is_correct": false }
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `key` | string | Ya | Huruf/identitas opsi. `A`, `B`, `C`, `D`. Untuk `true_false`: `true` / `false` |
| `text` | string | Ya | Teks opsi jawaban. |
| `is_correct` | boolean | Ya | `true` jika ini kunci jawaban. |

---

## 5. Contoh Per Tipe Soal

### 5.1 Single Choice (Pilihan Ganda)

Satu jawaban benar dari beberapa opsi.

```json
{
  "topic_slug": "aljabar",
  "type": "single_choice",
  "difficulty": "easy",
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

**Aturan:** tepat satu opsi harus `is_correct: true`.

### 5.2 Multiple Response (Pilihan Ganda Kompleks)

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
- Minimal 2 opsi harus `is_correct: true`
- User harus mencentang SEMUA yang benar, tidak boleh kurang dan tidak boleh lebih
- Jika ada 3 benar dan user hanya centang 2 → **salah**

### 5.3 True/False (Benar-Salah)

Pernyataan yang harus dinilai benar atau salah.

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

**Aturan:** wajib ada tepat 2 opsi: `key: "true"` dan `key: "false"`. Salah satu harus `is_correct: true`.

---

## 6. Tambah, Edit, Rename, Hapus

Bagian ini penting untuk maintenance bank soal.

| Operasi | Aman lewat `seed.json`? | Catatan |
|---|---|---|
| Tambah subject baru | Ya | Aman, lalu jalankan `seed:check` dan `seed` |
| Tambah topic baru | Ya | Aman jika `subject_slug` valid |
| Tambah soal baru | Ya | Aman jika `question_text` belum dipakai |
| Edit label subject/topic | Tidak dijamin | Implementasi saat ini tidak melakukan update row lama |
| Edit isi soal/pembahasan/opsi | Tidak dijamin | Soal lama bisa tetap tidak berubah |
| Rename `slug` subject/topic | Tidak | Bisa membuat entitas baru, bukan rename |
| Hapus subject/topic/soal dari `seed.json` | Tidak | Data lama tidak otomatis terhapus dari database |

### 6.1 Jika Ingin Menambah Data

Gunakan alur biasa:

1. Tambah data baru ke `seed.json`
2. Jalankan `bun run seed:check`
3. Jalankan `bun run seed`

### 6.2 Jika Ingin Mengedit Data Existing

Untuk kondisi repo saat ini:

- Anggap `seed.json` sebagai sumber tambah data, bukan editor data lama
- Jika ingin mengubah data yang sudah pernah masuk, Anda perlu berhati-hati karena `seed` sekarang tidak melakukan update penuh

Praktik aman:

1. Backup database
2. Tentukan apakah perubahan itu tambah data baru atau edit data lama
3. Jika benar-benar edit data lama, lakukan cleanup/manual SQL/migrasi terkontrol sesuai kebutuhan
4. Jalankan `bun run seed:check` setelah perubahan file

### 6.3 Jika Ingin Rename Slug

Jangan langsung edit `slug` lalu menjalankan `seed`.

Risiko:

- entitas baru dibuat
- relasi lama tetap tertinggal
- data menjadi ganda atau terfragmentasi

### 6.4 Jika Ingin Menghapus Data

Menghapus item dari `seed.json` tidak otomatis menghapus data di database.

Jika butuh hapus:

- lakukan delete manual dengan hati-hati
- atau siapkan workflow migrasi/cleanup khusus

---

## 7. Setelah Mengedit Data Baru

Dari root project, jalankan:

```bash
bun run seed:check
bun run seed
```

Output contoh:
```
[seed] Done. Subjects: 0, Topics: 1, Questions: 5
```

- `Subjects: 0` = tidak ada subject baru (hanya insert jika belum ada)
- `Questions: 5` = 5 soal baru berhasil ditambahkan

Perilaku penting:

- subject/topic yang sudah ada berdasarkan `slug` tidak akan diinsert ulang
- soal yang sudah ada berdasarkan `question_text` identik tidak akan diinsert ulang
- aturan ini berlaku pada implementasi sekarang, bukan kontrak edit data penuh

---

## 8. Tips Generate Soal dengan AI

Minta AI untuk menghasilkan soal dalam format JSON. Contoh prompt:

```
Buatkan 5 soal UTBK tipe single_choice tentang Aljabar (Penalaran Matematika)
dalam format JSON array. Setiap soal punya:
- topic_slug: "aljabar"
- type: "single_choice"  
- difficulty: campur easy/medium/hard
- question_text: isi soal
- explanation_text: pembahasan singkat
- options: 4 opsi (A-D), satu is_correct: true, lainnya false

Langsung format JSON saja, tanpa penjelasan lain.
```

Atau untuk multiple response:

```
Buatkan 3 soal UTBK tipe multiple_response tentang Penalaran Umum (TPS).
Setiap soal punya 4 opsi, 2-3 di antaranya benar.
Output dalam format JSON array questions.
```

---

## 9. Kesalahan Umum

| Masalah | Penyebab | Solusi |
|---|---|---|
| `[seed] Subject "x" not found` | `subject_slug` di topic tidak cocok | Pastikan slug subject sudah ada di array `subjects` |
| `[seed] Topic "y" not found` | `topic_slug` di question tidak cocok | Pastikan slug topic sudah ada di array `topics` |
| Soal tidak muncul | `explanation_text` kosong | Wajib diisi |
| `true_false` tidak muncul opsi | Opsi bukan `true`/`false` | Gunakan `"key": "true"` dan `"key": "false"` |
| Perubahan label tidak muncul | `seed` tidak meng-update row lama | Perlakukan ini sebagai edit existing, bukan tambah data |
| Ganti `slug` lalu data jadi ganda | Rename slug membuat entitas baru | Jangan rename slug lewat edit biasa |
| Hapus item dari `seed.json` tapi data masih ada | `seed` tidak melakukan delete | Lakukan cleanup manual/migrasi khusus |
| Soal baru tidak masuk padahal topic beda | `question_text` sama dengan soal lain | Pastikan teks soal benar-benar unik jika memang soal baru |

---

## 10. Validasi Format

Gunakan validasi resmi dulu:

```bash
bun run seed:check
```

Jika hanya ingin cek JSON mentah, Anda bisa pakai fallback berikut:

```bash
python3 -m json.tool seed.json > /dev/null && echo "JSON valid" || echo "JSON ERROR"
```

Kalau ada error, periksa: koma berlebih, kutip tidak ditutup, atau bracket tidak seimbang.
