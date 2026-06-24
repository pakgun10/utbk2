import { beforeEach, describe, expect, it, vi } from 'vitest';

const { drizzleMock } = vi.hoisted(() => ({
  drizzleMock: vi.fn(),
}));

vi.mock('drizzle-orm/mysql2', () => ({
  drizzle: drizzleMock,
}));

describe('topicsRoutes', () => {
  beforeEach(() => {
    drizzleMock.mockReset();
  });

  it('rejects invalid subject_id', async () => {
    const { topicsRoutes } = await import('@/routes/topics.js');
    const app = topicsRoutes({} as never);
    const res = await app.request('http://localhost/?subject_id=abc');

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: 'invalid_query',
      message: 'subject_id harus berupa angka positif.',
    });
  });

  it('returns topics with question_count', async () => {
    drizzleMock.mockReturnValue({
      select: () => ({
        from: () => ({
          leftJoin: () => ({
            where: () => ({
              groupBy: () => ({
                orderBy: async () => [
                  {
                    id: 2,
                    subject_id: 1,
                    slug: 'penalaran-umum',
                    label: 'Penalaran Umum',
                    display_order: 1,
                    question_count: 10,
                  },
                ],
              }),
            }),
          }),
        }),
      }),
    });

    const { topicsRoutes } = await import('@/routes/topics.js');
    const app = topicsRoutes({} as never);
    const res = await app.request('http://localhost/?subject_id=1');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      topics: [
        {
          id: 2,
          subject_id: 1,
          slug: 'penalaran-umum',
          label: 'Penalaran Umum',
          display_order: 1,
          question_count: 10,
        },
      ],
    });
  });
});
