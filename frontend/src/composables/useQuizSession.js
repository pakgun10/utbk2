import { computed, ref } from 'vue';
import { checkAnswer as apiCheckAnswer, fetchQuestionCount, fetchRandomQuestion, fetchTopic, } from '@/api/client';
export function useQuizSession(options) {
    const state = ref('loading');
    const question = ref(null);
    const result = ref(null);
    const selectedKeys = ref([]);
    const timerRunning = ref(false);
    const finalTime = ref(0);
    const errorMessage = ref('');
    const subjectId = ref(0);
    const topicLabel = ref('');
    const questionCount = ref(0);
    const autoStart = ref(false);
    const answeredIds = ref(new Set());
    const sessionResults = ref([]);
    const showExitModal = ref(false);
    const currentQuestionNumber = computed(() => {
        if (state.value === 'reviewing')
            return answeredIds.value.size;
        return answeredIds.value.size + 1;
    });
    const correctCount = computed(() => sessionResults.value.filter((entry) => entry.correct).length);
    const incorrectCount = computed(() => sessionResults.value.filter((entry) => !entry.correct).length);
    const totalTime = computed(() => {
        const total = sessionResults.value.reduce((sum, entry) => sum + entry.elapsed, 0);
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    });
    const accuracy = computed(() => {
        if (sessionResults.value.length === 0)
            return 0;
        return Math.round((correctCount.value / sessionResults.value.length) * 100);
    });
    const isLastQuestion = computed(() => answeredIds.value.size >= questionCount.value);
    async function loadQuestion() {
        state.value = 'loading';
        result.value = null;
        selectedKeys.value = [];
        finalTime.value = 0;
        try {
            const excludeArr = Array.from(answeredIds.value);
            const nextQuestion = await fetchRandomQuestion(options.getTopicId(), excludeArr);
            if (!nextQuestion) {
                state.value = 'resume';
                return;
            }
            question.value = nextQuestion;
            if (autoStart.value) {
                autoStart.value = false;
                timerRunning.value = true;
                state.value = 'answering';
            }
            else {
                state.value = 'ready';
            }
        }
        catch (error) {
            errorMessage.value = error instanceof Error ? error.message : 'Gagal memuat soal.';
            state.value = 'error';
        }
    }
    function startQuiz() {
        if (questionCount.value === 0 || !question.value) {
            loadQuestion();
            return;
        }
        timerRunning.value = true;
        state.value = 'answering';
    }
    function nextQuestion() {
        autoStart.value = true;
        loadQuestion();
    }
    function onSelectKeys(keys) {
        selectedKeys.value = keys;
    }
    function onTime(seconds) {
        if (!timerRunning.value) {
            finalTime.value = seconds;
        }
    }
    async function submitAnswer() {
        if (!question.value || selectedKeys.value.length === 0)
            return;
        timerRunning.value = false;
        try {
            const checkResult = await apiCheckAnswer(question.value.id, selectedKeys.value);
            result.value = checkResult;
            answeredIds.value.add(question.value.id);
            sessionResults.value.push({ correct: checkResult.correct, elapsed: finalTime.value });
            state.value = 'reviewing';
        }
        catch (error) {
            errorMessage.value = error instanceof Error ? error.message : 'Gagal memeriksa jawaban.';
            state.value = 'error';
        }
    }
    async function loadTopicInfo() {
        const querySubjectId = options.getQuerySubjectId();
        const queryTopicLabel = options.getQueryTopicLabel();
        if (Number.isInteger(querySubjectId) && querySubjectId > 0) {
            subjectId.value = querySubjectId;
        }
        if (queryTopicLabel) {
            topicLabel.value = queryTopicLabel;
        }
        if (subjectId.value > 0 && topicLabel.value) {
            return;
        }
        try {
            const topic = await fetchTopic(options.getTopicId());
            if (topic) {
                subjectId.value = topic.subject_id;
                topicLabel.value = topic.label;
            }
        }
        catch {
            subjectId.value = 1;
        }
    }
    async function loadQuestionCount() {
        try {
            questionCount.value = await fetchQuestionCount(options.getTopicId());
        }
        catch {
            questionCount.value = 0;
        }
    }
    async function retryCurrentState() {
        await Promise.all([loadTopicInfo(), loadQuestionCount()]);
        await loadQuestion();
    }
    function resetSession() {
        answeredIds.value = new Set();
        sessionResults.value = [];
        autoStart.value = false;
    }
    function finishSession() {
        state.value = 'resume';
    }
    function cancelExit() {
        showExitModal.value = false;
    }
    function confirmExitState() {
        showExitModal.value = false;
        resetSession();
        state.value = 'ready';
        question.value = null;
        timerRunning.value = false;
    }
    function hasActiveSession() {
        if (state.value === 'resume' || state.value === 'ready')
            return false;
        return state.value === 'answering' || state.value === 'reviewing' || answeredIds.value.size > 0;
    }
    async function initializeSession() {
        await Promise.all([loadTopicInfo(), loadQuestionCount()]);
        await loadQuestion();
    }
    return {
        accuracy,
        answeredIds,
        cancelExit,
        confirmExitState,
        correctCount,
        currentQuestionNumber,
        errorMessage,
        finalTime,
        finishSession,
        hasActiveSession,
        incorrectCount,
        initializeSession,
        isLastQuestion,
        loadQuestion,
        loadQuestionCount,
        loadTopicInfo,
        nextQuestion,
        onSelectKeys,
        onTime,
        question,
        questionCount,
        resetSession,
        result,
        retryCurrentState,
        selectedKeys,
        showExitModal,
        startQuiz,
        state,
        subjectId,
        submitAnswer,
        timerRunning,
        topicLabel,
        totalTime,
    };
}
