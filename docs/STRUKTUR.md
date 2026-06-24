# STRUKTUR FOLDER REFERENCE

> Referensi lengkap struktur direktori project `utbk2`.
> Dokumen ini akan diupdate seiring progress pengerjaan.

```
utbk2/
│
├── .env                          # Konfigurasi lingkungan (tidak di-commit)
├── .env.example                  # Template konfigurasi
├── .gitignore                    # Git ignore rules
├── seed.json                     # Data soal untuk seed awal
├── README.md                     # Panduan lengkap penggunaan
├── RULES.md                      # Project rules (WAJIB BACA dulu)
│
├── docs/
│   ├── KONSEP.md                 # Dokumen konsep aplikasi
│   ├── RENCANA.md                # Rencana eksekusi step-by-step
│   ├── FORMAT-SOAL.md            # Panduan format memasukkan soal
│   ├── DEPLOY.md                 # Panduan deploy Docker
│   └── STRUKTUR.md               # File ini
│
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema/
│   │   │   │   ├── subjects.ts
│   │   │   │   ├── topics.ts
│   │   │   │   ├── questions.ts
│   │   │   │   ├── question-options.ts
│   │   │   │   └── index.ts
│   │   │   ├── connection.ts
│   │   │   └── migrate.ts
│   │   ├── routes/
│   │   │   ├── subjects.ts
│   │   │   ├── topics.ts
│   │   │   └── questions.ts
│   │   ├── lib/
│   │   │   ├── scoring.ts
│   │   │   └── seed.ts
│   │   ├── __tests__/
│   │   │   ├── routes/
│   │   │   │   ├── subjects.test.ts
│   │   │   │   ├── topics.test.ts
│   │   │   │   └── questions.test.ts
│   │   │   └── lib/
│   │   │       └── scoring.test.ts
│   │   ├── app.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── drizzle.config.ts
│
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── HomeView.vue
│   │   │   ├── TopicView.vue
│   │   │   └── QuizView.vue
│   │   ├── components/
│   │   │   ├── QuestionCard.vue
│   │   │   ├── TimerBar.vue
│   │   │   ├── OptionList.vue
│   │   │   └── ExplanationPanel.vue
│   │   ├── router/
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── __tests__/
│   │   │   ├── views/
│   │   │   │   ├── HomeView.test.ts
│   │   │   │   ├── TopicView.test.ts
│   │   │   │   └── QuizView.test.ts
│   │   │   └── components/
│   │   │       ├── TimerBar.test.ts
│   │   │       ├── OptionList.test.ts
│   │   │       └── ExplanationPanel.test.ts
│   │   ├── App.vue
│   │   └── main.ts
│   ├── index.html
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── vite.config.ts
```

## Legend Status

| Status | Arti |
|---|---|
| ✅ | Sudah dikerjakan |
| 🔜 | Rencana selanjutnya |
| ⬜ | Belum dikerjakan |
