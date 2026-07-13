import { mysqlTable, int, mysqlEnum, timestamp } from 'drizzle-orm/mysql-core';
import { participants } from './participants';
import { topics } from './topics';

export const quizAttempts = mysqlTable('quiz_attempts', {
  id: int('id').autoincrement().primaryKey(),
  participant_id: int('participant_id')
    .notNull()
    .references(() => participants.id),
  topic_id: int('topic_id')
    .notNull()
    .references(() => topics.id),
  status: mysqlEnum('status', ['in_progress', 'finished', 'abandoned'])
    .notNull()
    .default('in_progress'),
  started_at: timestamp('started_at').defaultNow().notNull(),
  finished_at: timestamp('finished_at'),
  total_questions: int('total_questions').notNull().default(0),
  answered_questions: int('answered_questions').notNull().default(0),
  total_correct: int('total_correct').notNull().default(0),
  total_incorrect: int('total_incorrect').notNull().default(0),
  total_score: int('total_score').notNull().default(0),
  max_score: int('max_score').notNull().default(0),
  total_elapsed_seconds: int('total_elapsed_seconds').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
