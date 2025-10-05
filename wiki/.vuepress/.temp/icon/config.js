import { hasGlobalComponent } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_ba678c52a08dd49215d2786e6dd7a9b6/node_modules/@vuepress/helper/lib/client/index.js";
import { useScriptTag } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vueuse+core@13.9.0_vue@3.5.22/node_modules/@vueuse/core/index.mjs";
import { h } from "vue";
import { VPIcon } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+plugin-icon@2.0.0_37224d1d134de1e3fb9b9dd2d924eef7/node_modules/@vuepress/plugin-icon/lib/client/index.js"

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
