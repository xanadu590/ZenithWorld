import { CodeTabs } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+plugin-markdown-t_49ad05f80ef8e5e5b2b8ce777a18c7ff/node_modules/@vuepress/plugin-markdown-tab/lib/client/components/CodeTabs.js";
import { Tabs } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+plugin-markdown-t_49ad05f80ef8e5e5b2b8ce777a18c7ff/node_modules/@vuepress/plugin-markdown-tab/lib/client/components/Tabs.js";
import "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+plugin-markdown-t_49ad05f80ef8e5e5b2b8ce777a18c7ff/node_modules/@vuepress/plugin-markdown-tab/lib/client/styles/vars.css";

export default {
  enhance: ({ app }) => {
    app.component("CodeTabs", CodeTabs);
    app.component("Tabs", Tabs);
  },
};
