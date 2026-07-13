<template>
  <div class="participant-view">
    <div class="participant-box">
      <h1 class="participant-title">Data Peserta</h1>
      <p class="participant-subtitle">Lengkapi data diri Anda sebelum memulai latihan soal.</p>

      <form class="participant-form" @submit.prevent="handleSubmit">
        <!-- Nama Field -->
        <div class="form-group">
          <label for="name">Nama Lengkap</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            class="form-input"
            placeholder="Masukkan Nama Lengkap Anda"
            required
            :disabled="saving"
          />
        </div>

        <!-- Instansi Field (Autocomplete) -->
        <div class="form-group autocomplete-container">
          <label for="institution">Instansi / Sekolah</label>
          <div class="input-wrapper">
            <input
              id="institution"
              v-model="form.institution"
              type="text"
              class="form-input"
              placeholder="Cari atau ketik nama Instansi/Sekolah"
              required
              :disabled="saving"
              @input="onInstitutionInput"
              @focus="showSuggestions = true"
              @blur="handleBlur"
            />
            <span v-if="loadingSchools" class="spinner"></span>
          </div>

          <!-- Suggestions Dropdown -->
          <ul v-if="showSuggestions && suggestions.length > 0" class="suggestions-list">
            <li
              v-for="(school, index) in suggestions"
              :key="index"
              class="suggestion-item"
              @mousedown="selectSchool(school)"
            >
              {{ school }}
            </li>
          </ul>
          <p class="helper-text">
            *Ketik langsung jika instansi Anda tidak muncul dalam pencarian.
          </p>
        </div>

        <!-- UKKJ Field -->
        <div class="form-group">
          <label for="ukkj">UKKJ</label>
          <select
            id="ukkj"
            v-model="form.ukkj"
            class="form-select"
            required
            :disabled="saving"
          >
            <option value="" disabled selected>Pilih UKKJ</option>
            <option value="3c">3c</option>
            <option value="4a">4a</option>
            <option value="4d">4d</option>
          </select>
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>

        <button type="submit" class="submit-btn" :disabled="saving || !isFormValid">
          {{ saving ? 'Menyimpan...' : 'Lanjut Pilih Soal Latihan' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { saveParticipant, fetchParticipant } from '@/api/client';
import type { Participant } from '@/types';

const router = useRouter();
const saving = ref(false);
const error = ref('');

const form = reactive({
  name: '',
  institution: '',
  ukkj: '' as Participant['ukkj'] | '',
});

// Autocomplete State
const suggestions = ref<string[]>([]);
const loadingSchools = ref(false);
const showSuggestions = ref(false);
let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

const isFormValid = computed(() => {
  return form.name.trim().length > 0 && 
         form.institution.trim().length > 0 && 
         form.ukkj !== '';
});

onMounted(async () => {
  // Try to pre-fill if data already exists in database/session
  try {
    const data = await fetchParticipant();
    if (data) {
      form.name = data.name;
      form.institution = data.institution;
      form.ukkj = data.ukkj;
    }
  } catch (e) {
    // Ignore error, let user fill manually
  }
});

function onInstitutionInput() {
  const query = form.institution.trim();
  if (query.length < 3) {
    suggestions.value = [];
    return;
  }

  if (debounceTimeout) clearTimeout(debounceTimeout);

  debounceTimeout = setTimeout(async () => {
    loadingSchools.value = true;
    try {
      const res = await fetch(`https://api-sekolah-indonesia.vercel.app/sekolah/s?sekolah=${encodeURIComponent(query)}`);
      if (res.ok) {
        const body = await res.json() as { data?: Array<{ sekolah: string }> };
        if (body.data && Array.isArray(body.data)) {
          suggestions.value = body.data.map(item => item.sekolah);
        } else {
          suggestions.value = [];
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data sekolah:', err);
    } finally {
      loadingSchools.value = false;
    }
  }, 350);
}

function selectSchool(schoolName: string) {
  form.institution = schoolName;
  suggestions.value = [];
  showSuggestions.value = false;
}

function handleBlur() {
  // Delay slightly to allow mousedown on suggestions to trigger first
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
}

async function handleSubmit() {
  if (!isFormValid.value) return;

  saving.value = true;
  error.value = '';

  try {
    await saveParticipant({
      name: form.name.trim(),
      institution: form.institution.trim(),
      ukkj: form.ukkj as Participant['ukkj'],
    });

    // Mark as filled in session storage to pass routing guard without extra calls
    sessionStorage.setItem('participant_filled', 'true');
    router.push('/');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal menyimpan data peserta.';
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.participant-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  padding: 16px 0;
}

.participant-box {
  background: #fff;
  border-radius: 16px;
  padding: 40px 32px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.participant-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 8px;
  text-align: center;
}

.participant-subtitle {
  color: #556677;
  margin-bottom: 32px;
  font-size: 0.95rem;
  text-align: center;
  line-height: 1.4;
}

.participant-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input,
.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #d4dde6;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  background-color: #fff;
  color: #1e293b;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.form-input:focus,
.form-select:focus {
  border-color: #1e40af;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.15);
}

.form-input:disabled,
.form-select:disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
}

.autocomplete-container {
  position: relative;
}

.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  margin-top: 4px;
  padding: 0;
  list-style: none;
}

.suggestion-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #334155;
  transition: background-color 0.15s;
  text-align: left;
}

.suggestion-item:hover {
  background-color: #f1f5f9;
}

.helper-text {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 2px;
}

.spinner {
  position: absolute;
  right: 14px;
  width: 20px;
  height: 20px;
  border: 2px solid #cbd5e1;
  border-top-color: #1e40af;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-error {
  color: #c53030;
  font-size: 0.9rem;
  text-align: center;
}

.submit-btn {
  padding: 14px;
  background: #1e40af;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  margin-top: 10px;
}

.submit-btn:hover:not(:disabled) {
  background: #1c3a9c;
}

.submit-btn:disabled {
  background: #aab4c0;
  cursor: not-allowed;
}
</style>
