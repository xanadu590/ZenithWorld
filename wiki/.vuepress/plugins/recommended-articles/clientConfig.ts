// .vuepress/plugins/recommended-articles/clientConfig.ts
import { defineClientConfig } from "vuepress/client";
import HotPages from "./HotPages.vue";
import RecentPages from "./RecentPages.vue";

export default defineClientConfig({
  enhance({ app }) {
    app.component("HotPages", HotPages);
    app.component("RecentPages", RecentPages);
  },
});