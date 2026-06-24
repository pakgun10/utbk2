import { beforeEach, describe, expect, it, vi } from 'vitest';

const { drizzleMock } = vi.hoisted(() => ({
  drizzleMock: vi.fn(),
}));

vi.mock('drizzle-orm/mysql2', () => ({
  drizzle: drizzleMock,
}));

describe('questionsRoutes', () => {
  beforeEach(() => {
    drizzleMock.mockReset();
  });

  it('returns count for a topic', async () => {
    drizzleMock.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([{ total: 7 }]),
        }),
      }),
    });

    const { questionsRoutes } = await import('@/routes/questions.js');
    const app = questionsRoutes({} as never);
    const res = await app.request('http://localhost/count?topic_id=1');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ count: 7 });
  });

  it('returns random question payload without answer key', async () => {
    drizzleMock.mockReturnValue({
      select: (shape?: unknown) => {
        if (shape && typeof shape === 'object' && 'total' in (shape as Record<string, unknown>)) {
          return {
            from: () => ({
              where: () => ({
                limit: () => Promise.resolve([{ total: 1 }]),
              }),
            }),
          };
        }

        if (shape && typeof shape === 'object' && 'text' in (shape as Record<string, unknown>)) {
          return {
            from: () => ({
              where: () => ({
                orderBy: async () => [
                  { key: 'A', text: 'Opsi A' },
                  { key: 'B', text: 'Opsi B' },
                ],
              }),
            }),
          };
        }

        return {
          from: () => ({
            where: () => ({
              orderBy: () => ({
                limit: () => ({
                  offset: async () => [
                    {
                      id: 99,
                      type: 'single_choice',
                      difficulty: 'medium',
                      question_text: 'Soal contoh',
                    },
                  ],
                }),
              }),
            }),
          }),
        };
      },
    });

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const { questionsRoutes } = await import('@/routes/questions.js');
    const app = questionsRoutes({} as never);
    const res = await app.request('http://localhost/random?topic_id=1');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      question: {
        id: 99,
        type: 'single_choice',
        difficulty: 'medium',
        question_text: 'Soal contoh',
        options: [
          { key: 'A', text: 'Opsi A' },
          { key: 'B', text: 'Opsi B' },
        ],
      },
    });
    randomSpy.mockRestore();
  });

  it('rejects duplicate selected_keys on check', async () => {
    drizzleMock.mockReturnValue({
      select: (shape?: unknown) => {
        if (shape && typeof shape === 'object' && 'is_correct' in (shape as Record<string, unknown>)) {
          return {
            from: () => ({
              where: async () => [
                { key: 'A', is_correct: true },
                { key: 'B', is_correct: false },
              ],
            }),
          };
        }

        return {
          from: () => ({
            where: () => ({
              limit: async () => [
                {
                  id: 10,
                  type: 'multiple_response',
                  explanation_text: 'Pembahasan',
                },
              ],
            }),
          }),
        };
      },
    });

    const { questionsRoutes } = await import('@/routes/questions.js');
    const app = questionsRoutes({} as never);
    const res = await app.request('http://localhost/10/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selected_keys: ['A', 'A'] }),
    });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: 'invalid_body',
      message: 'selected_keys tidak boleh duplikat.',
    });
  });
});
