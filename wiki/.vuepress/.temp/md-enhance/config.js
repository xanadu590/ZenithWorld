import CodeDemo from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-plugin-md-enhance@_684ae011bb2b282252bbefcf6530c42a/node_modules/vuepress-plugin-md-enhance/lib/client/components/CodeDemo.js";
import MdDemo from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-plugin-md-enhance@_684ae011bb2b282252bbefcf6530c42a/node_modules/vuepress-plugin-md-enhance/lib/client/components/MdDemo.js";

export default {
  enhance: ({ app }) => {
    app.component("CodeDemo", CodeDemo);
    app.component("MdDemo", MdDemo);
  },
};
