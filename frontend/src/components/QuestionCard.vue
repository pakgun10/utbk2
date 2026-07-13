<template>
  <div class="question-card">
    <div class="question-meta">
      <span class="question-type-badge">{{ typeLabel }}</span>
      <span class="question-difficulty-badge" :class="difficulty">{{ difficultyLabel }}</span>
    </div>
    <p class="question-text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  type: string;
  difficulty: string;
  text: string;
}>();

const typeLabel = computed(() => {
  switch (props.type) {
    case 'single_choice': return 'Pilihan Ganda';
    case 'multiple_response': return 'Pilihan Ganda Kompleks';
    case 'multiple_choice': return 'Skor Bertingkat';
    case 'true_false': return 'Benar - Salah';
    default: return props.type;
  }
});

const difficultyLabel = computed(() => {
  switch (props.difficulty) {
    case 'easy': return 'Mudah';
    case 'medium': return 'Sedang';
    case 'hard': return 'Sulit';
    default: return props.difficulty;
  }
});
</script>

<style scoped>
.question-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.question-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.question-type-badge {
  display: inline-block;
  padding: 2px 10px;
  background: #e8edf5;
  color: #1e40af;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.question-difficulty-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.question-difficulty-badge.easy {
  background: #e6ffe6;
  color: #2f855a;
}

.question-difficulty-badge.medium {
  background: #fff3cd;
  color: #b7791f;
}

.question-difficulty-badge.hard {
  background: #ffe6e6;
  color: #c53030;
}

.question-text {
  font-size: 1.1rem;
  line-height: 1.8;
  white-space: pre-wrap;
}
</style>
