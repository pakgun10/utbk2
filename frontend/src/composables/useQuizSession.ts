import { computed, ref } from 'vue';
import {
  checkAnswer as apiCheckAnswer,
  fetchQuestionCount,
  fetchRandomQuestion,
  fetchTopic,
  finishAttempt as apiFinishAttempt,
  startAttempt,
  submitAttemptAnswer,
} from '@/api/client';
import type {
  CheckResult,
  CheckScoredResult,
  Question,
  QuizAttempt,
} from '@/types';

export type QuizState =
  | 'loading'
  | 'ready'
  | 'answering'
  | 'reviewing'
  | 'resume'
  | 'error';

interface SessionResult {
  correct?: boolean;
  score?: number;
  maxScore?: number;
  elapsed: number;
}

interface UseQuizSessionOptions {
  getTopicId: () => number;
  getQuerySubjectId: () => number;
  getQueryTopicLabel: () => string;
}

export function useQuizSession(options: UseQuizSessionOptions) {
  const state = ref<QuizState>('loading');
  const question = ref<Question | null>(null);
  const result = ref<CheckResult | CheckScoredResult | null>(null);
  const attempt = ref<QuizAttempt | null>(null);
  const selectedKeys = ref<string[]>([]);
  const timerRunning = ref(false);
  const finalTime = ref(0);
  const errorMessage = ref('');
  const subjectId = ref(0);
  const topicLabel = ref('');
  const questionCount = ref(0);
  const autoStart = ref(false);
  const answeredIds = ref<Set<number>>(new Set());
  const sessionResults = ref<SessionResult[]>([]);
  const showExitModal = ref(false);

  const currentQuestionNumber = computed(() => {
    if (state.value === 'reviewing') return answeredIds.value.size;
    return answeredIds.value.size + 1;
  });

  const correctCount = computed(
    () => sessionResults.value.filter((entry) => entry.correct === true).length,
  );
  const incorrectCount = computed(
    () =>
      sessionResults.value.filter((entry) => entry.correct === false).length,
  );
  const totalTime = computed(() => {
    const total = sessionResults.value.reduce(
      (sum, entry) => sum + entry.elapsed,
      0,
    );
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });
  const accuracy = computed(() => {
    const binaryTotal = correctCount.value + incorrectCount.value;
    if (binaryTotal === 0) return 0;
    return Math.round((correctCount.value / binaryTotal) * 100);
  });
  const isLastQuestion = computed(
    () => answeredIds.value.size >= questionCount.value,
  );

  const binaryResult = computed(() =>
    result.value && 'correct' in result.value ? result.value : null,
  );
  const scoredResult = computed(() =>
    result.value && 'score' in result.value ? result.value : null,
  );

  const totalScore = computed(() =>
    sessionResults.value.reduce((sum, e) => sum + (e.score ?? 0), 0),
  );
  const maxPossibleScore = computed(() =>
    sessionResults.value.reduce((sum, e) => sum + (e.maxScore ?? 0), 0),
  );
  const totalScoredQuestions = computed(
    () => sessionResults.value.filter((e) => e.score !== undefined).length,
  );
  const scorePercentage = computed(() => {
    if (maxPossibleScore.value === 0) return 0;
    return Math.round((totalScore.value / maxPossibleScore.value) * 100);
  });

  async function loadQuestion() {
    state.value = 'loading';
    result.value = null;
    selectedKeys.value = [];
    finalTime.value = 0;

    try {
      const excludeArr = Array.from(answeredIds.value);
      const nextQuestion = await fetchRandomQuestion(
        options.getTopicId(),
        excludeArr,
      );

      if (!nextQuestion) {
        state.value = 'resume';
        return;
      }

      question.value = nextQuestion;
      if (autoStart.value) {
        autoStart.value = false;
        timerRunning.value = true;
        state.value = 'answering';
      } else {
        state.value = 'ready';
      }
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Gagal memuat soal.';
      state.value = 'error';
    }
  }

  async function startQuiz() {
    if (questionCount.value === 0 || !question.value) {
      loadQuestion();
      return;
    }

    try {
      if (!attempt.value) {
        attempt.value = await startAttempt(
          options.getTopicId(),
          questionCount.value,
        );
      }
      timerRunning.value = true;
      state.value = 'answering';
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Gagal memulai sesi.';
      state.value = 'error';
    }
  }

  function nextQuestion() {
    autoStart.value = true;
    loadQuestion();
  }

  function onSelectKeys(keys: string[]) {
    selectedKeys.value = keys;
  }

  function onTime(seconds: number) {
    if (!timerRunning.value) {
      finalTime.value = seconds;
    }
  }

  async function submitAnswer() {
    if (!question.value || selectedKeys.value.length === 0) return;

    timerRunning.value = false;

    try {
      const checkResult = attempt.value
        ? await submitAttemptAnswer(attempt.value.id, {
            question_id: question.value.id,
            selected_keys: selectedKeys.value,
            elapsed_seconds: finalTime.value,
          })
        : await apiCheckAnswer(question.value.id, selectedKeys.value);
      result.value = checkResult;
      if ('attempt' in checkResult) {
        attempt.value = (checkResult as { attempt: QuizAttempt }).attempt;
      }
      answeredIds.value.add(question.value.id);

      if ('correct' in checkResult) {
        sessionResults.value.push({
          correct: checkResult.correct,
          elapsed: finalTime.value,
        });
      } else {
        sessionResults.value.push({
          score: checkResult.score,
          maxScore: checkResult.max_score,
          elapsed: finalTime.value,
        });
      }

      state.value = 'reviewing';
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Gagal memeriksa jawaban.';
      state.value = 'error';
    }
  }

  async function loadTopicInfo() {
    const querySubjectId = options.getQuerySubjectId();
    const queryTopicLabel = options.getQueryTopicLabel();

    if (Number.isInteger(querySubjectId) && querySubjectId > 0) {
      subjectId.value = querySubjectId;
    }

    if (queryTopicLabel) {
      topicLabel.value = queryTopicLabel;
    }

    if (subjectId.value > 0 && topicLabel.value) {
      return;
    }

    try {
      const topic = await fetchTopic(options.getTopicId());
      if (topic) {
        subjectId.value = topic.subject_id;
        topicLabel.value = topic.label;
      }
    } catch {
      subjectId.value = 1;
    }
  }

  async function loadQuestionCount() {
    try {
      questionCount.value = await fetchQuestionCount(options.getTopicId());
    } catch {
      questionCount.value = 0;
    }
  }

  async function retryCurrentState() {
    await Promise.all([loadTopicInfo(), loadQuestionCount()]);
    await loadQuestion();
  }

  function resetSession() {
    attempt.value = null;
    answeredIds.value = new Set();
    sessionResults.value = [];
    autoStart.value = false;
  }

  async function finishSession() {
    if (attempt.value) {
      try {
        attempt.value = await apiFinishAttempt(attempt.value.id);
      } catch (error) {
        errorMessage.value =
          error instanceof Error
            ? error.message
            : 'Gagal menyimpan hasil akhir.';
      }
    }
    state.value = 'resume';
  }

  function cancelExit() {
    showExitModal.value = false;
  }

  function confirmExitState() {
    showExitModal.value = false;
    resetSession();
    state.value = 'ready';
    question.value = null;
    timerRunning.value = false;
  }

  function hasActiveSession() {
    if (state.value === 'resume' || state.value === 'ready') return false;
    return (
      state.value === 'answering' ||
      state.value === 'reviewing' ||
      answeredIds.value.size > 0
    );
  }

  async function initializeSession() {
    await Promise.all([loadTopicInfo(), loadQuestionCount()]);
    await loadQuestion();
  }

  return {
    accuracy,
    answeredIds,
    attempt,
    binaryResult,
    cancelExit,
    confirmExitState,
    correctCount,
    currentQuestionNumber,
    errorMessage,
    finalTime,
    finishSession,
    hasActiveSession,
    incorrectCount,
    initializeSession,
    isLastQuestion,
    loadQuestion,
    loadQuestionCount,
    loadTopicInfo,
    maxPossibleScore,
    nextQuestion,
    onSelectKeys,
    onTime,
    question,
    questionCount,
    resetSession,
    result,
    retryCurrentState,
    scorePercentage,
    scoredResult,
    selectedKeys,
    showExitModal,
    startQuiz,
    state,
    subjectId,
    submitAnswer,
    timerRunning,
    topicLabel,
    totalScore,
    totalScoredQuestions,
    totalTime,
  };
}
