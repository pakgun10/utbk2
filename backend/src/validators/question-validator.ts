import { z } from 'zod';
import type { QuestionType } from '@/lib/scoring';

const randomQuerySchema = z.object({
  topic_id: z.coerce.number().int().positive(),
  exclude: z.string().optional(),
});

const checkBodySchema = z.object({
  selected_keys: z.array(z.string().min(1)).min(1),
});

export function parseRandomQuestionQuery(
  query: Record<string, string | undefined>,
) {
  return randomQuerySchema.safeParse(query);
}

export function parseCheckAnswerBody(body: unknown) {
  return checkBodySchema.safeParse(body);
}

export function parseQuestionIdParam(value: string): number | null {
  const id = Number(value);
  if (!Number.isFinite(id) || id < 1) {
    return null;
  }

  return id;
}

export function parseExcludeIds(rawExclude: string | undefined): number[] {
  if (!rawExclude) return [];

  return rawExclude
    .split(',')
    .map(Number)
    .filter((value) => Number.isFinite(value) && value > 0);
}

export function validateSelectedKeys(
  questionType: QuestionType,
  selectedKeys: string[],
  validOptionKeys: string[],
): string | null {
  const selectedSet = new Set(selectedKeys);

  if (selectedSet.size !== selectedKeys.length) {
    return 'selected_keys tidak boleh duplikat.';
  }

  if (!selectedKeys.every((key) => validOptionKeys.includes(key))) {
    return 'selected_keys mengandung opsi yang tidak valid.';
  }

  if (
    (questionType === 'single_choice' || questionType === 'true_false') &&
    selectedKeys.length !== 1
  ) {
    return 'Tipe soal ini hanya menerima satu jawaban.';
  }

  if (questionType === 'multiple_choice' && selectedKeys.length !== 1) {
    return 'Tipe soal ini hanya menerima satu jawaban.';
  }

  return null;
}
