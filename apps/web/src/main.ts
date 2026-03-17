import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "@unocss/reset/tailwind.css";
import "virtual:uno.css";
import "./styles/global.css";

// SPAではブラウザのauto scroll restorationがDOM更新前に発火してタイミングが不定になるため、
// Vue Routerのscrollbehaviorで完全管理する
history.scrollRestoration = "manual";

const app = createApp(App);
app.use(router);
app.mount("#app");

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}
