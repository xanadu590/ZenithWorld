// docs/.vuepress/plugins/autoLinkerPro/index.ts
import type { App, Plugin } from "vuepress";

export const autoLinkerProPlugin = (): Plugin => {
  return {
    name: "vuepress-plugin-auto-linker-pro-md-debug",

    onInitialized(app: App) {
      console.log(
        "[autoLinkerPro] onInitialized, pages length =",
        app.pages.length
      );
    },

    extendsMarkdown(md) {
      console.log("[autoLinkerPro] extendsMarkdown registered");

      md.core.ruler.push("auto-linker-pro-debug", (state) => {
        const env: any = state.env || {};
        const fm: any = env.frontmatter || {};
        const rel: string = env.filePathRelative || "(unknown)";

        console.log(
          "[autoLinkerPro] MD-DEBUG render page:",
          rel,
          "| title:",
          fm.title
        );
      });
    },
  };
};

export default autoLinkerProPlugin;