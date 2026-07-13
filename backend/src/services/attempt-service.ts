import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import { quizAttempts } from '@/db/schema/quiz-attempts';
import { quizAnswers } from '@/db/schema/quiz-answers';
import * as schema from '@/db/schema';
import type { Pool } from '@/db/connection';
import type { QuestionType } from '@/lib/scoring';

type AttemptsDb = ReturnType<typeof drizzle>;

export interface CreateAttemptData {
  participant_id: number;
  topic_id: number;
  total_questions: number;
}

export interface SaveAnswerData {
  attempt_id: number;
  question_id: number;
  question_type: QuestionType;
  selected_keys: string[];
  is_correct: boolean | null;
  score: number | null;
  max_score: number | null;
  elapsed_seconds: number;
}

export class DuplicateAnswerError extends Error {
  constructor() {
    super('answer_already_submitted');
    this.name = 'DuplicateAnswerError';
  }
}

export function createAttemptsDb(pool: Pool) {
  return drizzle(pool, { schema, mode: 'default' });
}

export async function createAttempt(db: AttemptsDb, data: CreateAttemptData) {
  const [inserted] = await db.insert(quizAttempts).values({
    participant_id: data.participant_id,
    topic_id: data.topic_id,
    total_questions: data.total_questions,
  });

  return getAttemptById(db, Number(inserted.insertId));
}

export async function getAttemptById(db: AttemptsDb, attemptId: number) {
  const [attempt] = await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.id, attemptId))
    .limit(1);

  return attempt ?? null;
}

export async function getAttemptForParticipant(
  db: AttemptsDb,
  attemptId: number,
  participantId: number,
) {
  const [attempt] = await db
    .select()
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.id, attemptId),
        eq(quizAttempts.participant_id, participantId),
      ),
    )
    .limit(1);

  return attempt ?? null;
}

function isDuplicateEntry(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const record = error as Record<string, unknown>;
  return record.code === 'ER_DUP_ENTRY' || record.errno === 1062;
}

export async function saveAnswer(db: AttemptsDb, data: SaveAnswerData) {
  try {
    const [inserted] = await db.insert(quizAnswers).values({
      attempt_id: data.attempt_id,
      question_id: data.question_id,
      question_type: data.question_type,
      selected_keys_json: JSON.stringify(data.selected_keys),
      is_correct: data.is_correct,
      score: data.score,
      max_score: data.max_score,
      elapsed_seconds: data.elapsed_seconds,
    });

    await recalculateAttemptSummary(db, data.attempt_id);
    return Number(inserted.insertId);
  } catch (error) {
    if (isDuplicateEntry(error)) {
      throw new DuplicateAnswerError();
    }
    throw error;
  }
}

export async function recalculateAttemptSummary(
  db: AttemptsDb,
  attemptId: number,
) {
  const answers = await db
    .select()
    .from(quizAnswers)
    .where(eq(quizAnswers.attempt_id, attemptId));

  const summary = answers.reduce(
    (acc, answer) => {
      acc.answered_questions += 1;
      if (answer.is_correct === true) acc.total_correct += 1;
      if (answer.is_correct === false) acc.total_incorrect += 1;
      acc.total_score += Number(answer.score ?? 0);
      acc.max_score += Number(answer.max_score ?? 0);
      acc.total_elapsed_seconds += Number(answer.elapsed_seconds ?? 0);
      return acc;
    },
    {
      answered_questions: 0,
      total_correct: 0,
      total_incorrect: 0,
      total_score: 0,
      max_score: 0,
      total_elapsed_seconds: 0,
    },
  );

  await db
    .update(quizAttempts)
    .set({
      ...summary,
      updated_at: new Date(),
    })
    .where(eq(quizAttempts.id, attemptId));

  return getAttemptById(db, attemptId);
}

export async function finishAttempt(db: AttemptsDb, attemptId: number) {
  await recalculateAttemptSummary(db, attemptId);

  await db
    .update(quizAttempts)
    .set({
      status: 'finished',
      finished_at: new Date(),
      updated_at: new Date(),
    })
    .where(eq(quizAttempts.id, attemptId));

  return getAttemptById(db, attemptId);
}

export async function findAnswersForAttempt(db: AttemptsDb, attemptId: number) {
  const rows = await db
    .select()
    .from(quizAnswers)
    .where(eq(quizAnswers.attempt_id, attemptId));

  return rows.map((row) => ({
    ...row,
    selected_keys: JSON.parse(row.selected_keys_json) as string[],
  }));
}
