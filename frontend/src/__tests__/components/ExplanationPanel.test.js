import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ExplanationPanel from '@/components/ExplanationPanel.vue';
describe('ExplanationPanel', () => {
    it('renders correct status when correct is true', () => {
        const wrapper = mount(ExplanationPanel, {
            props: {
                correct: true,
                correct_keys: ['B'],
                explanation: 'Jawaban B benar karena...',
                elapsed_seconds: 45,
            },
        });
        expect(wrapper.find('.explanation-status').text()).toContain('Benar');
        expect(wrapper.classes()).toContain('correct');
    });
    it('renders incorrect status when correct is false', () => {
        const wrapper = mount(ExplanationPanel, {
            props: {
                correct: false,
                correct_keys: ['B'],
                explanation: 'Jawaban benar adalah B.',
                elapsed_seconds: 30,
            },
        });
        expect(wrapper.find('.explanation-status').text()).toContain('Salah');
        expect(wrapper.classes()).toContain('incorrect');
    });
    it('displays formatted time', () => {
        const wrapper = mount(ExplanationPanel, {
            props: {
                correct: true,
                correct_keys: ['A'],
                explanation: '...',
                elapsed_seconds: 125,
            },
        });
        expect(wrapper.find('.explanation-time').text()).toBe('Waktu: 02:05');
    });
    it('displays correct keys', () => {
        const wrapper = mount(ExplanationPanel, {
            props: {
                correct: true,
                correct_keys: ['A', 'C'],
                explanation: '...',
                elapsed_seconds: 0,
            },
        });
        expect(wrapper.find('.correct-keys').text()).toBe('A, C');
    });
    it('displays explanation text', () => {
        const wrapper = mount(ExplanationPanel, {
            props: {
                correct: true,
                correct_keys: ['A'],
                explanation: 'Penjelasan detail soal.',
                elapsed_seconds: 0,
            },
        });
        expect(wrapper.text()).toContain('Penjelasan detail soal.');
    });
    it('renders next button and emits on click', async () => {
        const wrapper = mount(ExplanationPanel, {
            props: {
                correct: true,
                correct_keys: ['A'],
                explanation: '...',
                elapsed_seconds: 0,
            },
        });
        const btn = wrapper.find('.explanation-next');
        expect(btn.exists()).toBe(true);
        expect(btn.text()).toBe('Soal Berikutnya');
        await btn.trigger('click');
        expect(wrapper.emitted('next')).toHaveLength(1);
    });
    it('shows Lihat Hasil and emits finish when is_last', async () => {
        const wrapper = mount(ExplanationPanel, {
            props: {
                correct: true,
                correct_keys: ['A'],
                explanation: '...',
                elapsed_seconds: 0,
                is_last: true,
            },
        });
        const btn = wrapper.find('.explanation-next');
        expect(btn.text()).toBe('Lihat Hasil');
        await btn.trigger('click');
        expect(wrapper.emitted('finish')).toHaveLength(1);
    });
});
