import { createRouter, createWebHistory } from 'vue-router';
import AuthView from '@/views/AuthView.vue';
import HomeView from '@/views/HomeView.vue';
import TopicView from '@/views/TopicView.vue';
import QuizView from '@/views/QuizView.vue';
async function getAuthEnabled() {
    try {
        const res = await fetch('/api/auth');
        if (!res.ok)
            return true;
        const data = await res.json();
        return Boolean(data.auth_enabled);
    }
    catch {
        return true;
    }
}
const routes = [
    { path: '/auth', name: 'auth', component: AuthView },
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
    router.beforeEach((to, _from, next) => {
        const token = sessionStorage.getItem('auth_token');
        const needsAuth = to.matched.some((r) => r.meta.requiresAuth);
        if (to.path === '/auth' && !authEnabled) {
            next('/');
        }
        else if (needsAuth && authEnabled && !token) {
            next('/auth');
        }
        else {
            next();
        }
    });
    return router;
}
