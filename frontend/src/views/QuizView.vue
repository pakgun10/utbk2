<template>
  <div class="quiz-view">
    <div class="quiz-header">
      <router-link :to="`/topics/${subjectId}`" class="quiz-back">&larr; Ganti Topik</router-link>
      <span v-if="topicLabel" class="quiz-topic">{{ topicLabel }}</span>
    </div>

    <div v-if="state === 'loading'" class="quiz-loading">
      <p>Memuat soal...</p>
    </div>

    <div v-else-if="state === 'ready'" class="quiz-ready">
      <p class="ready-text">Siap berlatih?</p>
      <p v-if="questionCount > 0" class="ready-count">{{ questionCount }} soal tersedia</p>
      <button class="quiz-start-btn" @click="startQuiz">Mulai</button>
    </div>

    <div v-else-if="state === 'no-question'" class="quiz-empty">
      <p>Tidak ada soal lagi untuk topik ini.</p>
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
        @next="nextQuestion"
      />
    </div>

    <div v-else-if="state === 'error'" class="quiz-error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  fetchRandomQuestion,
  checkAnswer as apiCheckAnswer,
  fetchTopics,
  fetchQuestionCount,
} from '@/api/client';
import type { Question, CheckResult } from '@/types';
import QuestionCard from '@/components/QuestionCard.vue';
import TimerBar from '@/components/TimerBar.vue';
import OptionList from '@/components/OptionList.vue';
import ExplanationPanel from '@/components/ExplanationPanel.vue';

const route = useRoute();

function getTopicId(): number {
  return Number(route.params.id);
}

type QuizState = 'loading' | 'ready' | 'answering' | 'reviewing' | 'no-question' | 'error';

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

function nextQuestion() {
  autoStart.value = true;
  loadQuestion();
}

async function loadQuestion() {
  state.value = 'loading';
  result.value = null;
  selectedKeys.value = [];
  finalTime.value = 0;

  try {
    const q = await fetchRandomQuestion(getTopicId());
    if (!q) {
      state.value = 'no-question';
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
  timerRunning.value = true;
  state.value = 'answering';
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
    state.value = 'reviewing';
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Gagal memeriksa jawaban.';
    state.value = 'error';
  }
}

async function loadTopicInfo() {
  try {
    const topics = await fetchTopics(getTopicId());
    const t = topics[0];
    if (t) {
      subjectId.value = t.subject_id;
      topicLabel.value = t.label;
    } else {
      const allTopics = await Promise.all([
        fetchTopics(1), fetchTopics(2), fetchTopics(3), fetchTopics(4),
      ]);
      const flat = allTopics.flat();
      const found = flat.find((tp) => tp.id === getTopicId());
      if (found) {
        subjectId.value = found.subject_id;
        topicLabel.value = found.label;
      }
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

watch(
  () => route.params.id,
  (newId) => {
    if (!newId) return;
    autoStart.value = false;
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

.quiz-loading,
.quiz-ready,
.quiz-empty,
.quiz-error {
  text-align: center;
  padding: 48px 16px;
  color: #778899;
  font-size: 1.1rem;
}

.quiz-error {
  color: #c53030;
}

.quiz-empty p {
  margin-bottom: 20px;
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
</style>
