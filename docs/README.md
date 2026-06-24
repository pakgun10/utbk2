# Dokumentasi UTBK Belajar

Indeks dan panduan navigasi seluruh dokumentasi project.

---

## Cara Pakai

Dokumentasi dipecah per topik. Pilih yang sesuai kebutuhan:

| Jika Anda ingin... | Baca |
|---|---|
| Paham arsitektur, API, model data | `ARSITEKTUR.md` |
| Melihat fitur apa saja yang sudah jadi | `CHANGELOG.md` |
| Menambah/mengedit/validasi soal | `FORMAT-SOAL/` |
| Deploy ke VPS dengan Docker + NPM | `DEPLOY/` |
| Rencana pengembangan ke depan | `RENCANA-PROFESIONALISASI.md` |
| Navigasi folder project | `STRUKTUR.md` |
| Aturan coding & workflow | `RULES.md` (root) |

---

## Indeks Folder

```
docs/
├── README.md                           ← file ini
├── ARSITEKTUR.md                       ← arsitektur teknis
├── CHANGELOG.md                        ← catatan rilis
├── RENCANA-PROFESIONALISASI.md         ← rencana pengembangan
├── STRUKTUR.md                         ← struktur direktori
│
├── DEPLOY/                             ← deploy production
│   ├── README.md
│   ├── 01-setup.md
│   ├── 02-database.md
│   ├── 03-network.md
│   ├── 04-configuration.md
│   ├── 05-verification.md
│   ├── 06-checklist.md
│   ├── 07-update.md
│   └── 08-troubleshooting.md
│
└── FORMAT-SOAL/                        ← format data soal
    ├── README.md
    ├── 01-struktur-data.md
    ├── 02-tipe-soal.md
    ├── 03-operasi-data.md
    ├── 04-eksekusi.md
    ├── 05-ai-prompt.md
    └── 06-troubleshooting.md
```

---

## Urutan Baca (Rekomendasi)

Kalau baru pertama kali lihat project ini:

1. `RULES.md` — aturan main
2. `README.md` (root) — cara pakai aplikasi
3. `docs/ARSITEKTUR.md` — paham struktur
4. `docs/DEPLOY/README.md` — kalau mau deploy
5. `docs/FORMAT-SOAL/README.md` — kalau mau nambah soal
