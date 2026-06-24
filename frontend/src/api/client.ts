import type { Subject, Topic, Question, CheckResult } from '@/types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Network error' }));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchSubjects(): Promise<Subject[]> {
  const data = await request<{ subjects: Subject[] }>('/subjects');
  return data.subjects;
}

export async function fetchTopics(subjectId: number): Promise<Topic[]> {
  const data = await request<{ topics: Topic[] }>(`/topics?subject_id=${subjectId}`);
  return data.topics;
}

export async function fetchRandomQuestion(topicId: number): Promise<Question | null> {
  const data = await request<{ question: Question | null }>(`/questions/random?topic_id=${topicId}`);
  return data.question;
}

export async function checkAnswer(questionId: number, selectedKeys: string[]): Promise<CheckResult> {
  return request<CheckResult>(`/questions/${questionId}/check`, {
    method: 'POST',
    body: JSON.stringify({ selected_keys: selectedKeys }),
  });
}

export async function fetchQuestionCount(topicId: number): Promise<number> {
  const data = await request<{ count: number }>(`/questions/count?topic_id=${topicId}`);
  return data.count;
}
