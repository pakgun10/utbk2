import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { checkAnswer, evaluateScoredAnswer } from '@/lib/scoring';
import type { QuestionType } from '@/lib/scoring';
import type { Pool } from '@/db/connection';
import {
  countQuestionsForTopic,
  createQuestionsDb,
  findQuestionAnswerKey,
  findQuestionById,
  findQuestionScoredOptions,
} from '@/services/question-service';
import {
  createAttemptsDb,
  createAttempt,
  DuplicateAnswerError,
  findAnswersForAttempt,
  finishAttempt,
  getAttemptForParticipant,
  saveAnswer,
} from '@/services/attempt-service';
import {
  createParticipantDb,
  getParticipantByToken,
} from '@/services/participant-service';
import { validateSelectedKeys } from '@/validators/question-validator';

const startAttemptSchema = z.object({
  topic_id: z.number().int().positive(),
  total_questions: z.number().int().min(0).optional(),
});

const answerSchema = z.object({
  question_id: z.number().int().positive(),
  selected_keys: z.array(z.string().min(1)).min(1),
  elapsed_seconds: z.number().int().min(0).default(0),
});

function parseAttemptId(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) return null;
  return id;
}

export function attemptsRoutes(pool: Pool) {
  const attemptsDb = createAttemptsDb(pool);
  const questionsDb = createQuestionsDb(pool);
  const participantDb = createParticipantDb(pool);
  const app = new Hono();

  async function requireParticipant(c: Context) {
    const token = c.req.header('x-auth-token');
    if (!token) return null;
    return getParticipantByToken(participantDb, token);
  }

  app.post('/start', async (c) => {
    const participant = await requireParticipant(c);
    if (!participant) {
      return c.json(
        { error: 'participant_required', message: 'Data peserta wajib diisi.' },
        401,
      );
    }

    const body = await c.req.json();
    const parsed = startAttemptSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: 'invalid_body', message: 'Body attempt tidak valid.' },
        400,
      );
    }

    const totalQuestions =
      parsed.data.total_questions ??
      (await countQuestionsForTopic(questionsDb, parsed.data.topic_id));

    const attempt = await createAttempt(attemptsDb, {
      participant_id: participant.id,
      topic_id: parsed.data.topic_id,
      total_questions: totalQuestions,
    });

    return c.json({ attempt });
  });

  app.post('/:id/answers', async (c) => {
    const participant = await requireParticipant(c);
    if (!participant) {
      return c.json(
        { error: 'participant_required', message: 'Data peserta wajib diisi.' },
        401,
      );
    }

    const attemptId = parseAttemptId(c.req.param('id'));
    if (!attemptId) {
      return c.json(
        { error: 'invalid_param', message: 'ID attempt tidak valid.' },
        400,
      );
    }

    const attempt = await getAttemptForParticipant(
      attemptsDb,
      attemptId,
      participant.id,
    );
    if (!attempt) {
      return c.json(
        { error: 'attempt_not_found', message: 'Attempt tidak ditemukan.' },
        404,
      );
    }

    if (attempt.status !== 'in_progress') {
      return c.json(
        { error: 'attempt_closed', message: 'Attempt sudah selesai.' },
        409,
      );
    }

    const body = await c.req.json();
    const parsed = answerSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: 'invalid_body', message: 'Body jawaban tidak valid.' },
        400,
      );
    }

    const question = await findQuestionById(
      questionsDb,
      parsed.data.question_id,
    );
    if (!question) {
      return c.json(
        { error: 'question_not_found', message: 'Soal tidak ditemukan.' },
        404,
      );
    }

    const answerKeyOptions = await findQuestionAnswerKey(
      questionsDb,
      parsed.data.question_id,
    );
    const validationError = validateSelectedKeys(
      question.type as QuestionType,
      parsed.data.selected_keys,
      answerKeyOptions.map((option) => option.key),
    );
    if (validationError) {
      return c.json({ error: 'invalid_body', message: validationError }, 400);
    }

    try {
      if (question.type === 'multiple_choice') {
        const scoredOptions = (
          await findQuestionScoredOptions(questionsDb, parsed.data.question_id)
        ).map((option) => ({ key: option.key, score: option.score ?? 0 }));
        const result = evaluateScoredAnswer(
          parsed.data.selected_keys,
          scoredOptions,
        );

        await saveAnswer(attemptsDb, {
          attempt_id: attemptId,
          question_id: question.id,
          question_type: question.type as QuestionType,
          selected_keys: parsed.data.selected_keys,
          is_correct: null,
          score: result.score,
          max_score: result.max_score,
          elapsed_seconds: parsed.data.elapsed_seconds,
        });

        const updatedAttempt = await getAttemptForParticipant(
          attemptsDb,
          attemptId,
          participant.id,
        );

        return c.json({
          score: result.score,
          max_score: result.max_score,
          best_keys: result.best_keys,
          explanation: question.explanation_text,
          attempt: updatedAttempt,
        });
      }

      const result = checkAnswer(
        question.type as QuestionType,
        parsed.data.selected_keys,
        answerKeyOptions,
      );

      await saveAnswer(attemptsDb, {
        attempt_id: attemptId,
        question_id: question.id,
        question_type: question.type as QuestionType,
        selected_keys: parsed.data.selected_keys,
        is_correct: result.correct,
        score: result.correct ? 1 : 0,
        max_score: 1,
        elapsed_seconds: parsed.data.elapsed_seconds,
      });

      const updatedAttempt = await getAttemptForParticipant(
        attemptsDb,
        attemptId,
        participant.id,
      );

      return c.json({
        correct: result.correct,
        correct_keys: result.correct_keys,
        explanation: question.explanation_text,
        attempt: updatedAttempt,
      });
    } catch (error) {
      if (error instanceof DuplicateAnswerError) {
        return c.json(
          {
            error: 'answer_already_submitted',
            message: 'Jawaban soal ini sudah disimpan.',
          },
          409,
        );
      }
      throw error;
    }
  });

  app.post('/:id/finish', async (c) => {
    const participant = await requireParticipant(c);
    if (!participant) {
      return c.json(
        { error: 'participant_required', message: 'Data peserta wajib diisi.' },
        401,
      );
    }

    const attemptId = parseAttemptId(c.req.param('id'));
    if (!attemptId) {
      return c.json(
        { error: 'invalid_param', message: 'ID attempt tidak valid.' },
        400,
      );
    }

    const attempt = await getAttemptForParticipant(
      attemptsDb,
      attemptId,
      participant.id,
    );
    if (!attempt) {
      return c.json(
        { error: 'attempt_not_found', message: 'Attempt tidak ditemukan.' },
        404,
      );
    }

    const finished = await finishAttempt(attemptsDb, attemptId);
    return c.json({ attempt: finished });
  });

  app.get('/:id', async (c) => {
    const participant = await requireParticipant(c);
    if (!participant) {
      return c.json(
        { error: 'participant_required', message: 'Data peserta wajib diisi.' },
        401,
      );
    }

    const attemptId = parseAttemptId(c.req.param('id'));
    if (!attemptId) {
      return c.json(
        { error: 'invalid_param', message: 'ID attempt tidak valid.' },
        400,
      );
    }

    const attempt = await getAttemptForParticipant(
      attemptsDb,
      attemptId,
      participant.id,
    );
    if (!attempt) {
      return c.json(
        { error: 'attempt_not_found', message: 'Attempt tidak ditemukan.' },
        404,
      );
    }

    const answers = await findAnswersForAttempt(attemptsDb, attemptId);
    return c.json({ attempt, answers });
  });

  return app;
}
