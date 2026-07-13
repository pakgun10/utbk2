import { Hono } from 'hono';
import { checkAnswer, evaluateScoredAnswer } from '../lib/scoring';
import type { Pool } from '../db/connection';
import type { QuestionType } from '../lib/scoring';
import {
  mapCheckAnswerResponse,
  mapCheckScoredResponse,
  mapEmptyRandomQuestionResponse,
  mapRandomQuestionResponse,
} from '../mappers/question-response';
import {
  countQuestionsForTopic,
  createQuestionsDb,
  findQuestionAnswerKey,
  findQuestionById,
  findQuestionOptions,
  findQuestionScoredOptions,
  findRandomQuestion,
} from '../services/question-service';
import {
  parseCheckAnswerBody,
  parseExcludeIds,
  parseQuestionIdParam,
  parseRandomQuestionQuery,
  validateSelectedKeys,
} from '../validators/question-validator';

export function questionsRoutes(pool: Pool) {
  const db = createQuestionsDb(pool);
  const app = new Hono();

  app.get('/count', async (c) => {
    const parsed = parseRandomQuestionQuery(c.req.query());

    if (!parsed.success) {
      return c.json(
        {
          error: 'invalid_query',
          message: 'topic_id harus berupa angka positif.',
        },
        400,
      );
    }

    const total = await countQuestionsForTopic(db, parsed.data.topic_id);
    return c.json({ count: total });
  });

  app.get('/random', async (c) => {
    const parsed = parseRandomQuestionQuery(c.req.query());

    if (!parsed.success) {
      return c.json(
        {
          error: 'invalid_query',
          message: 'topic_id harus berupa angka positif.',
        },
        400,
      );
    }

    const excludeIds = parseExcludeIds(parsed.data.exclude);
    const question = await findRandomQuestion(
      db,
      parsed.data.topic_id,
      excludeIds,
    );

    if (!question) {
      return c.json(mapEmptyRandomQuestionResponse());
    }

    const options = await findQuestionOptions(db, question.id);
    return c.json(mapRandomQuestionResponse(question, options));
  });

  app.post('/:id/check', async (c) => {
    const id = parseQuestionIdParam(c.req.param('id'));

    if (id === null) {
      return c.json(
        { error: 'invalid_param', message: 'ID soal tidak valid.' },
        400,
      );
    }

    const body = await c.req.json();
    const parsed = parseCheckAnswerBody(body);

    if (!parsed.success) {
      return c.json(
        {
          error: 'invalid_body',
          message: 'Body tidak valid. selected_keys wajib diisi.',
        },
        400,
      );
    }

    const question = await findQuestionById(db, id);

    if (!question) {
      return c.json(
        { error: 'not_found', message: 'Soal tidak ditemukan.' },
        404,
      );
    }

    const options = await findQuestionAnswerKey(db, id);

    const validationError = validateSelectedKeys(
      question.type as QuestionType,
      parsed.data.selected_keys,
      options.map((option) => option.key),
    );

    if (validationError) {
      return c.json({ error: 'invalid_body', message: validationError }, 400);
    }

    if (question.type === 'multiple_choice') {
      const scoredOptions = (await findQuestionScoredOptions(db, id)).map(
        (o) => ({
          key: o.key,
          score: o.score ?? 0,
        }),
      );

      const scoredResult = evaluateScoredAnswer(
        parsed.data.selected_keys,
        scoredOptions,
      );
      return c.json(mapCheckScoredResponse(question, scoredResult));
    }

    const result = checkAnswer(
      question.type as QuestionType,
      parsed.data.selected_keys,
      options,
    );

    return c.json(mapCheckAnswerResponse(question, result));
  });

  return app;
}
