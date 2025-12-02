import CodeDemo from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-plugin-md-enhance@_da4e39f0bf7c5bacfd5f21799242946a/node_modules/vuepress-plugin-md-enhance/lib/client/components/CodeDemo.js";
import MdDemo from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-plugin-md-enhance@_da4e39f0bf7c5bacfd5f21799242946a/node_modules/vuepress-plugin-md-enhance/lib/client/components/MdDemo.js";

export default {
  enhance: ({ app }) => {
    app.component("CodeDemo", CodeDemo);
    app.component("MdDemo", MdDemo);
  },
};
