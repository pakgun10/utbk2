import { ref, computed, watch, onBeforeUnmount } from 'vue';
const props = defineProps();
const emit = defineEmits();
const elapsed = ref(0);
let intervalId = null;
const formatted = computed(() => {
    const m = Math.floor(elapsed.value / 60);
    const s = elapsed.value % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});
const __VLS_exposed = { formatted };
defineExpose(__VLS_exposed);
watch(() => props.running, (val) => {
    if (val) {
        elapsed.value = 0;
        intervalId = setInterval(() => {
            elapsed.value++;
            emit('time', elapsed.value);
        }, 1000);
    }
    else {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        emit('time', elapsed.value);
    }
}, { immediate: true });
onBeforeUnmount(() => {
    if (intervalId) {
        clearInterval(intervalId);
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "timer-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "timer-icon" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "timer-value" },
});
(__VLS_ctx.formatted);
/** @type {__VLS_StyleScopedClasses['timer-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['timer-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['timer-value']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            formatted: formatted,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {
            ...__VLS_exposed,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
