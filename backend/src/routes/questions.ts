import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, count, and, notInArray } from 'drizzle-orm';
import { z } from 'zod';
import { questions } from '../db/schema/questions';
import { questionOptions } from '../db/schema/question-options';
import * as schema from '../db/schema/index';
import { checkAnswer } from '../lib/scoring';
import type { Pool } from '../db/connection';
import type { QuestionType } from '../lib/scoring';

const randomQuerySchema = z.object({
  topic_id: z.coerce.number().int().positive(),
  exclude: z.string().optional(),
});

const checkBodySchema = z.object({
  selected_keys: z.array(z.string().min(1)).min(1),
});

function validateSelectedKeys(
  questionType: QuestionType,
  selectedKeys: string[],
  validOptionKeys: string[],
): string | null {
  const selectedSet = new Set(selectedKeys);

  if (selectedSet.size !== selectedKeys.length) {
    return 'selected_keys tidak boleh duplikat.';
  }

  if (!selectedKeys.every((key) => validOptionKeys.includes(key))) {
    return 'selected_keys mengandung opsi yang tidak valid.';
  }

  if ((questionType === 'single_choice' || questionType === 'true_false') && selectedKeys.length !== 1) {
    return 'Tipe soal ini hanya menerima satu jawaban.';
  }

  return null;
}

export function questionsRoutes(pool: Pool) {
  const db = drizzle(pool, { schema, mode: 'default' });
  const app = new Hono();

  app.get('/count', async (c) => {
    const parsed = randomQuerySchema.safeParse(c.req.query());

    if (!parsed.success) {
      return c.json({ error: 'invalid_query', message: 'topic_id harus berupa angka positif.' }, 400);
    }

    const [row] = await db
      .select({ total: count() })
      .from(questions)
      .where(eq(questions.topic_id, parsed.data.topic_id));

    return c.json({ count: row?.total ?? 0 });
  });

  app.get('/random', async (c) => {
    const parsed = randomQuerySchema.safeParse(c.req.query());

    if (!parsed.success) {
      return c.json({ error: 'invalid_query', message: 'topic_id harus berupa angka positif.' }, 400);
    }

    const excludeIds = parsed.data.exclude
      ? parsed.data.exclude.split(',').map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : [];

    const conditions = [eq(questions.topic_id, parsed.data.topic_id)];
    if (excludeIds.length > 0) {
      conditions.push(notInArray(questions.id, excludeIds));
    }

    const [countRow] = await db
      .select({ total: count() })
      .from(questions)
      .where(and(...conditions))
      .limit(1);

    const total = Number(countRow?.total ?? 0);

    if (total === 0) {
      return c.json({ question: null, message: 'Tidak ada soal untuk topik ini.' });
    }

    const randomOffset = Math.floor(Math.random() * total);

    const [row] = await db
      .select()
      .from(questions)
      .where(and(...conditions))
      .orderBy(questions.id)
      .limit(1)
      .offset(randomOffset);

    if (!row) {
      return c.json({ question: null, message: 'Tidak ada soal untuk topik ini.' });
    }

    const options = await db
      .select({
        key: questionOptions.option_key,
        text: questionOptions.option_text,
      })
      .from(questionOptions)
      .where(eq(questionOptions.question_id, row.id))
      .orderBy(questionOptions.display_order);

    return c.json({
      question: {
        id: row.id,
        type: row.type,
        difficulty: row.difficulty,
        question_text: row.question_text,
        options,
      },
    });
  });

  app.post('/:id/check', async (c) => {
    const id = Number(c.req.param('id'));

    if (!Number.isFinite(id) || id < 1) {
      return c.json({ error: 'invalid_param', message: 'ID soal tidak valid.' }, 400);
    }

    const body = await c.req.json();
    const parsed = checkBodySchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'invalid_body', message: 'Body tidak valid. selected_keys wajib diisi.' }, 400);
    }

    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id))
      .limit(1);

    if (!question) {
      return c.json({ error: 'not_found', message: 'Soal tidak ditemukan.' }, 404);
    }

    const options = await db
      .select({
        key: questionOptions.option_key,
        is_correct: questionOptions.is_correct,
      })
      .from(questionOptions)
      .where(eq(questionOptions.question_id, id));

    const validationError = validateSelectedKeys(
      question.type as QuestionType,
      parsed.data.selected_keys,
      options.map((option) => option.key),
    );

    if (validationError) {
      return c.json({ error: 'invalid_body', message: validationError }, 400);
    }

    const result = checkAnswer(question.type as QuestionType, parsed.data.selected_keys, options);

    return c.json({
      correct: result.correct,
      correct_keys: result.correct_keys,
      explanation: question.explanation_text,
    });
  });

  return app;
}
