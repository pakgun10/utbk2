import { describe, expect, it, vi, beforeEach } from 'vitest';

const { drizzleMock } = vi.hoisted(() => ({
  drizzleMock: vi.fn(),
}));

vi.mock('drizzle-orm/mysql2', () => ({
  drizzle: drizzleMock,
}));

describe('subjectsRoutes', () => {
  beforeEach(() => {
    drizzleMock.mockReset();
  });

  it('returns ordered subjects payload', async () => {
    drizzleMock.mockReturnValue({
      select: () => ({
        from: () => ({
          orderBy: async () => [
            { id: 1, slug: 'tps', label: 'TPS', display_order: 1 },
          ],
        }),
      }),
    });

    const { subjectsRoutes } = await import('@/routes/subjects.js');
    const app = subjectsRoutes({} as never);
    const res = await app.request('http://localhost/');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      subjects: [{ id: 1, slug: 'tps', label: 'TPS', display_order: 1 }],
    });
  });
});
