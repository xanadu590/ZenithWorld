// .vuepress/plugins/recommended-articles/index.ts
import fs from "fs";
import { path } from "@vuepress/utils";

export interface RecommendedArticlesOptions {
  /** 相对于 public 目录的输出路径 */
  output?: string;
}

export default (options: RecommendedArticlesOptions = {}) => {
  // 最终会生成到：.vuepress/public/data/recommended-pages.json
  const output = options.output ?? "data/recommended-pages.json";

  return {
    name: "recommended-articles",

    // onPrepared 在 dev + build 都会执行，比 onGenerated 更合适
    async onPrepared(app) {
      console.log("[recommended-articles] onPrepared start");

      const pages = app.pages
        .filter((page) => !page.frontmatter?.noHot && !page.frontmatter?.noRecent)
        .map((page) => {
          const gitData = page.data.git as any;
          const fm = page.frontmatter as any;

          return {
            title: page.title,
            path: page.path,
            lastUpdated: gitData?.updatedTime ?? null,
            hotScore: fm.hot ?? fm.popularity ?? 0,
          };
        });

      // 写入到 public 目录，这样 dev + build 都会被静态服务 &打包
      const outFile = path.resolve(app.dir.public(), output);
      await fs.promises.mkdir(path.dirname(outFile), { recursive: true });
      await fs.promises.writeFile(outFile, JSON.stringify(pages, null, 2), "utf-8");

      console.log("[recommended-articles] JSON written:", outFile);
    },
  };
};