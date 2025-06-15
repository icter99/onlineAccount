// main.js
import {
    createApp
} from 'vue';
import {
    createPinia
} from 'pinia'; // 新增此行
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia(); // 创建 Pinia 实例

app.use(pinia); // 挂载 Pinia
app.mount('#app');