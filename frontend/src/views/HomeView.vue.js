import { ref, onMounted } from 'vue';
import { fetchSubjects } from '@/api/client';
const subjects = ref([]);
const loading = ref(true);
const error = ref(null);
async function loadSubjects() {
    loading.value = true;
    error.value = null;
    try {
        subjects.value = await fetchSubjects();
    }
    catch (e) {
        error.value = e instanceof Error ? e.message : 'Gagal memuat data.';
    }
    finally {
        loading.value = false;
    }
}
onMounted(loadSubjects);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['home-error']} */ ;
/** @type {__VLS_StyleScopedClasses['home-action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['subject-card']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "home-view" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "home-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "home-subtitle" },
});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "home-loading" },
    });
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "home-state" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "home-error" },
    });
    (__VLS_ctx.error);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.loadSubjects) },
        ...{ class: "home-action-btn" },
    });
}
else if (__VLS_ctx.subjects.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "home-state" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "home-empty" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.loadSubjects) },
        ...{ class: "home-action-btn" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "subject-grid" },
    });
    for (const [subject] of __VLS_getVForSourceType((__VLS_ctx.subjects))) {
        const __VLS_0 = {}.RouterLink;
        /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
            key: (subject.id),
            to: (`/topics/${subject.id}`),
            ...{ class: "subject-card" },
        }));
        const __VLS_2 = __VLS_1({
            key: (subject.id),
            to: (`/topics/${subject.id}`),
            ...{ class: "subject-card" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        __VLS_3.slots.default;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "subject-label" },
        });
        (subject.label);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "subject-arrow" },
        });
        var __VLS_3;
    }
}
/** @type {__VLS_StyleScopedClasses['home-view']} */ ;
/** @type {__VLS_StyleScopedClasses['home-title']} */ ;
/** @type {__VLS_StyleScopedClasses['home-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['home-loading']} */ ;
/** @type {__VLS_StyleScopedClasses['home-state']} */ ;
/** @type {__VLS_StyleScopedClasses['home-error']} */ ;
/** @type {__VLS_StyleScopedClasses['home-action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['home-state']} */ ;
/** @type {__VLS_StyleScopedClasses['home-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['home-action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['subject-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['subject-card']} */ ;
/** @type {__VLS_StyleScopedClasses['subject-label']} */ ;
/** @type {__VLS_StyleScopedClasses['subject-arrow']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            subjects: subjects,
            loading: loading,
            error: error,
            loadSubjects: loadSubjects,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
