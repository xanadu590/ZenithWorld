// docs/.vuepress/plugins/autoLinkerPro/index.ts
import type { App, Page, Plugin } from "vuepress";

export const autoLinkerProPlugin = (): Plugin => {
  return {
    name: "vuepress-plugin-auto-linker-pro-debug",

    onInitialized(app: App) {
      // 1. 打印一下一共有多少页
      console.log("[autoLinkerPro DEBUG] pages length =", app.pages.length);

      for (const page of app.pages) {
        // 路径 + 标题打印出来，方便排查
        console.log(
          "[autoLinkerPro DEBUG] page:",
          page.path,
          "title:",
          page.title
        );

        if (!page.content) continue;

        // 2. 只要这个插件跑了，所有页面里的“灵动骑士”都会被加标记
        if (page.content.includes("灵动骑士")) {
          console.log(
            "[autoLinkerPro DEBUG] patch page:",
            page.path,
            "has '灵动骑士'"
          );

          (page as any).content = page.content.replace(
            /灵动骑士/g,
            "【AUTO-LINK-TEST】灵动骑士"
          );
        }
      }
    },
  };
};

export default autoLinkerProPlugin;