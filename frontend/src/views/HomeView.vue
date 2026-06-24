<template>
  <div class="home-view">
    <h1 class="home-title">Pilih Mata Uji</h1>
    <p class="home-subtitle">Pilih salah satu mata uji UTBK untuk mulai berlatih.</p>

    <div v-if="loading" class="home-loading">Memuat...</div>

    <div v-else-if="error" class="home-state">
      <p class="home-error">{{ error }}</p>
      <button class="home-action-btn" @click="loadSubjects">Coba Lagi</button>
    </div>

    <div v-else-if="subjects.length === 0" class="home-state">
      <p class="home-empty">Belum ada mata uji yang tersedia.</p>
      <button class="home-action-btn" @click="loadSubjects">Muat Ulang</button>
    </div>

    <div v-else class="subject-grid">
      <router-link
        v-for="subject in subjects"
        :key="subject.id"
        :to="`/topics/${subject.id}`"
        class="subject-card"
      >
        <span class="subject-label">{{ subject.label }}</span>
        <span class="subject-arrow">&rarr;</span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchSubjects } from '@/api/client';
import type { Subject } from '@/types';

const subjects = ref<Subject[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

async function loadSubjects() {
  loading.value = true;
  error.value = null;

  try {
    subjects.value = await fetchSubjects();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal memuat data.';
  } finally {
    loading.value = false;
  }
}

onMounted(loadSubjects);
</script>

<style scoped>
.home-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 8px;
}

.home-subtitle {
  color: #556677;
  margin-bottom: 32px;
}

.home-state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.home-loading,
.home-error,
.home-empty {
  color: #778899;
  font-style: italic;
}

.home-error {
  color: #c53030;
}

.home-action-btn {
  padding: 10px 18px;
  background: #1e40af;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.home-action-btn:hover {
  background: #1c3a9c;
}

.subject-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subject-card {
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

.subject-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.subject-arrow {
  color: #1e40af;
  font-size: 1.3rem;
}
</style>
