import { Layout, NotFound, injectDarkMode, setupDarkMode, setupSidebarItems, scrollPromise } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-theme-hope@2.0.0-r_35b042b71009b980899dc5d42dfe08fa/node_modules/vuepress-theme-hope/lib/bundle/exports/base.js";

import { GlobalEncrypt, LocalEncrypt } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-theme-hope@2.0.0-r_35b042b71009b980899dc5d42dfe08fa/node_modules/vuepress-theme-hope/lib/bundle/exports/encrypt.js";
import "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-theme-hope@2.0.0-r_35b042b71009b980899dc5d42dfe08fa/node_modules/vuepress-theme-hope/lib/bundle/styles/encrypt/bundle.scss"

import "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_4fb3ae55891e3787527a794ba981af6b/node_modules/@vuepress/helper/lib/client/styles/colors.css";
import "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_4fb3ae55891e3787527a794ba981af6b/node_modules/@vuepress/helper/lib/client/styles/normalize.css";
import "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_4fb3ae55891e3787527a794ba981af6b/node_modules/@vuepress/helper/lib/client/styles/sr-only.css";
import "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-theme-hope@2.0.0-r_35b042b71009b980899dc5d42dfe08fa/node_modules/vuepress-theme-hope/lib/bundle/styles/bundle.scss";



export default {
  enhance: ({ app, router }) => {
    const { scrollBehavior } = router.options;

    router.options.scrollBehavior = async (...args) => {
      await scrollPromise.wait();

      return scrollBehavior(...args);
    };

    // inject global properties
    injectDarkMode(app);

    app.component("GlobalEncrypt", GlobalEncrypt);
    app.component("LocalEncrypt", LocalEncrypt);
  },
  setup: () => {
    setupDarkMode();
    setupSidebarItems();

  },
  layouts: {
    Layout,
    NotFound,

  }
};
