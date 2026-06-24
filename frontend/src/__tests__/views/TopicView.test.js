import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import TopicView from '@/views/TopicView.vue';
const { fetchTopics, fetchSubjects } = vi.hoisted(() => ({
    fetchTopics: vi.fn(),
    fetchSubjects: vi.fn(),
}));
vi.mock('@/api/client', () => ({
    fetchTopics,
    fetchSubjects,
}));
vi.mock('vue-router', () => ({
    useRoute: () => ({
        params: { id: '7' },
    }),
}));
const RouterLinkStub = defineComponent({
    name: 'RouterLink',
    props: {
        to: {
            type: [String, Object],
            required: true,
        },
    },
    setup(props, { slots }) {
        return () => h('a', { 'data-to': JSON.stringify(props.to) }, slots.default?.());
    },
});
describe('TopicView', () => {
    beforeEach(() => {
        fetchTopics.mockReset();
        fetchSubjects.mockReset();
    });
    it('passes subject_id and topic_label to quiz route', async () => {
        fetchTopics.mockResolvedValue([
            { id: 11, subject_id: 7, slug: 'aljabar', label: 'Aljabar', display_order: 1, question_count: 5 },
        ]);
        fetchSubjects.mockResolvedValue([
            { id: 7, slug: 'pm', label: 'Penalaran Matematika', display_order: 1 },
        ]);
        const wrapper = mount(TopicView, {
            global: {
                stubs: {
                    RouterLink: RouterLinkStub,
                },
            },
        });
        await new Promise((resolve) => setTimeout(resolve, 0));
        await wrapper.vm.$nextTick();
        const links = wrapper.findAll('a[data-to]');
        const quizLink = links.find((link) => link.text().includes('Aljabar'));
        expect(quizLink).toBeDefined();
        const target = quizLink?.attributes('data-to');
        expect(target).toBeTruthy();
        expect(JSON.parse(target)).toEqual({
            path: '/quiz/11',
            query: {
                subject_id: '7',
                topic_label: 'Aljabar',
            },
        });
    });
});
