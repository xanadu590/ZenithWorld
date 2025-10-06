import { Layout, NotFound, injectDarkMode, setupDarkMode, setupSidebarItems, scrollPromise } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-theme-hope@2.0.0-r_f4e747f53e9304468df14c1b2bc113d6/node_modules/vuepress-theme-hope/lib/bundle/exports/base.js";

import { defineCatalogInfoGetter } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+plugin-catalog@2._6135d39c6c2402b94c97522cf482bc58/node_modules/@vuepress/plugin-catalog/lib/client/index.js"
import { h } from "vue"
import { resolveComponent } from "vue"
import { GlobalEncrypt, LocalEncrypt } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-theme-hope@2.0.0-r_f4e747f53e9304468df14c1b2bc113d6/node_modules/vuepress-theme-hope/lib/bundle/exports/encrypt.js";
import "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-theme-hope@2.0.0-r_f4e747f53e9304468df14c1b2bc113d6/node_modules/vuepress-theme-hope/lib/bundle/styles/encrypt/bundle.scss"

import "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_ba678c52a08dd49215d2786e6dd7a9b6/node_modules/@vuepress/helper/lib/client/styles/colors.css";
import "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_ba678c52a08dd49215d2786e6dd7a9b6/node_modules/@vuepress/helper/lib/client/styles/normalize.css";
import "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_ba678c52a08dd49215d2786e6dd7a9b6/node_modules/@vuepress/helper/lib/client/styles/sr-only.css";
import "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-theme-hope@2.0.0-r_f4e747f53e9304468df14c1b2bc113d6/node_modules/vuepress-theme-hope/lib/bundle/styles/bundle.scss";

defineCatalogInfoGetter((meta) => {
  const title = meta.title;
  const shouldIndex = meta.index ?? true;
  const icon = meta.icon;

  return shouldIndex ? {
    title,
    content: icon ? () =>[h(resolveComponent("VPIcon"), { icon, sizing: "both" }), title] : null,
    order: meta.order,
    index: meta.index,
  } : null;
});

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
