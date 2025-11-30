import { hasGlobalComponent } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_4fb3ae55891e3787527a794ba981af6b/node_modules/@vuepress/helper/lib/client/index.js";
import Badge from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-plugin-components@_01e9cf0c67d63ad329196c17ffff0476/node_modules/vuepress-plugin-components/lib/client/components/Badge.js";
import VPCard from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-plugin-components@_01e9cf0c67d63ad329196c17ffff0476/node_modules/vuepress-plugin-components/lib/client/components/VPCard.js";

import "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_4fb3ae55891e3787527a794ba981af6b/node_modules/@vuepress/helper/lib/client/styles/sr-only.css";

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
