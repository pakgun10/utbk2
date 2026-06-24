import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { parseSeedData } from '@/lib/seed.js';

const baseSeed = {
  subjects: [
    { slug: 'tps', label: 'TPS', display_order: 1 },
  ],
  topics: [
    { slug: 'penalaran-umum', subject_slug: 'tps', label: 'Penalaran Umum', display_order: 1 },
  ],
  questions: [
    {
      topic_slug: 'penalaran-umum',
      type: 'single_choice',
      difficulty: 'medium',
      question_text: 'Contoh soal',
      explanation_text: 'Pembahasan',
      options: [
        { key: 'A', text: 'A', is_correct: false },
        { key: 'B', text: 'B', is_correct: true },
      ],
    },
  ],
} as const;

function expectParseError(input: unknown): z.ZodError {
  try {
    parseSeedData(input);
    throw new Error('expected parseSeedData to fail');
  } catch (error) {
    expect(error).toBeInstanceOf(z.ZodError);
    return error as z.ZodError;
  }
}

describe('parseSeedData', () => {
  it('accepts valid seed data', () => {
    expect(parseSeedData(baseSeed)).toBeDefined();
  });

  it('rejects single_choice without exactly one correct option', () => {
    const invalid = {
      ...baseSeed,
      questions: [
        {
          ...baseSeed.questions[0],
          options: [
            { key: 'A', text: 'A', is_correct: true },
            { key: 'B', text: 'B', is_correct: true },
          ],
        },
      ],
    };

    const error = expectParseError(invalid);
    expect(error.issues.some((issue) => issue.message.includes('single_choice'))).toBe(true);
  });

  it('rejects true_false without true/false keys', () => {
    const invalid = {
      ...baseSeed,
      questions: [
        {
          ...baseSeed.questions[0],
          type: 'true_false',
          options: [
            { key: 'A', text: 'Benar', is_correct: true },
            { key: 'B', text: 'Salah', is_correct: false },
          ],
        },
      ],
    };

    const error = expectParseError(invalid);
    expect(error.issues.some((issue) => issue.message.includes('"true" dan "false"'))).toBe(true);
  });

  it('rejects topic references to unknown subjects', () => {
    const invalid = {
      ...baseSeed,
      topics: [
        { slug: 'penalaran-umum', subject_slug: 'unknown', label: 'Penalaran Umum', display_order: 1 },
      ],
    };

    const error = expectParseError(invalid);
    expect(error.issues.some((issue) => issue.message.includes('subject_slug'))).toBe(true);
  });
});
