import { computed } from 'vue';
const props = defineProps();
const __VLS_emit = defineEmits();
const isCorrect = computed(() => props.correct);
const formattedTime = computed(() => {
    const m = Math.floor(props.elapsed_seconds / 60);
    const s = props.elapsed_seconds % 60;
    return `Waktu: ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});
const correctKeysDisplay = computed(() => props.correct_keys.join(', '));
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['explanation-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['explanation-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['explanation-body']} */ ;
/** @type {__VLS_StyleScopedClasses['explanation-next']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "explanation-panel" },
    ...{ class: ({ correct: __VLS_ctx.isCorrect, incorrect: !__VLS_ctx.isCorrect }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "explanation-header" },
});
if (__VLS_ctx.isCorrect) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "explanation-status correct-status" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "explanation-status incorrect-status" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "explanation-time" },
});
(__VLS_ctx.formattedTime);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "explanation-answer" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "correct-keys" },
});
(__VLS_ctx.correctKeysDisplay);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "explanation-body" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.explanation);
if (__VLS_ctx.is_last) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.is_last))
                    return;
                __VLS_ctx.$emit('finish');
            } },
        ...{ class: "explanation-next" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.is_last))
                    return;
                __VLS_ctx.$emit('next');
            } },
        ...{ class: "explanation-next" },
    });
}
/** @type {__VLS_StyleScopedClasses['explanation-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['explanation-header']} */ ;
/** @type {__VLS_StyleScopedClasses['explanation-status']} */ ;
/** @type {__VLS_StyleScopedClasses['correct-status']} */ ;
/** @type {__VLS_StyleScopedClasses['explanation-status']} */ ;
/** @type {__VLS_StyleScopedClasses['incorrect-status']} */ ;
/** @type {__VLS_StyleScopedClasses['explanation-time']} */ ;
/** @type {__VLS_StyleScopedClasses['explanation-answer']} */ ;
/** @type {__VLS_StyleScopedClasses['correct-keys']} */ ;
/** @type {__VLS_StyleScopedClasses['explanation-body']} */ ;
/** @type {__VLS_StyleScopedClasses['explanation-next']} */ ;
/** @type {__VLS_StyleScopedClasses['explanation-next']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            isCorrect: isCorrect,
            formattedTime: formattedTime,
            correctKeysDisplay: correctKeysDisplay,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
