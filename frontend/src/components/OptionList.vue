<template>
  <div class="option-list">
    <div
      v-for="option in options"
      :key="option.key"
      class="option-item"
      :class="{
        'option-selected': isSelected(option.key),
        'option-correct': showResult && type !== 'multiple_choice' && isCorrectKey(option.key),
        'option-wrong': showResult && type !== 'multiple_choice' && isSelected(option.key) && !isCorrectKey(option.key),
        'option-best': showResult && type === 'multiple_choice' && isBestKey(option.key),
        'option-scored-wrong': showResult && type === 'multiple_choice' && isSelected(option.key) && (option.score ?? 0) < 0,
        'option-disabled': disabled,
      }"
      @click="toggle(option.key)"
    >
      <span class="option-marker">
        <span v-if="isMulti" class="option-checkbox" :class="{ checked: isSelected(option.key) }">
          <span v-if="isSelected(option.key)">&#10003;</span>
        </span>
        <span v-else class="option-radio" :class="{ checked: isSelected(option.key) }">
          <span v-if="isSelected(option.key)" class="radio-dot"></span>
        </span>
      </span>
      <span class="option-text">{{ option.text }}</span>
      <span
        v-if="type === 'multiple_choice' && showResult && option.score !== undefined"
        class="option-score-badge"
        :class="{
          'score-positive': (option.score ?? 0) > 0,
          'score-negative': (option.score ?? 0) < 0,
          'score-zero': (option.score ?? 0) === 0,
        }"
      >
        {{ (option.score ?? 0) > 0 ? '+' : '' }}{{ option.score }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QuestionOption } from '@/types';

const props = defineProps<{
  options: QuestionOption[];
  type: string;
  selectedKeys: string[];
  disabled: boolean;
  correctKeys?: string[];
  bestKeys?: string[];
  showResult?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:selectedKeys', keys: string[]): void;
}>();

const isMulti = computed(() => props.type === 'multiple_response');

function isSelected(key: string): boolean {
  return props.selectedKeys.includes(key);
}

function isCorrectKey(key: string): boolean {
  return props.correctKeys?.includes(key) ?? false;
}

function isBestKey(key: string): boolean {
  return props.bestKeys?.includes(key) ?? false;
}

function toggle(key: string) {
  if (props.disabled) return;

  if (isMulti.value) {
    const next = isSelected(key)
      ? props.selectedKeys.filter((k) => k !== key)
      : [...props.selectedKeys, key];
    emit('update:selectedKeys', next);
  } else {
    emit('update:selectedKeys', [key]);
  }
}
</script>

<style scoped>
.option-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.option-item:hover:not(.option-disabled) {
  border-color: #1e40af;
}

.option-selected {
  border-color: #1e40af;
  background: #f0f4ff;
}

.option-correct {
  border-color: #2f855a;
  background: #e6ffe6;
}

.option-wrong,
.option-scored-wrong {
  border-color: #c53030;
  background: #ffe6e6;
}

.option-disabled {
  cursor: default;
  opacity: 0.8;
}

.option-marker {
  flex-shrink: 0;
}

.option-radio,
.option-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 2px solid #aab4c0;
  border-radius: 50%;
  font-size: 0.8rem;
}

.option-checkbox {
  border-radius: 5px;
}

.option-radio.checked,
.option-checkbox.checked {
  border-color: #1e40af;
  background: #1e40af;
  color: #fff;
}

.radio-dot {
  display: block;
  width: 10px;
  height: 10px;
  background: #1e40af;
  border-radius: 50%;
}

.option-radio.checked .radio-dot {
  background: #fff;
}

.option-key {
  font-weight: 700;
  color: #556677;
  font-size: 0.95rem;
  min-width: 24px;
}

.option-text {
  font-size: 1rem;
}

.option-score-badge {
  margin-left: auto;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 2px 8px;
  border-radius: 6px;
}

.score-positive {
  color: #2f855a;
  background: #e6ffe6;
}

.score-negative {
  color: #c53030;
  background: #ffe6e6;
}

.score-zero {
  color: #778899;
  background: #f0f0f0;
}

.option-best {
  border-color: #2f855a;
  background: #e6ffe6;
}
</style>
