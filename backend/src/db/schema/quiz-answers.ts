import {
  mysqlTable,
  int,
  mysqlEnum,
  text,
  boolean,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { quizAttempts } from './quiz-attempts';
import { questions } from './questions';

export const quizAnswers = mysqlTable(
  'quiz_answers',
  {
    id: int('id').autoincrement().primaryKey(),
    attempt_id: int('attempt_id')
      .notNull()
      .references(() => quizAttempts.id),
    question_id: int('question_id')
      .notNull()
      .references(() => questions.id),
    question_type: mysqlEnum('question_type', [
      'single_choice',
      'multiple_response',
      'multiple_choice',
      'true_false',
    ]).notNull(),
    selected_keys_json: text('selected_keys_json').notNull(),
    is_correct: boolean('is_correct'),
    score: int('score'),
    max_score: int('max_score'),
    elapsed_seconds: int('elapsed_seconds').notNull().default(0),
    answered_at: timestamp('answered_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueAttemptQuestion: uniqueIndex(
      'quiz_answers_attempt_id_question_id_unique',
    ).on(table.attempt_id, table.question_id),
  }),
);
