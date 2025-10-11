import { CodeTabs } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+plugin-markdown-t_b0799a16b5bb454a972553dc5943538e/node_modules/@vuepress/plugin-markdown-tab/lib/client/components/CodeTabs.js";
import { Tabs } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+plugin-markdown-t_b0799a16b5bb454a972553dc5943538e/node_modules/@vuepress/plugin-markdown-tab/lib/client/components/Tabs.js";
import "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+plugin-markdown-t_b0799a16b5bb454a972553dc5943538e/node_modules/@vuepress/plugin-markdown-tab/lib/client/styles/vars.css";

export default {
  enhance: ({ app }) => {
    app.component("CodeTabs", CodeTabs);
    app.component("Tabs", Tabs);
  },
};
