import { hasGlobalComponent } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_04c6679e310813b386db8fab1986a3b8/node_modules/@vuepress/helper/lib/client/index.js";
import Badge from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-plugin-components@_7206375e6675cb42f64207f7e85536fb/node_modules/vuepress-plugin-components/lib/client/components/Badge.js";
import VPCard from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-plugin-components@_7206375e6675cb42f64207f7e85536fb/node_modules/vuepress-plugin-components/lib/client/components/VPCard.js";

import "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_04c6679e310813b386db8fab1986a3b8/node_modules/@vuepress/helper/lib/client/styles/sr-only.css";

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
