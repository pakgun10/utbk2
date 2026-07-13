import { createRouter, createWebHistory } from 'vue-router';
import AuthView from '@/views/AuthView.vue';
import HomeView from '@/views/HomeView.vue';
import TopicView from '@/views/TopicView.vue';
import QuizView from '@/views/QuizView.vue';
import ParticipantView from '@/views/ParticipantView.vue';
import { fetchParticipant } from '@/api/client';

async function getAuthEnabled(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth');
    if (!res.ok) return true;
    const data = await res.json() as { auth_enabled?: boolean };
    return Boolean(data.auth_enabled);
  } catch {
    return true;
  }
}

const routes = [
  { path: '/auth', name: 'auth', component: AuthView },
  { path: '/data-peserta', name: 'participant', component: ParticipantView, meta: { requiresAuth: true } },
  { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
  { path: '/topics/:id', name: 'topics', component: TopicView, meta: { requiresAuth: true } },
  { path: '/quiz/:id', name: 'quiz', component: QuizView, meta: { requiresAuth: true } },
];

export async function buildRouter() {
  const authEnabled = await getAuthEnabled();

  const router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.beforeEach(async (to, _from, next) => {
    const token = sessionStorage.getItem('auth_token');
    const needsAuth = to.matched.some((r) => r.meta.requiresAuth);

    if (to.path === '/auth' && !authEnabled) {
      next('/');
      return;
    }

    if (needsAuth && authEnabled) {
      if (!token) {
        next('/auth');
        return;
      }

      const filled = sessionStorage.getItem('participant_filled') === 'true';
      if (!filled && to.path !== '/data-peserta') {
        try {
          const participant = await fetchParticipant();
          if (participant) {
            sessionStorage.setItem('participant_filled', 'true');
            next();
          } else {
            next('/data-peserta');
          }
        } catch {
          next('/data-peserta');
        }
        return;
      }
    }

    next();
  });

  return router;
}

