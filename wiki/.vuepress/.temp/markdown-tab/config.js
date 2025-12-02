import { CodeTabs } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+plugin-markdown-t_26466ab79eb58791d398492384f9cfee/node_modules/@vuepress/plugin-markdown-tab/lib/client/components/CodeTabs.js";
import { Tabs } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+plugin-markdown-t_26466ab79eb58791d398492384f9cfee/node_modules/@vuepress/plugin-markdown-tab/lib/client/components/Tabs.js";
import "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+plugin-markdown-t_26466ab79eb58791d398492384f9cfee/node_modules/@vuepress/plugin-markdown-tab/lib/client/styles/vars.css";

export default {
  enhance: ({ app }) => {
    app.component("CodeTabs", CodeTabs);
    app.component("Tabs", Tabs);
  },
};
