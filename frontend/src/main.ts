import { createApp } from 'vue';
import App from './App.vue';
import { buildRouter } from './router';

const router = await buildRouter();

const app = createApp(App);
app.use(router);
app.mount('#app');
