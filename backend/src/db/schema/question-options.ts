import {
  mysqlTable,
  int,
  varchar,
  text,
  boolean,
} from 'drizzle-orm/mysql-core';
// score: nullable int — hanya digunakan untuk tipe multiple_choice
import { questions } from './questions';

export const questionOptions = mysqlTable('question_options', {
  id: int('id').autoincrement().primaryKey(),
  question_id: int('question_id')
    .notNull()
    .references(() => questions.id),
  option_key: varchar('option_key', { length: 5 }).notNull(),
  option_text: text('option_text').notNull(),
  is_correct: boolean('is_correct').notNull(),
  score: int('score'),
  display_order: int('display_order').notNull(),
});
