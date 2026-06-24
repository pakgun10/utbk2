<template>
  <div class="quiz-view">
    <div class="quiz-header">
      <a href="#" class="quiz-back" @click.prevent="tryExit">&larr; Ganti Topik</a>
      <span v-if="topicLabel" class="quiz-topic">{{ topicLabel }}</span>
      <span v-if="state === 'answering' || state === 'reviewing'" class="quiz-counter">
        {{ currentQuestionNumber }} / {{ questionCount }}
      </span>
    </div>

    <div v-if="state === 'loading'" class="quiz-loading">
      <p>Memuat soal...</p>
    </div>

    <div v-else-if="state === 'ready'" class="quiz-ready">
      <p class="ready-text">Siap berlatih?</p>
      <p v-if="questionCount > 0" class="ready-count">{{ questionCount }} soal tersedia</p>
      <p v-else class="ready-empty">Belum ada soal yang tersedia untuk topik ini.</p>
      <button class="quiz-start-btn" @click="startQuiz">Mulai</button>
    </div>

    <div v-else-if="state === 'resume'" class="quiz-resume">
      <h2 class="resume-title">Sesi Selesai</h2>
      <div class="resume-stats">
        <div class="resume-stat">
          <span class="resume-value correct">{{ correctCount }}</span>
          <span class="resume-label">Benar</span>
        </div>
        <div class="resume-stat">
          <span class="resume-value incorrect">{{ incorrectCount }}</span>
          <span class="resume-label">Salah</span>
        </div>
        <div class="resume-stat">
          <span class="resume-value">{{ totalTime }}</span>
          <span class="resume-label">Total Waktu</span>
        </div>
        <div class="resume-stat">
          <span class="resume-value">{{ accuracy }}%</span>
          <span class="resume-label">Akurasi</span>
        </div>
      </div>
      <router-link :to="`/topics/${subjectId}`" class="quiz-back-btn">Pilih Topik Lain</router-link>
    </div>

    <div v-else-if="question" class="quiz-content">
      <TimerBar v-if="state === 'answering'" :running="timerRunning" @time="onTime" />

      <QuestionCard
        :type="question.type"
        :difficulty="question.difficulty"
        :text="question.question_text"
      />

      <div class="quiz-options-section">
        <OptionList
          :options="question.options"
          :type="question.type"
          :selected-keys="selectedKeys"
          :disabled="state !== 'answering'"
          :correct-keys="result?.correct_keys"
          :show-result="state === 'reviewing'"
          @update:selected-keys="onSelectKeys"
        />

        <button
          v-if="state === 'answering'"
          class="quiz-submit-btn"
          :disabled="selectedKeys.length === 0"
          @click="submitAnswer"
        >
          Selesai
        </button>
      </div>

      <ExplanationPanel
        v-if="state === 'reviewing' && result"
        :correct="result.correct"
        :correct_keys="result.correct_keys"
        :explanation="result.explanation"
        :elapsed_seconds="finalTime"
        :is_last="answeredIds.size >= questionCount"
        @next="nextQuestion"
        @finish="state = 'resume'"
      />
    </div>

    <div v-else-if="state === 'error'" class="quiz-error">
      <p>{{ errorMessage }}</p>
      <button class="quiz-retry-btn" @click="retryCurrentState">Coba Lagi</button>
    </div>

    <div v-if="showExitModal" class="modal-overlay" @click.self="cancelExit">
      <div class="modal-box">
        <p class="modal-text">Yakin berhenti?</p>
        <p class="modal-sub">Progress sesi ini akan hilang.</p>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel" @click="cancelExit">Lanjutkan</button>
          <button class="modal-btn modal-btn-exit" @click="confirmExit">Berhenti</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import {
  fetchRandomQuestion,
  checkAnswer as apiCheckAnswer,
  fetchTopics,
  fetchQuestionCount,
  fetchSubjects,
} from '@/api/client';
import type { Question, CheckResult } from '@/types';
import QuestionCard from '@/components/QuestionCard.vue';
import TimerBar from '@/components/TimerBar.vue';
import OptionList from '@/components/OptionList.vue';
import ExplanationPanel from '@/components/ExplanationPanel.vue';

const route = useRoute();
const router = useRouter();

function getTopicId(): number {
  return Number(route.params.id);
}

type QuizState = 'loading' | 'ready' | 'answering' | 'reviewing' | 'resume' | 'error';

interface SessionResult {
  correct: boolean;
  elapsed: number;
}

const state = ref<QuizState>('loading');
const question = ref<Question | null>(null);
const result = ref<CheckResult | null>(null);
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
let pendingExitRoute: string | null = null;

const currentQuestionNumber = computed(() => {
  if (state.value === 'reviewing') return answeredIds.value.size;
  return answeredIds.value.size + 1;
});
const correctCount = computed(() => sessionResults.value.filter((r) => r.correct).length);
const incorrectCount = computed(() => sessionResults.value.filter((r) => !r.correct).length);
const totalTime = computed(() => {
  const total = sessionResults.value.reduce((sum, r) => sum + r.elapsed, 0);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});
const accuracy = computed(() => {
  if (sessionResults.value.length === 0) return 0;
  return Math.round((correctCount.value / sessionResults.value.length) * 100);
});

async function loadQuestion() {
  state.value = 'loading';
  result.value = null;
  selectedKeys.value = [];
  finalTime.value = 0;

  try {
    const excludeArr = Array.from(answeredIds.value);
    const q = await fetchRandomQuestion(getTopicId(), excludeArr);

    if (!q) {
      state.value = 'resume';
      return;
    }

    question.value = q;
    if (autoStart.value) {
      autoStart.value = false;
      timerRunning.value = true;
      state.value = 'answering';
    } else {
      state.value = 'ready';
    }
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Gagal memuat soal.';
    state.value = 'error';
  }
}

