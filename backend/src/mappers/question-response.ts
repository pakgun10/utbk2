import type { QuestionType } from '@/lib/scoring';

interface QuestionOptionResponse {
  key: string;
  text: string;
}

interface QuestionRow {
  id: number;
  type: string;
  difficulty: string;
  question_text: string;
}

interface CheckQuestionRow {
  explanation_text: string;
}

interface CheckAnswerResult {
  correct: boolean;
  correct_keys: string[];
}

export function mapRandomQuestionResponse(
  question: QuestionRow,
  options: QuestionOptionResponse[],
) {
  return {
    question: {
      id: question.id,
      type: question.type as QuestionType,
      difficulty: question.difficulty,
      question_text: question.question_text,
      options,
    },
  };
}

export function mapEmptyRandomQuestionResponse() {
  return {
    question: null,
    message: 'Tidak ada soal untuk topik ini.',
  };
}

export function mapCheckAnswerResponse(
  question: CheckQuestionRow,
  result: CheckAnswerResult,
) {
  return {
    correct: result.correct,
    correct_keys: result.correct_keys,
    explanation: question.explanation_text,
  };
}

export function mapCheckScoredResponse(
  question: CheckQuestionRow,
  result: { score: number; max_score: number; best_keys: string[] },
) {
  return {
    score: result.score,
    max_score: result.max_score,
    best_keys: result.best_keys,
    explanation: question.explanation_text,
  };
}
