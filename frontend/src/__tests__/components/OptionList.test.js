import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import OptionList from '@/components/OptionList.vue';
const options = [
    { key: 'A', text: 'Pilihan A' },
    { key: 'B', text: 'Pilihan B' },
    { key: 'C', text: 'Pilihan C' },
];
describe('OptionList - single_choice', () => {
    it('renders all options', () => {
        const wrapper = mount(OptionList, {
            props: { options, type: 'single_choice', selectedKeys: [], disabled: false },
        });
        const items = wrapper.findAll('.option-item');
        expect(items).toHaveLength(3);
    });
    it('selects one option on click', async () => {
        const wrapper = mount(OptionList, {
            props: { options, type: 'single_choice', selectedKeys: [], disabled: false },
        });
        await wrapper.findAll('.option-item')[0].trigger('click');
        expect(wrapper.emitted('update:selectedKeys')?.[0]?.[0]).toEqual(['A']);
    });
    it('switches selection on second click', async () => {
        const wrapper = mount(OptionList, {
            props: { options, type: 'single_choice', selectedKeys: ['A'], disabled: false },
        });
        await wrapper.findAll('.option-item')[1].trigger('click');
        expect(wrapper.emitted('update:selectedKeys')?.[0]?.[0]).toEqual(['B']);
    });
    it('shows selected class on active key', () => {
        const wrapper = mount(OptionList, {
            props: { options, type: 'single_choice', selectedKeys: ['B'], disabled: false },
        });
        const items = wrapper.findAll('.option-item');
        expect(items[1].classes()).toContain('option-selected');
        expect(items[0].classes()).not.toContain('option-selected');
    });
    it('does not emit when disabled', async () => {
        const wrapper = mount(OptionList, {
            props: { options, type: 'single_choice', selectedKeys: [], disabled: true },
        });
        await wrapper.findAll('.option-item')[0].trigger('click');
        expect(wrapper.emitted('update:selectedKeys')).toBeUndefined();
    });
});
describe('OptionList - multiple_response', () => {
    it('allows selecting multiple options by updating props between clicks', async () => {
        let currentKeys = [];
        const wrapper = mount(OptionList, {
            props: { options, type: 'multiple_response', selectedKeys: currentKeys, disabled: false },
        });
        await wrapper.findAll('.option-item')[0].trigger('click');
        const firstEmit = wrapper.emitted('update:selectedKeys')?.[0]?.[0];
        expect(firstEmit).toEqual(['A']);
        currentKeys = firstEmit;
        await wrapper.setProps({ selectedKeys: currentKeys });
        await wrapper.findAll('.option-item')[2].trigger('click');
        expect(wrapper.emitted('update:selectedKeys')?.[1]?.[0]).toEqual(['A', 'C']);
    });
    it('deselects on second click', async () => {
        const wrapper = mount(OptionList, {
            props: { options, type: 'multiple_response', selectedKeys: ['A', 'C'], disabled: false },
        });
        await wrapper.findAll('.option-item')[0].trigger('click');
        expect(wrapper.emitted('update:selectedKeys')?.[0]?.[0]).toEqual(['C']);
    });
});
describe('OptionList - result display', () => {
    it('shows correct class when showResult and correct key', () => {
        const wrapper = mount(OptionList, {
            props: {
                options,
                type: 'single_choice',
                selectedKeys: ['A'],
                disabled: true,
                showResult: true,
                correctKeys: ['B'],
            },
        });
        const items = wrapper.findAll('.option-item');
        expect(items[0].classes()).toContain('option-wrong');
        expect(items[1].classes()).toContain('option-correct');
    });
});
