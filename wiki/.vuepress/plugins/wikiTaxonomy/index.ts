// docs/.vuepress/plugins/wikiTaxonomy/index.ts
import type { Plugin } from "vuepress";
import fs from "fs";
import { path as vpPath } from "@vuepress/utils";

interface TaxonomyPageRef {
  title: string;
  path: string;
  category: string; // 中文：人物 / 组织 / ...
  key: string;      // 英文：characters / factions / ...
  tags: string[];
}

interface CategoryEntry {
  key: string;               // 内部英文 key
  pages: TaxonomyPageRef[];  // 属于这个分类的页面
}

interface TagEntry {
  pages: TaxonomyPageRef[];
}

interface TaxonomyData {
  categories: Record<string, CategoryEntry>; // key: 中文分类名
  tags: Record<string, TagEntry>;            // key: tag 名称
}

// 中文分类 → 英文 key 映射
const CATEGORY_MAP: Record<string, string> = {
  "人物": "characters",
  "组织": "factions",
  "地点": "geography",
  "概念": "concepts",
  "事件": "history",
};

export const wikiTaxonomyPlugin = (): Plugin => ({
  name: "wiki-taxonomy",

  onInitialized(app) {
    const data: TaxonomyData = {
      categories: {},
      tags: {},
    };

    for (const page of app.pages) {
      const fm = page.frontmatter as any;

      const rawCategory = fm?.category;
      const rawTags = fm?.tag ?? fm?.tags;

      if (!rawCategory) continue;

      const category = String(rawCategory);
      const key = CATEGORY_MAP[category] ?? "unknown";

      const tags: string[] = Array.isArray(rawTags)
        ? rawTags.map((t) => String(t))
        : rawTags
        ? [String(rawTags)]
        : [];

      const ref: TaxonomyPageRef = {
        title: page.title || fm?.title || page.path,
        path: page.path,
        category,
        key,
        tags,
      };

      if (!data.categories[category]) {
        data.categories[category] = {
          key,
          pages: [],
        };
      }
      data.categories[category].pages.push(ref);

      for (const tag of tags) {
        if (!data.tags[tag]) data.tags[tag] = { pages: [] };
        data.tags[tag].pages.push(ref);
      }
    }

    // 1）写入数据文件 data.js
    const dataContent = [
      "// 此文件由 wiki-taxonomy 插件自动生成，请勿手动修改。",
      "",
      "export const taxonomyData = " + JSON.stringify(data, null, 2) + ";",
      "",
    ].join("\n");

    app.writeTemp("wiki-taxonomy/data.js", dataContent);

    // 2）读取可选布局配置 .vuepress/taxonomy-layout.json
    const layoutSourcePath = vpPath.resolve(
      app.dir.source(".vuepress"),
      "taxonomy-layout.json",
    );

    let layout: any = {};

    if (fs.existsSync(layoutSourcePath)) {
      try {
        const raw = fs.readFileSync(layoutSourcePath, "utf-8");
        layout = JSON.parse(raw);
      } catch (e) {
        console.warn(
          "[wiki-taxonomy] 读取 taxonomy-layout.json 失败：",
          e,
        );
        layout = {};
      }
    }

    const layoutContent = [
      "// 此文件由 wiki-taxonomy 插件自动生成，请勿手动修改。",
      "",
      "export const taxonomyLayout = " + JSON.stringify(layout, null, 2) + ";",
      "",
    ].join("\n");

    app.writeTemp("wiki-taxonomy/layout.js", layoutContent);
  },
});