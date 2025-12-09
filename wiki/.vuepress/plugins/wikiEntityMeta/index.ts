// wiki/.vuepress/plugins/wikiEntityMeta/index.ts
import type { Plugin } from "vuepress";
import { fs, path } from "vuepress/utils";

interface EntityMetaItem {
  path: string;
  name?: string;
  alias?: string;
  shortName?: string;
  enName?: string;
  title?: string;
}

export const wikiEntityMetaPlugin = (): Plugin => ({
  name: "wiki-entity-meta",

  // 在 onPrepared 阶段扫描所有页面，生成实体信息
  async onPrepared(app) {
    const items: EntityMetaItem[] = [];

    // 「中文标签 → 字段名」映射表
    const LABEL_MAP: Record<string, keyof EntityMetaItem> = {
      // 姓名类
      "姓名": "name",
      "名称": "name",
      "本名": "name",

      // 简称 / 外号
      "简称": "shortName",
      "外号": "shortName",

      // 别名
      "别名": "alias",
      "又名": "alias",

      // 英文名
      "英文名": "enName",
      "英文名称": "enName",

      // 称号 / 头衔
      "称号": "title",
      "头衔": "title",
    };

    for (const page of app.pages) {
      // 只处理有物理文件的页面（排除 404、自动生成页等）
      const filePath = page.filePath;
      if (!filePath) continue;

      let content = "";
      try {
        content = await fs.readFile(filePath, "utf-8");
      } catch {
        continue;
      }

      if (!content) continue;

      const lines = content.split(/\r?\n/);
      let inBasicSection = false;
      const meta: Partial<EntityMetaItem> = {};

      for (const raw of lines) {
        const line = raw.trim();

        // 找到 "## 基本信息" 作为开始
        if (/^##\s*基本信息/.test(line)) {
          inBasicSection = true;
          continue;
        }

        // 进入别的 "##" 小节就停止扫描
        if (inBasicSection && /^##\s+/.test(line)) {
          break;
        }

        if (!inBasicSection) continue;

        // 匹配 "- 标签：内容"
        const m = /^[-*]\s*([^：:]+)[：:]\s*(.+)$/.exec(line);
        if (!m) continue;

        const label = m[1].trim();
        const value = m[2].trim();
        if (!value) continue;

        const key = LABEL_MAP[label];
        if (!key) continue;

        (meta as any)[key] = value;
      }

      if (Object.keys(meta).length) {
        items.push({
          path: page.path,
          ...meta,
        });
      }
    }

    // 1）仍然生成 JSON（可选，用于调试或以后需要）
    const jsonTempFile = app.dir.temp("wiki-entity-meta.json");
    await fs.writeFile(
      jsonTempFile,
      JSON.stringify({ items }, null, 2),
      "utf-8"
    );

    // 2）额外生成 JS 模块：@temp/wiki-entity-meta.js
    const jsTempFile = app.dir.temp("wiki-entity-meta.js");
    const jsContent =
      `export const wikiEntityMetaItems = ${JSON.stringify(items, null, 2)};\n`;
    await fs.writeFile(jsTempFile, jsContent, "utf-8");
  },

  // ❌ 不再需要把东西复制到 dist/data 里，搜索直接用 @temp 的 JS
  // async onGenerated(app) { ... } 可以删掉
});
