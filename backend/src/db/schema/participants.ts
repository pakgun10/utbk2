import { mysqlTable, int, varchar, timestamp } from 'drizzle-orm/mysql-core';

export const participants = mysqlTable('participants', {
  id: int('id').autoincrement().primaryKey(),
  session_token: varchar('session_token', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  institution: varchar('institution', { length: 255 }).notNull(),
  ukkj: varchar('ukkj', { length: 50 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
