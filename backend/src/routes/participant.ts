import { Hono } from 'hono';
import { z } from 'zod';
import type { Pool } from '../db/connection';
import {
  createParticipantDb,
  getParticipantByToken,
  upsertParticipant,
} from '../services/participant-service';

const participantBodySchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  institution: z.string().min(1, 'Instansi wajib diisi'),
  ukkj: z.enum(['3c', '4a', '4d'], { message: 'UKKJ harus 3c, 4a, atau 4d' }),
});

export function participantRoutes(pool: Pool) {
  const db = createParticipantDb(pool);
  const app = new Hono();

  app.get('/', async (c) => {
    const token = c.req.header('x-auth-token');
    if (!token) {
      return c.json({ error: 'unauthorized', message: 'Token tidak valid' }, 401);
    }

    const participant = await getParticipantByToken(db, token);
    return c.json({ participant });
  });

  app.post('/', async (c) => {
    const token = c.req.header('x-auth-token');
    if (!token) {
      return c.json({ error: 'unauthorized', message: 'Token tidak valid' }, 401);
    }

    const body = await c.req.json();
    const parsed = participantBodySchema.safeParse(body);

    if (!parsed.success) {
      return c.json({
        error: 'invalid_body',
        message: parsed.error.issues[0].message,
      }, 400);
    }

    const participant = await upsertParticipant(db, {
      session_token: token,
      name: parsed.data.name,
      institution: parsed.data.institution,
      ukkj: parsed.data.ukkj,
    });

    return c.json({ participant });
  });

  return app;
}
