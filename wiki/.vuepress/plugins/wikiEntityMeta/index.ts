import type { Plugin } from "vuepress";
import { fs, path } from "@vuepress/utils";

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

  async onPrepared(app) {
    const items: EntityMetaItem[] = [];

    /** 中文标签 → 字段名 */
    const LABEL_MAP: Record<string, keyof EntityMetaItem> = {
      "姓名": "name",
      "名称": "name",
      "本名": "name",
      "简称": "shortName",
      "外号": "shortName",
      "别名": "alias",
      "又名": "alias",
      "英文名": "enName",
      "英文名称": "enName",
      "称号": "title",
      "头衔": "title",
    };

    for (const page of app.pages) {
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
      let inBasic = false;
      const meta: Partial<EntityMetaItem> = {};

      for (const raw of lines) {
        const line = raw.trim();

        if (/^##\s*基本信息/.test(line)) {
          inBasic = true;
          continue;
        }

        if (inBasic && /^##\s+/.test(line)) break;

        if (!inBasic) continue;

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

    /** 输出 JS 文件 */
    const outFile = path.join(
      app.dir.source(), // 即 wiki/ 目录
      ".vuepress/public/data/wiki-entity-meta.js"
    );

    const jsContent =
      "export const wikiEntityMetaItems = " +
      JSON.stringify(items, null, 2) +
      ";\n";

    await fs.writeFile(outFile, jsContent, "utf-8");

    console.log(`[wiki-entity-meta] generated: ${outFile}`);
  },
});
