import { hasGlobalComponent } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_6beaba0337a17dad4e82cff92eae8dd0/node_modules/@vuepress/helper/lib/client/index.js";
import Badge from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-plugin-components@_235867ebd5fafd37066b629b0d49d4fd/node_modules/vuepress-plugin-components/lib/client/components/Badge.js";
import VPCard from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-plugin-components@_235867ebd5fafd37066b629b0d49d4fd/node_modules/vuepress-plugin-components/lib/client/components/VPCard.js";

import "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_6beaba0337a17dad4e82cff92eae8dd0/node_modules/@vuepress/helper/lib/client/styles/sr-only.css";

export default {
  enhance: ({ app }) => {
    if(!hasGlobalComponent("Badge")) app.component("Badge", Badge);
    if(!hasGlobalComponent("VPCard")) app.component("VPCard", VPCard);
    
  },
  setup: () => {

  },
  rootComponents: [

  ],
};
