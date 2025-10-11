import CodeDemo from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-plugin-md-enhance@_c3180443b1b791ef36b3ded4ec48bf03/node_modules/vuepress-plugin-md-enhance/lib/client/components/CodeDemo.js";
import MdDemo from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-plugin-md-enhance@_c3180443b1b791ef36b3ded4ec48bf03/node_modules/vuepress-plugin-md-enhance/lib/client/components/MdDemo.js";

export default {
  enhance: ({ app }) => {
    app.component("CodeDemo", CodeDemo);
    app.component("MdDemo", MdDemo);
  },
};
