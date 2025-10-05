import CodeDemo from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-plugin-md-enhance@_d8ebdceee73d78e56063199b84b02c16/node_modules/vuepress-plugin-md-enhance/lib/client/components/CodeDemo.js";
import MdDemo from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-plugin-md-enhance@_d8ebdceee73d78e56063199b84b02c16/node_modules/vuepress-plugin-md-enhance/lib/client/components/MdDemo.js";

export default {
  enhance: ({ app }) => {
    app.component("CodeDemo", CodeDemo);
    app.component("MdDemo", MdDemo);
  },
};
