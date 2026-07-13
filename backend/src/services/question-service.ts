import { and, count, eq, notInArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import { questions } from '@/db/schema/questions';
import { questionOptions } from '@/db/schema/question-options';
import * as schema from '@/db/schema';
import type { Pool } from '@/db/connection';

type QuestionsDb = ReturnType<typeof drizzle>;

export interface QuestionOptionKeyText {
  key: string;
  text: string;
}

export interface QuestionOptionKeyCorrect {
  key: string;
  is_correct: boolean;
}

export interface QuestionOptionKeyScore {
  key: string;
  score: number | null;
}

export function createQuestionsDb(pool: Pool) {
  return drizzle(pool, { schema, mode: 'default' });
}

export async function countQuestionsForTopic(db: QuestionsDb, topicId: number) {
  const [row] = await db
    .select({ total: count() })
    .from(questions)
    .where(eq(questions.topic_id, topicId));

  return Number(row?.total ?? 0);
}

export async function findRandomQuestion(
  db: QuestionsDb,
  topicId: number,
  excludeIds: number[],
) {
  const conditions = [eq(questions.topic_id, topicId)];
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
    return null;
  }

  const randomOffset = Math.floor(Math.random() * total);

  const [question] = await db
    .select()
    .from(questions)
    .where(and(...conditions))
    .orderBy(questions.id)
    .limit(1)
    .offset(randomOffset);

  return question ?? null;
}

export async function findQuestionOptions(
  db: QuestionsDb,
  questionId: number,
): Promise<QuestionOptionKeyText[]> {
  return db
    .select({
      key: questionOptions.option_key,
      text: questionOptions.option_text,
    })
    .from(questionOptions)
    .where(eq(questionOptions.question_id, questionId))
    .orderBy(questionOptions.display_order);
}

export async function findQuestionById(db: QuestionsDb, questionId: number) {
  const [question] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);

  return question ?? null;
}

export async function findQuestionAnswerKey(
  db: QuestionsDb,
  questionId: number,
): Promise<QuestionOptionKeyCorrect[]> {
  return db
    .select({
      key: questionOptions.option_key,
      is_correct: questionOptions.is_correct,
    })
    .from(questionOptions)
    .where(eq(questionOptions.question_id, questionId));
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
