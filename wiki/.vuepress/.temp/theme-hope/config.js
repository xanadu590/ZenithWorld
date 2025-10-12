import { Layout, NotFound, injectDarkMode, setupDarkMode, setupSidebarItems, scrollPromise } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-theme-hope@2.0.0-r_cf92ef6a1c3b98d9a50279eada6f5970/node_modules/vuepress-theme-hope/lib/bundle/exports/base.js";

import { defineCatalogInfoGetter } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+plugin-catalog@2._1f4c41ee9e6fb4bb125eed9f6f2c911b/node_modules/@vuepress/plugin-catalog/lib/client/index.js"
import { h } from "vue"
import { resolveComponent } from "vue"
import { GlobalEncrypt, LocalEncrypt } from "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-theme-hope@2.0.0-r_cf92ef6a1c3b98d9a50279eada6f5970/node_modules/vuepress-theme-hope/lib/bundle/exports/encrypt.js";
import "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-theme-hope@2.0.0-r_cf92ef6a1c3b98d9a50279eada6f5970/node_modules/vuepress-theme-hope/lib/bundle/styles/encrypt/bundle.scss"

import "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_04c6679e310813b386db8fab1986a3b8/node_modules/@vuepress/helper/lib/client/styles/colors.css";
import "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_04c6679e310813b386db8fab1986a3b8/node_modules/@vuepress/helper/lib/client/styles/normalize.css";
import "C:/Users/super/ZenithWorld/node_modules/.pnpm/@vuepress+helper@2.0.0-rc.1_04c6679e310813b386db8fab1986a3b8/node_modules/@vuepress/helper/lib/client/styles/sr-only.css";
import "C:/Users/super/ZenithWorld/node_modules/.pnpm/vuepress-theme-hope@2.0.0-r_cf92ef6a1c3b98d9a50279eada6f5970/node_modules/vuepress-theme-hope/lib/bundle/styles/bundle.scss";

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
