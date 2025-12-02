// docs/.vuepress/plugins/autoLinkerPro/index.ts
import type { Plugin } from "vuepress";
import { path as vpPath } from "vuepress/utils";
import fs from "fs";

export interface AutoLinkEntry {
  term: string; // 要匹配的词
  path: string; // 路由路径，如 /docs/world/xxx.html
  filePathRelative?: string;
}

export interface AutoLinkerProOptions {
  /** 最小匹配长度：term 小于这个长度就不参与自动内链 */
  minLength?: number;

  /** 每页最多插入多少个自动链接（防止“满屏蓝字”） */
  maxLinksPerPage?: number;

  /** 同一个词在一页最多出现多少次链接 */
  maxLinksPerTerm?: number;

  /** 黑名单：即便被收录，也永远不自动内链 */
  blacklist?: string[];

  /** 调试开关：true 时会在控制台输出详细 log */
  debug?: boolean;

  /** 索引 JSON 输出路径（相对 public） */
  indexOutput?: string;
}

/**
 * 简单的字符串替换函数：在 text 里把 term 替换成 markdown 链接
 */
function createLinkifier(
  maxLinksPerPage: number,
  maxLinksPerTerm: number
) {
  return function linkifyText(
    text: string,
    entry: AutoLinkEntry,
    termCountMap: Map<string, number>,
    counters: { totalInserted: number }
  ): { text: string; added: number } {
    const term = entry.term;
    const to = entry.path;

    if (!to) return { text, added: 0 };
    if (!text.includes(term)) return { text, added: 0 };

    const parts = text.split(term);
    if (parts.length === 1) return { text, added: 0 };

    let result = parts[0];
    let added = 0;

    for (let i = 1; i < parts.length; i++) {
      // 全页总上限
      if (maxLinksPerPage > 0 && counters.totalInserted >= maxLinksPerPage) {
        result += term + parts.slice(i).join(term);
        return { text: result, added };
      }

      const prevCount = termCountMap.get(term) ?? 0;
      // 单词上限
      if (maxLinksPerTerm > 0 && prevCount >= maxLinksPerTerm) {
        result += term + parts[i];
        continue;
      }

      // 这里我们生成 Markdown 链接，交给 VuePress 后续解析
      const link = `[${term}](${to})`;

      result += link + parts[i];

      termCountMap.set(term, prevCount + 1);
      counters.totalInserted++;
      added++;
    }

    return { text: result, added };
  };
}

export const autoLinkerProPlugin = (
  options: AutoLinkerProOptions = {}
): Plugin => {
  const minLength = options.minLength ?? 2; // 中文建议 2
  const maxLinksPerPage = options.maxLinksPerPage ?? 60;
  const maxLinksPerTerm = options.maxLinksPerTerm ?? 4;
  const blacklist = new Set(options.blacklist ?? []);
  const debug = options.debug ?? false;
  const indexOutput = options.indexOutput ?? "data/auto-link-index.json";

  return {
    name: "vuepress-plugin-auto-linker-pro-static",

    /**
     * 在 onPrepared：
     * 1. 先从 app.pages 构建“标题索引”
     * 2. 写一份 JSON 到 public/data/auto-link-index.json（给前端用）
     * 3. 再遍历所有 page.content，直接做字符串替换，写回去
     */
    async onPrepared(app) {
      /** 1. 构建索引 */
      const index: AutoLinkEntry[] = [];

      const addTerm = (term: string, pagePath: string, filePathRelative?: string) => {
        const t = (term || "").trim();
        if (!t) return;
        if (t.length < minLength) return;
        if (blacklist.has(t)) return;

        index.push({
          term: t,
          path: pagePath,
          filePathRelative,
        });
      };

      for (const page of app.pages) {
        const fm: any = page.frontmatter || {};
        const title =
          (fm.autoLinkTitle ?? page.title ?? "").toString().trim();
        const aliases: string[] = Array.isArray(fm.autoLinkAliases)
          ? fm.autoLinkAliases
          : [];

        const pagePath = page.path;
        if (!pagePath) continue;

        if (title) {
          addTerm(title, pagePath, page.filePathRelative || undefined);
        }

        for (const alias of aliases) {
          addTerm(alias, pagePath, page.filePathRelative || undefined);
        }
      }

      // 按词长从长到短排序（“异常构造” 优先于 “异常”）
      index.sort((a, b) => b.term.length - a.term.length);

      if (debug) {
        console.log("[autoLinkerPro] built index:", index);
      }

      /** 2. 写 JSON 索引到 public 目录（可选） */
      const outFile = vpPath.resolve(app.dir.public(), indexOutput);
      await fs.promises.mkdir(vpPath.dirname(outFile), { recursive: true });
      await fs.promises.writeFile(
        outFile,
        JSON.stringify(index, null, 2),
        "utf-8"
      );

      if (debug) {
        console.log("[autoLinkerPro] index json written:", outFile);
      }

      /** 3. 遍历所有页面，直接改 page.content */
      const linkify = createLinkifier(maxLinksPerPage, maxLinksPerTerm);

      for (const page of app.pages) {
        const fm: any = page.frontmatter || {};
        const autoLink = fm.autoLink;
        // 允许通过 frontmatter 关闭本页自动内链
        if (autoLink === false) continue;

        // 本页的忽略词
        const ignoreList: string[] = Array.isArray(fm.autoLinkIgnore)
          ? fm.autoLinkIgnore
          : [];
        const ignoreSet = new Set(ignoreList);

        let content = page.content;
        if (!content) continue;

        const termCountMap = new Map<string, number>();
        const counters = { totalInserted: 0 };

        for (const entry of index) {
          // 不在本页内把本页标题自己再链一遍
          if (entry.path === page.path) continue;
          if (ignoreSet.has(entry.term)) continue;

          if (
            maxLinksPerPage > 0 &&
            counters.totalInserted >= maxLinksPerPage
          ) {
            break;
          }

          const res = linkify(content, entry, termCountMap, counters);
          if (res.added > 0) {
            content = res.text;
          }
        }

        if (counters.totalInserted > 0) {
          if (debug) {
            console.log(
              `[autoLinkerPro] page ${page.filePathRelative} patched, inserted = ${counters.totalInserted}`
            );
          }
          // 关键：写回 page.content，后面 VuePress 会用这个内容生成 .temp HTML
          page.content = content;
        }
      }
    },
  };
};

export default autoLinkerProPlugin;