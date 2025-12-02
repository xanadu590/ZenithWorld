import { hasGlobalComponent } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_4fb3ae55891e3787527a794ba981af6b/node_modules/@vuepress/helper/lib/client/index.js";
import { useScriptTag } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vueuse+core@13.9.0_vue@3.5.22/node_modules/@vueuse/core/index.mjs";
import { h } from "vue";
import { VPIcon } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+plugin-icon@2.0.0_2018b718942dc30bd10133ddef6eee86/node_modules/@vuepress/plugin-icon/lib/client/index.js"

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