function startQuiz() {
  if (questionCount.value === 0 || !question.value) {
    loadQuestion();
    return;
  }

  timerRunning.value = true;
  state.value = 'answering';
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
    const res = await apiCheckAnswer(question.value.id, selectedKeys.value);
    result.value = res;
    answeredIds.value.add(question.value.id);
    sessionResults.value.push({ correct: res.correct, elapsed: finalTime.value });
    state.value = 'reviewing';
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Gagal memeriksa jawaban.';
    state.value = 'error';
  }
}

async function loadTopicInfo() {
  const querySubjectId = Number(route.query.subject_id);
  const queryTopicLabel = typeof route.query.topic_label === 'string' ? route.query.topic_label : '';

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
    const subjects = await fetchSubjects();
    const topicLists = await Promise.all(subjects.map((subject) => fetchTopics(subject.id)));
    const found = topicLists.flat().find((topic) => topic.id === getTopicId());

    if (found) {
      subjectId.value = found.subject_id;
      topicLabel.value = found.label;
    }
  } catch {
    subjectId.value = 1;
  }
}

async function loadQuestionCount() {
  try {
    questionCount.value = await fetchQuestionCount(getTopicId());
  } catch {
    questionCount.value = 0;
  }
}

async function retryCurrentState() {
  await Promise.all([
    loadTopicInfo(),
    loadQuestionCount(),
  ]);
  await loadQuestion();
}

function resetSession() {
  answeredIds.value = new Set();
  sessionResults.value = [];
  autoStart.value = false;
}

function hasActiveSession(): boolean {
  if (state.value === 'resume' || state.value === 'ready') return false;
  return state.value === 'answering' || state.value === 'reviewing' || answeredIds.value.size > 0;
}

function tryExit() {
  if (hasActiveSession()) {
    showExitModal.value = true;
  } else {
    router.push(`/topics/${subjectId.value}`);
  }
}

function cancelExit() {
  showExitModal.value = false;
  pendingExitRoute = null;
}

function confirmExit() {
  showExitModal.value = false;
  resetSession();
  state.value = 'ready';
  question.value = null;
  timerRunning.value = false;
  router.push(`/topics/${subjectId.value}`);
}

onBeforeRouteLeave((_to, _from, next) => {
  if (hasActiveSession()) {
    showExitModal.value = true;
    next(false);
  } else {
    next();
  }
});

watch(
  () => route.params.id,
  (newId) => {
    if (!newId) return;
    resetSession();
    loadTopicInfo();
    loadQuestionCount();
    loadQuestion();
  },
);

onMounted(() => {
  loadTopicInfo();
  loadQuestionCount();
  loadQuestion();
});
</script>

<style scoped>
.quiz-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.quiz-back {
  color: #556677;
  text-decoration: none;
  font-size: 0.95rem;
}

.quiz-back:hover {
  color: #1e40af;
}

.quiz-topic {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e40af;
}

.quiz-counter {
  margin-left: auto;
  font-size: 0.95rem;
  font-weight: 700;
  color: #556677;
  background: #e8edf5;
  padding: 4px 12px;
  border-radius: 8px;
}

.quiz-loading,
.quiz-ready,
.quiz-error {
  text-align: center;
  padding: 48px 16px;
  color: #778899;
  font-size: 1.1rem;
}

.quiz-error {
  color: #c53030;
}

.ready-text {
  font-size: 1.3rem;
  color: #445566;
  margin-bottom: 24px;
}

.ready-count {
  font-size: 1rem;
  color: #556677;
  margin-bottom: 16px;
  margin-top: -8px;
}

.ready-empty {
  font-size: 1rem;
  color: #778899;
  margin-bottom: 16px;
  margin-top: -8px;
}

.quiz-start-btn {
  padding: 16px 48px;
  background: #1e40af;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}

.quiz-start-btn:hover {
  background: #1c3a9c;
  transform: scale(1.03);
}

.quiz-resume {
  text-align: center;
  padding: 32px 16px;
}

.resume-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 32px;
}

.resume-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 400px;
  margin: 0 auto 32px;
}

.resume-stat {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.resume-value {
  display: block;
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a2b3c;
}

.resume-value.correct {
  color: #2f855a;
}

.resume-value.incorrect {
  color: #c53030;
}

.resume-label {
  display: block;
  font-size: 0.85rem;
  color: #778899;
  margin-top: 4px;
}

.quiz-back-btn {
  display: inline-block;
  padding: 10px 24px;
  background: #1e40af;
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
}

.quiz-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.quiz-options-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quiz-submit-btn {
  align-self: flex-end;
  padding: 12px 32px;
  background: #1e40af;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.quiz-submit-btn:hover:not(:disabled) {
  background: #1c3a9c;
}

.quiz-submit-btn:disabled {
  background: #aab4c0;
  cursor: default;
}

.quiz-retry-btn {
  margin-top: 16px;
  padding: 12px 28px;
  background: #1e40af;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.quiz-retry-btn:hover {
  background: #1c3a9c;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-box {
  background: #fff;
  border-radius: 16px;
  padding: 28px 32px;
  max-width: 340px;
  width: 90%;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.modal-text {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1a2b3c;
  margin-bottom: 8px;
}

.modal-sub {
  font-size: 0.9rem;
  color: #778899;
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.modal-btn-cancel {
  background: #e8edf5;
  color: #1e40af;
}

.modal-btn-cancel:hover {
  background: #d0d8e8;
}

.modal-btn-exit {
  background: #c53030;
  color: #fff;
}

.modal-btn-exit:hover {
  background: #b02828;
}
</style>
