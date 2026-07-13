import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import QuestionCard from '@/components/QuestionCard.vue';
import TimerBar from '@/components/TimerBar.vue';
import OptionList from '@/components/OptionList.vue';
import ExplanationPanel from '@/components/ExplanationPanel.vue';
import { useQuizSession } from '@/composables/useQuizSession';
import { fetchParticipant } from '@/api/client';
const route = useRoute();
const router = useRouter();
function getTopicId() {
    return Number(route.params.id);
}
const { accuracy, cancelExit: dismissExitModal, confirmExitState, correctCount, currentQuestionNumber, errorMessage, finalTime, finishSession, hasActiveSession, incorrectCount, initializeSession, isLastQuestion, nextQuestion, onSelectKeys, onTime, question, questionCount, resetSession, result, retryCurrentState, selectedKeys, showExitModal, startQuiz, state, subjectId, submitAnswer, timerRunning, topicLabel, totalTime, } = useQuizSession({
    getTopicId,
    getQuerySubjectId: () => Number(route.query.subject_id),
    getQueryTopicLabel: () => typeof route.query.topic_label === 'string' ? route.query.topic_label : '',
});
function tryExit() {
    if (hasActiveSession()) {
        showExitModal.value = true;
    }
    else {
        router.push(`/topics/${subjectId.value}`);
    }
}
function cancelExit() {
    dismissExitModal();
}
function confirmExit() {
    confirmExitState();
    router.push(`/topics/${subjectId.value}`);
}
onBeforeRouteLeave((_to, _from, next) => {
    if (hasActiveSession()) {
        showExitModal.value = true;
        next(false);
    }
    else {
        next();
    }
});
watch(() => route.params.id, (newId) => {
    if (!newId)
        return;
    resetSession();
    initializeSession();
});
const participant = ref(null);
onMounted(async () => {
    initializeSession();
    try {
        participant.value = await fetchParticipant();
    }
    catch (e) {
        // Ignore
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['quiz-back']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-error']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-start-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['resume-value']} */ ;
/** @type {__VLS_StyleScopedClasses['resume-value']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-submit-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-submit-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-retry-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-btn-cancel']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-btn-exit']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "quiz-view" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "quiz-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    ...{ onClick: (__VLS_ctx.tryExit) },
    href: "#",
    ...{ class: "quiz-back" },
});
if (__VLS_ctx.topicLabel) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "quiz-topic" },
    });
    (__VLS_ctx.topicLabel);
}
if (__VLS_ctx.state === 'answering' || __VLS_ctx.state === 'reviewing') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "quiz-counter" },
    });
    (__VLS_ctx.currentQuestionNumber);
    (__VLS_ctx.questionCount);
}
if (__VLS_ctx.state === 'loading') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "quiz-loading" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
}
else if (__VLS_ctx.state === 'ready') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "quiz-ready" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "ready-text" },
    });
    if (__VLS_ctx.questionCount > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "ready-count" },
        });
        (__VLS_ctx.questionCount);
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "ready-empty" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.startQuiz) },
        ...{ class: "quiz-start-btn" },
    });
}
else if (__VLS_ctx.state === 'resume') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "quiz-resume" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
        ...{ class: "resume-title" },
    });
    if (__VLS_ctx.participant) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "resume-participant-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "res-part-name" },
        });
        (__VLS_ctx.participant.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "res-part-meta" },
        });
        (__VLS_ctx.participant.institution);
        (__VLS_ctx.participant.ukkj.toUpperCase());
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "resume-stats" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "resume-stat" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "resume-value correct" },
    });
    (__VLS_ctx.correctCount);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "resume-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "resume-stat" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "resume-value incorrect" },
    });
    (__VLS_ctx.incorrectCount);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "resume-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "resume-stat" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "resume-value" },
    });
    (__VLS_ctx.totalTime);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "resume-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "resume-stat" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "resume-value" },
    });
    (__VLS_ctx.accuracy);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "resume-label" },
    });
    const __VLS_0 = {}.RouterLink;
    /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        to: (`/topics/${__VLS_ctx.subjectId}`),
        ...{ class: "quiz-back-btn" },
    }));
    const __VLS_2 = __VLS_1({
        to: (`/topics/${__VLS_ctx.subjectId}`),
        ...{ class: "quiz-back-btn" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_3.slots.default;
    var __VLS_3;
}
else if (__VLS_ctx.question) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "quiz-content" },
    });
    if (__VLS_ctx.state === 'answering') {
        /** @type {[typeof TimerBar, ]} */ ;
        // @ts-ignore
        const __VLS_4 = __VLS_asFunctionalComponent(TimerBar, new TimerBar({
            ...{ 'onTime': {} },
            running: (__VLS_ctx.timerRunning),
        }));
        const __VLS_5 = __VLS_4({
            ...{ 'onTime': {} },
            running: (__VLS_ctx.timerRunning),
        }, ...__VLS_functionalComponentArgsRest(__VLS_4));
        let __VLS_7;
        let __VLS_8;
        let __VLS_9;
        const __VLS_10 = {
            onTime: (__VLS_ctx.onTime)
        };
        var __VLS_6;
    }
    /** @type {[typeof QuestionCard, ]} */ ;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent(QuestionCard, new QuestionCard({
        type: (__VLS_ctx.question.type),
        difficulty: (__VLS_ctx.question.difficulty),
        text: (__VLS_ctx.question.question_text),
    }));
    const __VLS_12 = __VLS_11({
        type: (__VLS_ctx.question.type),
        difficulty: (__VLS_ctx.question.difficulty),
        text: (__VLS_ctx.question.question_text),
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "quiz-options-section" },
    });
    /** @type {[typeof OptionList, ]} */ ;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent(OptionList, new OptionList({
        ...{ 'onUpdate:selectedKeys': {} },
        options: (__VLS_ctx.question.options),
        type: (__VLS_ctx.question.type),
        selectedKeys: (__VLS_ctx.selectedKeys),
        disabled: (__VLS_ctx.state !== 'answering'),
        correctKeys: (__VLS_ctx.result?.correct_keys),
        showResult: (__VLS_ctx.state === 'reviewing'),
    }));
    const __VLS_15 = __VLS_14({
        ...{ 'onUpdate:selectedKeys': {} },
        options: (__VLS_ctx.question.options),
        type: (__VLS_ctx.question.type),
        selectedKeys: (__VLS_ctx.selectedKeys),
        disabled: (__VLS_ctx.state !== 'answering'),
        correctKeys: (__VLS_ctx.result?.correct_keys),
        showResult: (__VLS_ctx.state === 'reviewing'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
    let __VLS_17;
    let __VLS_18;
    let __VLS_19;
    const __VLS_20 = {
        'onUpdate:selectedKeys': (__VLS_ctx.onSelectKeys)
    };
    var __VLS_16;
    if (__VLS_ctx.state === 'answering') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.submitAnswer) },
            ...{ class: "quiz-submit-btn" },
            disabled: (__VLS_ctx.selectedKeys.length === 0),
        });
    }
    if (__VLS_ctx.state === 'reviewing' && __VLS_ctx.result) {
        /** @type {[typeof ExplanationPanel, ]} */ ;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent(ExplanationPanel, new ExplanationPanel({
            ...{ 'onNext': {} },
            ...{ 'onFinish': {} },
            correct: (__VLS_ctx.result.correct),
            correct_keys: (__VLS_ctx.result.correct_keys),
            explanation: (__VLS_ctx.result.explanation),
            elapsed_seconds: (__VLS_ctx.finalTime),
            is_last: (__VLS_ctx.isLastQuestion),
        }));
        const __VLS_22 = __VLS_21({
            ...{ 'onNext': {} },
            ...{ 'onFinish': {} },
            correct: (__VLS_ctx.result.correct),
            correct_keys: (__VLS_ctx.result.correct_keys),
            explanation: (__VLS_ctx.result.explanation),
            elapsed_seconds: (__VLS_ctx.finalTime),
            is_last: (__VLS_ctx.isLastQuestion),
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        let __VLS_24;
        let __VLS_25;
        let __VLS_26;
        const __VLS_27 = {
            onNext: (__VLS_ctx.nextQuestion)
        };
        const __VLS_28 = {
            onFinish: (__VLS_ctx.finishSession)
        };
        var __VLS_23;
    }
}
else if (__VLS_ctx.state === 'error') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "quiz-error" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.errorMessage);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.retryCurrentState) },
        ...{ class: "quiz-retry-btn" },
    });
}
if (__VLS_ctx.showExitModal) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.cancelExit) },
        ...{ class: "modal-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal-box" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "modal-text" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "modal-sub" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.cancelExit) },
        ...{ class: "modal-btn modal-btn-cancel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.confirmExit) },
        ...{ class: "modal-btn modal-btn-exit" },
    });
}
/** @type {__VLS_StyleScopedClasses['quiz-view']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-header']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-back']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-topic']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-counter']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-loading']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-ready']} */ ;
/** @type {__VLS_StyleScopedClasses['ready-text']} */ ;
/** @type {__VLS_StyleScopedClasses['ready-count']} */ ;
/** @type {__VLS_StyleScopedClasses['ready-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-start-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-resume']} */ ;
/** @type {__VLS_StyleScopedClasses['resume-title']} */ ;
/** @type {__VLS_StyleScopedClasses['resume-participant-card']} */ ;
/** @type {__VLS_StyleScopedClasses['res-part-name']} */ ;
/** @type {__VLS_StyleScopedClasses['res-part-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['resume-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['resume-stat']} */ ;
/** @type {__VLS_StyleScopedClasses['resume-value']} */ ;
/** @type {__VLS_StyleScopedClasses['correct']} */ ;
/** @type {__VLS_StyleScopedClasses['resume-label']} */ ;
/** @type {__VLS_StyleScopedClasses['resume-stat']} */ ;
/** @type {__VLS_StyleScopedClasses['resume-value']} */ ;
/** @type {__VLS_StyleScopedClasses['incorrect']} */ ;
/** @type {__VLS_StyleScopedClasses['resume-label']} */ ;
/** @type {__VLS_StyleScopedClasses['resume-stat']} */ ;
/** @type {__VLS_StyleScopedClasses['resume-value']} */ ;
/** @type {__VLS_StyleScopedClasses['resume-label']} */ ;
/** @type {__VLS_StyleScopedClasses['resume-stat']} */ ;
/** @type {__VLS_StyleScopedClasses['resume-value']} */ ;
/** @type {__VLS_StyleScopedClasses['resume-label']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-content']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-options-section']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-submit-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-error']} */ ;
/** @type {__VLS_StyleScopedClasses['quiz-retry-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-box']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-text']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-btn-cancel']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-btn-exit']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            QuestionCard: QuestionCard,
            TimerBar: TimerBar,
            OptionList: OptionList,
            ExplanationPanel: ExplanationPanel,
            accuracy: accuracy,
            correctCount: correctCount,
            currentQuestionNumber: currentQuestionNumber,
            errorMessage: errorMessage,
            finalTime: finalTime,
            finishSession: finishSession,
            incorrectCount: incorrectCount,
            isLastQuestion: isLastQuestion,
            nextQuestion: nextQuestion,
            onSelectKeys: onSelectKeys,
            onTime: onTime,
            question: question,
            questionCount: questionCount,
            result: result,
            retryCurrentState: retryCurrentState,
            selectedKeys: selectedKeys,
            showExitModal: showExitModal,
            startQuiz: startQuiz,
            state: state,
            subjectId: subjectId,
            submitAnswer: submitAnswer,
            timerRunning: timerRunning,
            topicLabel: topicLabel,
            totalTime: totalTime,
            tryExit: tryExit,
            cancelExit: cancelExit,
            confirmExit: confirmExit,
            participant: participant,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
