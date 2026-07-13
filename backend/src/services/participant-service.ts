import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import { participants } from '../db/schema/participants';
import * as schema from '../db/schema';
import type { Pool } from '../db/connection';

type ParticipantDb = ReturnType<typeof drizzle>;

export function createParticipantDb(pool: Pool) {
  return drizzle(pool, { schema, mode: 'default' });
}

export async function upsertParticipant(
  db: ParticipantDb,
  data: {
    session_token: string;
    name: string;
    institution: string;
    ukkj: string;
  },
) {
  const existing = await getParticipantByToken(db, data.session_token);

  if (existing) {
    await db
      .update(participants)
      .set({
        name: data.name,
        institution: data.institution,
        ukkj: data.ukkj,
      })
      .where(eq(participants.session_token, data.session_token));
  } else {
    await db.insert(participants).values({
      session_token: data.session_token,
      name: data.name,
      institution: data.institution,
      ukkj: data.ukkj,
    });
  }

  return getParticipantByToken(db, data.session_token);
}

export async function getParticipantByToken(db: ParticipantDb, sessionToken: string) {
  const [row] = await db
    .select()
    .from(participants)
    .where(eq(participants.session_token, sessionToken))
    .limit(1);

  return row ?? null;
}
