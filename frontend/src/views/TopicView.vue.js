import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { fetchTopics, fetchSubjects } from '@/api/client';
const route = useRoute();
const subjectId = Number(route.params.id);
const topics = ref([]);
const subjectLabel = ref('');
const loading = ref(true);
const error = ref(null);
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
    }
    catch (e) {
        error.value = e instanceof Error ? e.message : 'Gagal memuat data.';
    }
    finally {
        loading.value = false;
    }
}
onMounted(loadTopicsData);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['topic-back']} */ ;
/** @type {__VLS_StyleScopedClasses['topic-error']} */ ;
/** @type {__VLS_StyleScopedClasses['topic-action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['topic-card']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "topic-view" },
});
const __VLS_0 = {}.RouterLink;
/** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    to: "/",
    ...{ class: "topic-back" },
}));
const __VLS_2 = __VLS_1({
    to: "/",
    ...{ class: "topic-back" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "topic-title" },
});
(__VLS_ctx.subjectLabel || 'Pilih Topik');
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "topic-subtitle" },
});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "topic-loading" },
    });
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "topic-state" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "topic-error" },
    });
    (__VLS_ctx.error);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.loadTopicsData) },
        ...{ class: "topic-action-btn" },
    });
}
else if (__VLS_ctx.topics.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "topic-state" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "topic-empty" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.loadTopicsData) },
        ...{ class: "topic-action-btn" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "topic-list" },
    });
    for (const [topic] of __VLS_getVForSourceType((__VLS_ctx.topics))) {
        const __VLS_4 = {}.RouterLink;
        /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
        // @ts-ignore
        const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
            key: (topic.id),
            to: ({ path: `/quiz/${topic.id}`, query: { subject_id: String(__VLS_ctx.subjectId), topic_label: topic.label } }),
            ...{ class: "topic-card" },
        }));
        const __VLS_6 = __VLS_5({
            key: (topic.id),
            to: ({ path: `/quiz/${topic.id}`, query: { subject_id: String(__VLS_ctx.subjectId), topic_label: topic.label } }),
            ...{ class: "topic-card" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_5));
        __VLS_7.slots.default;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "topic-label" },
        });
        (topic.label);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "topic-count" },
        });
        (topic.question_count);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "topic-arrow" },
        });
        var __VLS_7;
    }
}
/** @type {__VLS_StyleScopedClasses['topic-view']} */ ;
/** @type {__VLS_StyleScopedClasses['topic-back']} */ ;
/** @type {__VLS_StyleScopedClasses['topic-title']} */ ;
/** @type {__VLS_StyleScopedClasses['topic-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['topic-loading']} */ ;
/** @type {__VLS_StyleScopedClasses['topic-state']} */ ;
/** @type {__VLS_StyleScopedClasses['topic-error']} */ ;
/** @type {__VLS_StyleScopedClasses['topic-action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['topic-state']} */ ;
/** @type {__VLS_StyleScopedClasses['topic-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['topic-action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['topic-list']} */ ;
/** @type {__VLS_StyleScopedClasses['topic-card']} */ ;
/** @type {__VLS_StyleScopedClasses['topic-label']} */ ;
/** @type {__VLS_StyleScopedClasses['topic-count']} */ ;
/** @type {__VLS_StyleScopedClasses['topic-arrow']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            subjectId: subjectId,
            topics: topics,
            subjectLabel: subjectLabel,
            loading: loading,
            error: error,
            loadTopicsData: loadTopicsData,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
