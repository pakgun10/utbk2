import { computed } from 'vue';
const props = defineProps();
const emit = defineEmits();
const isMulti = computed(() => props.type === 'multiple_response');
function isSelected(key) {
    return props.selectedKeys.includes(key);
}
function isCorrectKey(key) {
    return props.correctKeys?.includes(key) ?? false;
}
function toggle(key) {
    if (props.disabled)
        return;
    if (isMulti.value) {
        const next = isSelected(key)
            ? props.selectedKeys.filter((k) => k !== key)
            : [...props.selectedKeys, key];
        emit('update:selectedKeys', next);
    }
    else {
        emit('update:selectedKeys', [key]);
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['option-item']} */ ;
/** @type {__VLS_StyleScopedClasses['option-disabled']} */ ;
/** @type {__VLS_StyleScopedClasses['option-checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['option-radio']} */ ;
/** @type {__VLS_StyleScopedClasses['option-checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['checked']} */ ;
/** @type {__VLS_StyleScopedClasses['option-radio']} */ ;
/** @type {__VLS_StyleScopedClasses['checked']} */ ;
/** @type {__VLS_StyleScopedClasses['radio-dot']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "option-list" },
});
for (const [option] of __VLS_getVForSourceType((__VLS_ctx.options))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.toggle(option.key);
            } },
        key: (option.key),
        ...{ class: "option-item" },
        ...{ class: ({
                'option-selected': __VLS_ctx.isSelected(option.key),
                'option-correct': __VLS_ctx.showResult && __VLS_ctx.isCorrectKey(option.key),
                'option-wrong': __VLS_ctx.showResult && __VLS_ctx.isSelected(option.key) && !__VLS_ctx.isCorrectKey(option.key),
                'option-disabled': __VLS_ctx.disabled,
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "option-marker" },
    });
    if (__VLS_ctx.isMulti) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "option-checkbox" },
            ...{ class: ({ checked: __VLS_ctx.isSelected(option.key) }) },
        });
        if (__VLS_ctx.isSelected(option.key)) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "option-radio" },
            ...{ class: ({ checked: __VLS_ctx.isSelected(option.key) }) },
        });
        if (__VLS_ctx.isSelected(option.key)) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "radio-dot" },
            });
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "option-key" },
    });
    (option.key);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "option-text" },
    });
    (option.text);
}
/** @type {__VLS_StyleScopedClasses['option-list']} */ ;
/** @type {__VLS_StyleScopedClasses['option-item']} */ ;
/** @type {__VLS_StyleScopedClasses['option-marker']} */ ;
/** @type {__VLS_StyleScopedClasses['option-checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['option-radio']} */ ;
/** @type {__VLS_StyleScopedClasses['radio-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['option-key']} */ ;
/** @type {__VLS_StyleScopedClasses['option-text']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            isMulti: isMulti,
            isSelected: isSelected,
            isCorrectKey: isCorrectKey,
            toggle: toggle,
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
