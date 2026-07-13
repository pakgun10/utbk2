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
}

export interface Question {
  id: number;
  type: 'single_choice' | 'multiple_response' | 'true_false';
  difficulty: 'easy' | 'medium' | 'hard';
  question_text: string;
  options: QuestionOption[];
}

export interface CheckResult {
  correct: boolean;
  correct_keys: string[];
  explanation: string;
}

export interface Participant {
  id?: number;
  session_token?: string;
  name: string;
  institution: string;
  ukkj: '3c' | '4a' | '4d';
}

