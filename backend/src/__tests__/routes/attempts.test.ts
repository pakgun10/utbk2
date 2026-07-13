import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  countQuestionsForTopic: vi.fn(),
  createAttempt: vi.fn(),
  createAttemptsDb: vi.fn(),
  createParticipantDb: vi.fn(),
  createQuestionsDb: vi.fn(),
  findAnswersForAttempt: vi.fn(),
  findQuestionAnswerKey: vi.fn(),
  findQuestionById: vi.fn(),
  findQuestionScoredOptions: vi.fn(),
  finishAttempt: vi.fn(),
  getAttemptForParticipant: vi.fn(),
  getParticipantByToken: vi.fn(),
  saveAnswer: vi.fn(),
}));

vi.mock('@/services/question-service', () => ({
  countQuestionsForTopic: mocks.countQuestionsForTopic,
  createQuestionsDb: mocks.createQuestionsDb,
  findQuestionAnswerKey: mocks.findQuestionAnswerKey,
  findQuestionById: mocks.findQuestionById,
  findQuestionScoredOptions: mocks.findQuestionScoredOptions,
}));

vi.mock('@/services/participant-service', () => ({
  createParticipantDb: mocks.createParticipantDb,
  getParticipantByToken: mocks.getParticipantByToken,
}));

vi.mock('@/services/attempt-service', () => {
  class DuplicateAnswerError extends Error {
    constructor() {
      super('answer_already_submitted');
      this.name = 'DuplicateAnswerError';
    }
  }

  return {
    createAttemptsDb: mocks.createAttemptsDb,
    createAttempt: mocks.createAttempt,
    DuplicateAnswerError,
    findAnswersForAttempt: mocks.findAnswersForAttempt,
    finishAttempt: mocks.finishAttempt,
    getAttemptForParticipant: mocks.getAttemptForParticipant,
    saveAnswer: mocks.saveAnswer,
  };
});

describe('attemptsRoutes', () => {
  beforeEach(() => {
    vi.resetModules();
    for (const mock of Object.values(mocks)) {
      mock.mockReset();
    }
    mocks.createAttemptsDb.mockReturnValue({});
    mocks.createQuestionsDb.mockReturnValue({});
    mocks.createParticipantDb.mockReturnValue({});
    mocks.getParticipantByToken.mockResolvedValue({ id: 7, name: 'Peserta' });
  });

  it('starts an attempt for current participant', async () => {
    mocks.countQuestionsForTopic.mockResolvedValue(12);
    mocks.createAttempt.mockResolvedValue({
      id: 1,
      participant_id: 7,
      topic_id: 3,
      status: 'in_progress',
      total_questions: 12,
    });

    const { attemptsRoutes } = await import('@/routes/attempts.js');
    const app = attemptsRoutes({} as never);
    const res = await app.request('http://localhost/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': 'token' },
      body: JSON.stringify({ topic_id: 3 }),
    });

    expect(res.status).toBe(200);
    expect(mocks.createAttempt).toHaveBeenCalledWith(
      {},
      { participant_id: 7, topic_id: 3, total_questions: 12 },
    );
    await expect(res.json()).resolves.toEqual({
      attempt: {
        id: 1,
        participant_id: 7,
        topic_id: 3,
        status: 'in_progress',
        total_questions: 12,
      },
    });
  });

  it('persists scored multiple_choice answer', async () => {
    mocks.getAttemptForParticipant
      .mockResolvedValueOnce({ id: 5, participant_id: 7, status: 'in_progress' })
      .mockResolvedValueOnce({
        id: 5,
        participant_id: 7,
        status: 'in_progress',
        answered_questions: 1,
        total_score: 2,
        max_score: 4,
      });
    mocks.findQuestionById.mockResolvedValue({
      id: 10,
      type: 'multiple_choice',
      explanation_text: 'Pembahasan',
    });
    mocks.findQuestionAnswerKey.mockResolvedValue([
      { key: 'A', is_correct: false },
      { key: 'B', is_correct: false },
    ]);
    mocks.findQuestionScoredOptions.mockResolvedValue([
      { key: 'A', score: 2 },
      { key: 'B', score: 4 },
    ]);
    mocks.saveAnswer.mockResolvedValue(99);

    const { attemptsRoutes } = await import('@/routes/attempts.js');
    const app = attemptsRoutes({} as never);
    const res = await app.request('http://localhost/5/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': 'token' },
      body: JSON.stringify({
        question_id: 10,
        selected_keys: ['A'],
        elapsed_seconds: 20,
      }),
    });

    expect(res.status).toBe(200);
    expect(mocks.saveAnswer).toHaveBeenCalledWith(
      {},
      {
        attempt_id: 5,
        question_id: 10,
        question_type: 'multiple_choice',
        selected_keys: ['A'],
        is_correct: null,
        score: 2,
        max_score: 4,
        elapsed_seconds: 20,
      },
    );
    await expect(res.json()).resolves.toEqual({
      score: 2,
      max_score: 4,
      best_keys: ['B'],
      explanation: 'Pembahasan',
      attempt: {
        id: 5,
        participant_id: 7,
        status: 'in_progress',
        answered_questions: 1,
        total_score: 2,
        max_score: 4,
      },
    });
  });
});
