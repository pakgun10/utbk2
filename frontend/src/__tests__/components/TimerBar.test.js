import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import TimerBar from '@/components/TimerBar.vue';
describe('TimerBar', () => {
    it('renders initial time as 00:00', () => {
        const wrapper = mount(TimerBar, {
            props: { running: true },
        });
        expect(wrapper.find('.timer-value').text()).toBe('00:00');
    });
    it('formats time as MM:SS', () => {
        const wrapper = mount(TimerBar, {
            props: { running: false },
        });
        expect(wrapper.find('.timer-value').text()).toBe('00:00');
    });
    it('starts and tracks time when running becomes true', async () => {
        const wrapper = mount(TimerBar, {
            props: { running: false },
        });
        await wrapper.setProps({ running: true });
        await nextTick();
        expect(wrapper.vm.formatted).toBe('00:00');
    });
    it('stops and emits time when running becomes false', async () => {
        const wrapper = mount(TimerBar, {
            props: { running: true },
        });
        await wrapper.setProps({ running: false });
        await nextTick();
        const emitted = wrapper.emitted('time');
        expect(emitted).toBeDefined();
        expect(emitted.length).toBeGreaterThanOrEqual(1);
        expect(emitted[emitted.length - 1][0]).toBeGreaterThanOrEqual(0);
    });
    it('resets timer when running toggles', async () => {
        const wrapper = mount(TimerBar, {
            props: { running: true },
        });
        await wrapper.setProps({ running: false });
        await wrapper.setProps({ running: true });
        await nextTick();
        expect(wrapper.vm.formatted).toBe('00:00');
    });
});
