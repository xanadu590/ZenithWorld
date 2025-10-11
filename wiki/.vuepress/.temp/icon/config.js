import { hasGlobalComponent } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_6beaba0337a17dad4e82cff92eae8dd0/node_modules/@vuepress/helper/lib/client/index.js";
import { useScriptTag } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vueuse+core@13.9.0_vue@3.5.22/node_modules/@vueuse/core/index.mjs";
import { h } from "vue";
import { VPIcon } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+plugin-icon@2.0.0_4a49498b4bc6af69b5f5b90a2ce4f11b/node_modules/@vuepress/plugin-icon/lib/client/index.js"

export default {
  enhance: ({ app }) => {
    if(!hasGlobalComponent("VPIcon")) {
      app.component(
        "VPIcon",
        (props) =>
          h(VPIcon, {
            type: "iconify",
            prefix: "fa6-solid:",
            ...props,
          })
      )
    }
  },
  setup: () => {
    useScriptTag(`https://cdn.jsdelivr.net/npm/iconify-icon@2`);
  },
}
