<template>
  <div class="topic-view">
    <router-link to="/" class="topic-back">&larr; Kembali</router-link>

    <h1 class="topic-title">{{ subjectLabel || 'Pilih Topik' }}</h1>
    <p class="topic-subtitle">Pilih topik yang ingin kamu kerjakan.</p>

    <div v-if="loading" class="topic-loading">Memuat...</div>

    <div v-else-if="error" class="topic-state">
      <p class="topic-error">{{ error }}</p>
      <button class="topic-action-btn" @click="loadTopicsData">Coba Lagi</button>
    </div>

    <div v-else-if="topics.length === 0" class="topic-state">
      <p class="topic-empty">Belum ada topik untuk mata uji ini.</p>
      <button class="topic-action-btn" @click="loadTopicsData">Muat Ulang</button>
    </div>

    <div v-else class="topic-list">
      <router-link
        v-for="topic in topics"
        :key="topic.id"
        :to="{ path: `/quiz/${topic.id}`, query: { subject_id: String(subjectId), topic_label: topic.label } }"
        class="topic-card"
      >
        <span class="topic-label">{{ topic.label }} <span class="topic-count">({{ topic.question_count }})</span></span>
        <span class="topic-arrow">&rarr;</span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { fetchTopics, fetchSubjects } from '@/api/client';
import type { Topic } from '@/types';

const route = useRoute();
const subjectId = Number(route.params.id);

const topics = ref<Topic[]>([]);
const subjectLabel = ref('');
const loading = ref(true);
const error = ref<string | null>(null);

async function loadTopicsData() {
  loading.value = true;
  error.value = null;

  try {
    const [fetchedTopics, subjects] = await Promise.all([
      fetchTopics(subjectId),
      fetchSubjects(),
    ]);
    topics.value = fetchedTopics;
    const subject = subjects.find((s) => s.id === subjectId);
    subjectLabel.value = subject?.label ?? '';
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal memuat data.';
  } finally {
    loading.value = false;
  }
}

onMounted(loadTopicsData);
</script>

<style scoped>
.topic-back {
  display: inline-block;
  color: #556677;
  text-decoration: none;
  margin-bottom: 20px;
  font-size: 0.95rem;
}

.topic-back:hover {
  color: #1e40af;
}

.topic-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 8px;
}

.topic-subtitle {
  color: #556677;
  margin-bottom: 32px;
}

.topic-state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.topic-loading,
.topic-error,
.topic-empty {
  color: #778899;
  font-style: italic;
}

.topic-error {
  color: #c53030;
}

.topic-action-btn {
  padding: 10px 18px;
  background: #1e40af;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.topic-action-btn:hover {
  background: #1c3a9c;
}

.topic-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.topic-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  color: #1a2b3c;
  font-size: 1.1rem;
  font-weight: 600;
  transition: box-shadow 0.15s, transform 0.15s;
}

.topic-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.topic-count {
  font-size: 0.85rem;
  color: #8899aa;
  font-weight: 400;
}

.topic-arrow {
  color: #1e40af;
  font-size: 1.3rem;
}
</style>
