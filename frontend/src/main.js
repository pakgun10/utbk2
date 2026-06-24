import { createApp } from 'vue';
import App from './App.vue';
import { buildRouter } from './router';
async function bootstrap() {
    const router = await buildRouter();
    const app = createApp(App);
    app.use(router);
    app.mount('#app');
}
bootstrap();
