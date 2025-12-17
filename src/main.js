import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import "./assets/index.css"; // tailwind 및 shadcn 스타일

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");
