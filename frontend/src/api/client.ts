import type {
  Subject,
  Topic,
  Question,
  CheckResult,
  CheckScoredResult,
  AttemptCheckResult,
  QuizAttempt,
  PersistedQuizAnswer,
  Participant,
} from '@/types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = sessionStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['x-auth-token'] = token;

  const mergedHeaders = {
    ...headers,
    ...(options?.headers as Record<string, string>),
  };
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: mergedHeaders,
  });

  if (res.status === 401) {
    sessionStorage.removeItem('auth_token');
    window.location.href = '/auth';
    throw new Error('Sesi berakhir.');
  }

  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({ message: 'Gagal memuat data.' }));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchSubjects(): Promise<Subject[]> {
  const data = await request<{ subjects: Subject[] }>('/subjects');
  return data.subjects;
}

export async function fetchTopics(subjectId: number): Promise<Topic[]> {
  const data = await request<{ topics: Topic[] }>(
    `/topics?subject_id=${subjectId}`,
  );
  return data.topics;
}

export async function fetchRandomQuestion(
  topicId: number,
  excludeIds?: number[],
): Promise<Question | null> {
  let url = `/questions/random?topic_id=${topicId}`;
  if (excludeIds && excludeIds.length > 0) {
    url += `&exclude=${excludeIds.join(',')}`;
  }
  const data = await request<{ question: Question | null }>(url);
  return data.question;
}

export async function checkAnswer(
  questionId: number,
  selectedKeys: string[],
): Promise<CheckResult | CheckScoredResult> {
  return request<CheckResult | CheckScoredResult>(
    `/questions/${questionId}/check`,
    {
      method: 'POST',
      body: JSON.stringify({ selected_keys: selectedKeys }),
    },
  );
}

export async function fetchQuestionCount(topicId: number): Promise<number> {
  const data = await request<{ count: number }>(
    `/questions/count?topic_id=${topicId}`,
  );
  return data.count;
}

export async function startAttempt(
  topicId: number,
  totalQuestions: number,
): Promise<QuizAttempt> {
  const data = await request<{ attempt: QuizAttempt }>('/attempts/start', {
    method: 'POST',
    body: JSON.stringify({
      topic_id: topicId,
      total_questions: totalQuestions,
    }),
  });
  return data.attempt;
}

export async function submitAttemptAnswer(
  attemptId: number,
  payload: {
    question_id: number;
    selected_keys: string[];
    elapsed_seconds: number;
  },
): Promise<AttemptCheckResult> {
  return request<AttemptCheckResult>(`/attempts/${attemptId}/answers`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function finishAttempt(attemptId: number): Promise<QuizAttempt> {
  const data = await request<{ attempt: QuizAttempt }>(
    `/attempts/${attemptId}/finish`,
    { method: 'POST', body: JSON.stringify({}) },
  );
  return data.attempt;
}

export async function fetchAttempt(attemptId: number): Promise<{
  attempt: QuizAttempt;
  answers: PersistedQuizAnswer[];
}> {
  return request<{ attempt: QuizAttempt; answers: PersistedQuizAnswer[] }>(
    `/attempts/${attemptId}`,
  );
}

export async function fetchTopic(topicId: number): Promise<Topic | null> {
  try {
    const data = await request<{ topic: Topic }>(`/topics/${topicId}`);
    return data.topic;
  } catch {
    return null;
  }
}

export async function fetchParticipant(): Promise<Participant | null> {
  try {
    const data = await request<{ participant: Participant | null }>(
      '/participant',
    );
    return data.participant;
  } catch {
    return null;
  }
}

export async function saveParticipant(
  participant: Participant,
): Promise<Participant> {
  const data = await request<{ participant: Participant }>('/participant', {
    method: 'POST',
    body: JSON.stringify(participant),
  });
  return data.participant;
}
