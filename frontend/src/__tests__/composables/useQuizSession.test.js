import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuizSession } from '@/composables/useQuizSession';
const { checkAnswer, fetchQuestionCount, fetchRandomQuestion, fetchSubjects, fetchTopics, } = vi.hoisted(() => ({
    checkAnswer: vi.fn(),
    fetchQuestionCount: vi.fn(),
    fetchRandomQuestion: vi.fn(),
    fetchSubjects: vi.fn(),
    fetchTopics: vi.fn(),
}));
vi.mock('@/api/client', () => ({
    checkAnswer,
    fetchQuestionCount,
    fetchRandomQuestion,
    fetchSubjects,
    fetchTopics,
}));
const firstQuestion = {
    id: 101,
    type: 'single_choice',
    difficulty: 'medium',
    question_text: 'Soal pertama',
    options: [
        { key: 'A', text: 'Opsi A' },
        { key: 'B', text: 'Opsi B' },
    ],
};
const secondQuestion = {
    id: 202,
    type: 'single_choice',
    difficulty: 'hard',
    question_text: 'Soal kedua',
    options: [
        { key: 'A', text: 'Opsi A' },
        { key: 'B', text: 'Opsi B' },
    ],
};
describe('useQuizSession', () => {
    beforeEach(() => {
        checkAnswer.mockReset();
        fetchQuestionCount.mockReset();
        fetchRandomQuestion.mockReset();
        fetchSubjects.mockReset();
        fetchTopics.mockReset();
    });
    it('initializes session from route query without extra topic lookup', async () => {
        fetchQuestionCount.mockResolvedValue(5);
        fetchRandomQuestion.mockResolvedValue(firstQuestion);
        const session = useQuizSession({
            getTopicId: () => 11,
            getQuerySubjectId: () => 7,
            getQueryTopicLabel: () => 'Aljabar',
        });
        await session.initializeSession();
        expect(fetchSubjects).not.toHaveBeenCalled();
        expect(fetchTopics).not.toHaveBeenCalled();
        expect(fetchQuestionCount).toHaveBeenCalledWith(11);
        expect(fetchRandomQuestion).toHaveBeenCalledWith(11, []);
        expect(session.subjectId.value).toBe(7);
        expect(session.topicLabel.value).toBe('Aljabar');
        expect(session.questionCount.value).toBe(5);
        expect(session.question.value?.id).toBe(101);
        expect(session.state.value).toBe('ready');
    });
    it('submits an answer and moves into reviewing state with summary updated', async () => {
        fetchQuestionCount.mockResolvedValue(1);
        fetchRandomQuestion.mockResolvedValue(firstQuestion);
        checkAnswer.mockResolvedValue({
            correct: true,
            correct_keys: ['B'],
            explanation: 'Pembahasan benar.',
        });
        const session = useQuizSession({
            getTopicId: () => 11,
            getQuerySubjectId: () => 7,
            getQueryTopicLabel: () => 'Aljabar',
        });
        await session.initializeSession();
        session.startQuiz();
        session.onSelectKeys(['B']);
        session.timerRunning.value = false;
        session.onTime(42);
        await session.submitAnswer();
        expect(checkAnswer).toHaveBeenCalledWith(101, ['B']);
        expect(session.state.value).toBe('reviewing');
        expect(session.result.value).toEqual({
            correct: true,
            correct_keys: ['B'],
            explanation: 'Pembahasan benar.',
        });
        expect(session.correctCount.value).toBe(1);
        expect(session.incorrectCount.value).toBe(0);
        expect(session.totalTime.value).toBe('00:42');
        expect(session.accuracy.value).toBe(100);
        expect(session.isLastQuestion.value).toBe(true);
    });
    it('loads the next question with auto-start and excludes answered ids', async () => {
        fetchQuestionCount.mockResolvedValue(2);
        fetchRandomQuestion
            .mockResolvedValueOnce(firstQuestion)
            .mockResolvedValueOnce(secondQuestion);
        checkAnswer.mockResolvedValue({
            correct: false,
            correct_keys: ['B'],
            explanation: 'Pembahasan salah.',
        });
        const session = useQuizSession({
            getTopicId: () => 11,
            getQuerySubjectId: () => 7,
            getQueryTopicLabel: () => 'Aljabar',
        });
        await session.initializeSession();
        session.startQuiz();
        session.onSelectKeys(['A']);
        session.timerRunning.value = false;
        session.onTime(15);
        await session.submitAnswer();
        await session.nextQuestion();
        expect(fetchRandomQuestion).toHaveBeenNthCalledWith(1, 11, []);
        expect(fetchRandomQuestion).toHaveBeenNthCalledWith(2, 11, [101]);
        expect(session.question.value?.id).toBe(202);
        expect(session.state.value).toBe('answering');
        expect(session.currentQuestionNumber.value).toBe(2);
        expect(session.timerRunning.value).toBe(true);
    });
});
