import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const password = ref('');
const loading = ref(false);
const error = ref('');
onMounted(async () => {
    try {
        const res = await fetch('/api/auth');
        if (!res.ok)
            return;
        const data = await res.json();
        if (!data.auth_enabled) {
            router.replace('/');
        }
    }
    catch {
        // Let the login form handle server connectivity issues when submitted.
    }
});
async function login() {
    if (!password.value)
        return;
    loading.value = true;
    error.value = '';
    try {
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: password.value }),
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            error.value = body.message || 'Gagal login.';
            return;
        }
        const data = await res.json();
        sessionStorage.setItem('auth_token', data.token);
        router.push('/');
    }
    catch {
        error.value = 'Tidak dapat terhubung ke server.';
    }
    finally {
        loading.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['auth-input']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-view" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-box" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "auth-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "auth-subtitle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.login) },
    ...{ class: "auth-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "password",
    ...{ class: "auth-input" },
    placeholder: "Password",
    autofocus: true,
    disabled: (__VLS_ctx.loading),
});
(__VLS_ctx.password);
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "auth-error" },
    });
    (__VLS_ctx.error);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
    ...{ class: "auth-btn" },
    disabled: (__VLS_ctx.loading || !__VLS_ctx.password),
});
(__VLS_ctx.loading ? 'Memverifikasi...' : 'Masuk');
/** @type {__VLS_StyleScopedClasses['auth-view']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-box']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-title']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-input']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-error']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            password: password,
            loading: loading,
            error: error,
            login: login,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
