import {
  mysqlTable,
  mysqlEnum,
  int,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import { topics } from './topics';

export const questions = mysqlTable('questions', {
  id: int('id').autoincrement().primaryKey(),
  topic_id: int('topic_id')
    .notNull()
    .references(() => topics.id),
  type: mysqlEnum('type', [
    'single_choice',
    'multiple_response',
    'multiple_choice',
    'true_false',
  ]).notNull(),
  difficulty: mysqlEnum('difficulty', ['easy', 'medium', 'hard']).notNull(),
  question_text: text('question_text').notNull(),
  explanation_text: text('explanation_text').notNull(),
  external_id: varchar('external_id', { length: 100 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
