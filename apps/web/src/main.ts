import "@unocss/reset/tailwind.css";
import "virtual:uno.css";
import "./styles/global.css";
import App from "./App.vue";
import { createApp } from "vue";
import { router } from "./router";

// SPAではブラウザのauto scroll restorationがDOM更新前に発火してタイミングが不定になるため、
// Vue Routerのscrollbehaviorで完全管理する
history.scrollRestoration = "manual";

const app = createApp(App);
// oxlint-disable-next-line typescript/no-unsafe-argument -- router type mismatch is expected with hono client types
app.use(router);
app.mount("#app");

if ("serviceWorker" in navigator) {
  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch {
    // Service worker registration failed silently
  }
}
