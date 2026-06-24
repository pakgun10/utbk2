import { computed } from 'vue';
const props = defineProps();
const typeLabel = computed(() => {
    switch (props.type) {
        case 'single_choice': return 'Pilihan Ganda';
        case 'multiple_response': return 'Pilihan Ganda Kompleks';
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['question-difficulty-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['question-difficulty-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['question-difficulty-badge']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "question-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "question-meta" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "question-type-badge" },
});
(__VLS_ctx.typeLabel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "question-difficulty-badge" },
    ...{ class: (__VLS_ctx.difficulty) },
});
(__VLS_ctx.difficultyLabel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "question-text" },
});
(__VLS_ctx.text);
/** @type {__VLS_StyleScopedClasses['question-card']} */ ;
/** @type {__VLS_StyleScopedClasses['question-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['question-type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['question-difficulty-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['question-text']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            typeLabel: typeLabel,
            difficultyLabel: difficultyLabel,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
