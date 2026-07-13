export interface Subject {
  id: number;
  slug: string;
  label: string;
  display_order: number;
}

export interface Topic {
  id: number;
  subject_id: number;
  slug: string;
  label: string;
  display_order: number;
  question_count: number;
}

export interface QuestionOption {
  key: string;
  text: string;
  score?: number;
}

export interface Question {
  id: number;
  type:
    | 'single_choice'
    | 'multiple_response'
    | 'multiple_choice'
    | 'true_false';
  difficulty: 'easy' | 'medium' | 'hard';
  question_text: string;
  options: QuestionOption[];
}

export interface CheckResult {
  correct: boolean;
  correct_keys: string[];
  explanation: string;
}

export interface CheckScoredResult {
  score: number;
  max_score: number;
  best_keys: string[];
  explanation: string;
}

export interface QuizAttempt {
  id: number;
  participant_id?: number;
  topic_id: number;
  status: 'in_progress' | 'finished' | 'abandoned';
  total_questions: number;
  answered_questions: number;
  total_correct: number;
  total_incorrect: number;
  total_score: number;
  max_score: number;
  total_elapsed_seconds: number;
  started_at: string;
  finished_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type AttemptCheckResult = (CheckResult | CheckScoredResult) & {
  attempt: QuizAttempt;
};

export interface PersistedQuizAnswer {
  question_id: number;
  question_type: Question['type'];
  selected_keys: string[];
  is_correct: boolean | null;
  score: number | null;
  max_score: number | null;
  elapsed_seconds: number;
  answered_at: string;
}

export interface Participant {
  id?: number;
  session_token?: string;
  name: string;
  institution: string;
  ukkj: '3c' | '4a' | '4d';
}
