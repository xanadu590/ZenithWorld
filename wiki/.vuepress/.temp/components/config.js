import { hasGlobalComponent } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_ba678c52a08dd49215d2786e6dd7a9b6/node_modules/@vuepress/helper/lib/client/index.js";
import Badge from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-plugin-components@_d08776702ed92327dfcc9e54150bef8d/node_modules/vuepress-plugin-components/lib/client/components/Badge.js";
import VPCard from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-plugin-components@_d08776702ed92327dfcc9e54150bef8d/node_modules/vuepress-plugin-components/lib/client/components/VPCard.js";

import "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_ba678c52a08dd49215d2786e6dd7a9b6/node_modules/@vuepress/helper/lib/client/styles/sr-only.css";

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
