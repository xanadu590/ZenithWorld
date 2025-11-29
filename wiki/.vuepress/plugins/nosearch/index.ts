import type { Plugin } from "vuepress";
import { path } from "@vuepress/utils";

export const nosearchPlugin = (): Plugin => ({
  name: "nosearch-plugin",

  /**
   * 构建阶段：把所有 frontmatter.nosearch === true 的页面
   * 收集起来，写到临时文件里，给前端用。
   */
  async onPrepared(app) {
    // 找出所有标了 nosearch: true 的页面
    const list = app.pages
      .filter((page) => page.frontmatter.nosearch === true)
      .map((page) => page.path);

    const content =
      `export const nosearchPaths = ${JSON.stringify(list, null, 2)};\n`;

    // 写入临时目录 .vuepress/.temp/nosearch/nosearchPaths.js
    await app.writeTemp(
      "nosearch/nosearchPaths.js",
      content
    );
  },

  /**
   * 声明一个 client 配置文件（其实这里只是为了让 @temp 那个文件被打包）
   */
  clientConfigFile: path.resolve(__dirname, "client.ts"),
});

export default nosearchPlugin;