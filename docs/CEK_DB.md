
Query rekap hasil + nama peserta///pass=gezytechrootsecret

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p cbtbanghasan -e "
SELECT
  qa.id AS attempt_id,
  p.id AS participant_id,
  p.name,
  p.institution,
  p.ukkj,
  qa.topic_id,
  qa.status,
  qa.total_questions,
  qa.answered_questions,
  qa.total_correct,
  qa.total_incorrect,
  qa.total_score,
  qa.max_score,
  qa.total_elapsed_seconds,
  qa.started_at,
  qa.finished_at
FROM quiz_attempts qa
JOIN participants p ON p.id = qa.participant_id
ORDER BY qa.id DESC
LIMIT 20;
"
```

## Query detail jawaban + nama peserta

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p cbtbanghasan -e "
SELECT
  qa.id AS answer_id,
  qatt.id AS attempt_id,
  p.name,
  p.institution,
  p.ukkj,
  qa.question_id,
  qa.question_type,
  qa.selected_keys_json,
  qa.is_correct,
  qa.score,
  qa.max_score,
  qa.elapsed_seconds,
  qa.answered_at
FROM quiz_answers qa
JOIN quiz_attempts qatt ON qatt.id = qa.attempt_id
JOIN participants p ON p.id = qatt.participant_id
ORDER BY qa.id DESC
LIMIT 50;
"
```

## Query cek data peserta saja

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p cbtbanghasan -e "
SELECT
  id,
  name,
  institution,
  ukkj,
  created_at
FROM participants
ORDER BY id DESC
LIMIT 20;
"
```

Jadi betul: peserta memasukkan **nama**, **instansi/sekolah**, dan **UKKJ** setelah login; data itu ada di `participants`. Hasil tes mengacu ke peserta lewat `quiz_attempts.participant_id`.
