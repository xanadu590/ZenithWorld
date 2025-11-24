// .vuepress/plugins/recommended-articles/index.ts
import fs from "fs";
import { path } from "@vuepress/utils";

export interface RecommendedArticlesOptions {
  output?: string;
}

export default (options: RecommendedArticlesOptions = {}) => {
  const output = options.output ?? "assets/recommended-pages.json";

  return {
    name: "recommended-articles",

    async onGenerated(app) {
      const pages = app.pages
        .filter((page) => !page.frontmatter?.noHot && !page.frontmatter?.noRecent)
        .map((page) => {
          const updated = (page.data.git as any)?.updatedTime ?? null;
          const fm = page.frontmatter as any;

          return {
            title: page.title,
            path: page.path,
            lastUpdated: updated,
            hotScore: fm.hot ?? fm.popularity ?? 0,
          };
        });

      const destPath = path.resolve(app.dir.dest(), output);
      await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
      await fs.promises.writeFile(destPath, JSON.stringify(pages, null, 2), "utf-8");

      console.log(`[recommended-articles] generated: ${output}`);
    },

    clientConfigFile: path.resolve(__dirname, "./clientConfig.ts"),
  };
};