import { describe, it, expect } from 'vitest';
import { checkAnswer, evaluateScoredAnswer } from '@/lib/scoring.js';

const sampleOptions = [
  { key: 'A', is_correct: false },
  { key: 'B', is_correct: true },
  { key: 'C', is_correct: false },
  { key: 'D', is_correct: false },
];

const multiOptions = [
  { key: 'A', is_correct: true },
  { key: 'B', is_correct: false },
  { key: 'C', is_correct: true },
  { key: 'D', is_correct: false },
];

const tfOptions = [
  { key: 'true', is_correct: true },
  { key: 'false', is_correct: false },
];

describe('checkAnswer - single_choice', () => {
  it('returns correct when match', () => {
    const result = checkAnswer('single_choice', ['B'], sampleOptions);
    expect(result.correct).toBe(true);
    expect(result.correct_keys).toEqual(['B']);
  });

  it('returns incorrect when no match', () => {
    const result = checkAnswer('single_choice', ['A'], sampleOptions);
    expect(result.correct).toBe(false);
    expect(result.correct_keys).toEqual(['B']);
  });

  it('returns incorrect when empty selection', () => {
    const result = checkAnswer('single_choice', [''], sampleOptions);
    expect(result.correct).toBe(false);
  });

  it('returns correct_keys regardless of correctness', () => {
    const result = checkAnswer('single_choice', ['C'], sampleOptions);
    expect(result.correct).toBe(false);
    expect(result.correct_keys).toEqual(['B']);
  });

  it('returns incorrect when multiple keys are submitted', () => {
    const result = checkAnswer('single_choice', ['B', 'A'], sampleOptions);
    expect(result.correct).toBe(false);
    expect(result.correct_keys).toEqual(['B']);
  });
});

describe('checkAnswer - multiple_response', () => {
  it('returns correct when all correct selected', () => {
    const result = checkAnswer('multiple_response', ['A', 'C'], multiOptions);
    expect(result.correct).toBe(true);
    expect(result.correct_keys).toEqual(['A', 'C']);
  });

  it('returns incorrect when partial', () => {
    const result = checkAnswer('multiple_response', ['A'], multiOptions);
    expect(result.correct).toBe(false);
  });

  it('returns incorrect when extra selected', () => {
    const result = checkAnswer(
      'multiple_response',
      ['A', 'B', 'C'],
      multiOptions,
    );
    expect(result.correct).toBe(false);
  });

  it('returns incorrect when all wrong', () => {
    const result = checkAnswer('multiple_response', ['B', 'D'], multiOptions);
    expect(result.correct).toBe(false);
  });

  it('returns incorrect when empty', () => {
    const result = checkAnswer('multiple_response', [], multiOptions);
    expect(result.correct).toBe(false);
  });

  it('returns incorrect when duplicate keys are submitted', () => {
    const result = checkAnswer('multiple_response', ['A', 'A'], multiOptions);
    expect(result.correct).toBe(false);
    expect(result.correct_keys).toEqual(['A', 'C']);
  });
});

describe('checkAnswer - true_false', () => {
  it('returns correct when select true and true is correct', () => {
    const result = checkAnswer('true_false', ['true'], tfOptions);
    expect(result.correct).toBe(true);
    expect(result.correct_keys).toEqual(['true']);
  });

  it('returns incorrect when select false', () => {
    const result = checkAnswer('true_false', ['false'], tfOptions);
    expect(result.correct).toBe(false);
  });
});

describe('evaluateScoredAnswer', () => {
  const scoredOptions = [
    { key: 'A', score: 2 },
    { key: 'B', score: 4 },
    { key: 'C', score: 1 },
    { key: 'D', score: -1 },
  ];

  it('returns full score and best key when selecting best option', () => {
    const result = evaluateScoredAnswer(['B'], scoredOptions);
    expect(result.score).toBe(4);
    expect(result.max_score).toBe(4);
    expect(result.best_keys).toEqual(['B']);
  });

  it('returns partial score for non-best option', () => {
    const result = evaluateScoredAnswer(['A'], scoredOptions);
    expect(result.score).toBe(2);
    expect(result.max_score).toBe(4);
    expect(result.best_keys).toEqual(['B']);
  });

  it('returns negative score for negative option', () => {
    const result = evaluateScoredAnswer(['D'], scoredOptions);
    expect(result.score).toBe(-1);
  });

  it('returns 0 for unmatched key', () => {
    const result = evaluateScoredAnswer(['X'], scoredOptions);
    expect(result.score).toBe(0);
  });

  it('returns all best keys when multiple have same max score', () => {
    const options = [
      { key: 'A', score: 4 },
      { key: 'B', score: 4 },
      { key: 'C', score: 2 },
    ];
    const result = evaluateScoredAnswer(['A'], options);
    expect(result.best_keys).toEqual(['A', 'B']);
  });

  it('returns zero values for empty options', () => {
    const result = evaluateScoredAnswer(['A'], []);
    expect(result.score).toBe(0);
    expect(result.max_score).toBe(0);
    expect(result.best_keys).toEqual([]);
  });
});
