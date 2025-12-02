// wiki/.vuepress/plugins/autoLinkerPro/index.ts
import type { Plugin } from "vuepress";
import { path as vpPath } from "@vuepress/utils";
import fs from "fs";

export interface AutoLinkEntry {
  term: string;             // 匹配词
  path: string;             // 路由路径 /docs/xxx.html 或外链
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

  /** 调试开关 */
  debug?: boolean;

  /** 索引 JSON 输出路径（相对 public） */
  indexOutput?: string;
}

/** 判断是否外链：以 http:// 或 https:// 开头 */
const isExternal = (to: string): boolean => /^https?:\/\//i.test(to.trim());

export const autoLinkerProPlugin = (
  options: AutoLinkerProOptions = {}
): Plugin => {
  const minLength = options.minLength ?? 2; // 中文建议 2
  const maxLinksPerPage = options.maxLinksPerPage ?? 60;
  const maxLinksPerTerm = options.maxLinksPerTerm ?? 4;
  const blacklist = new Set(options.blacklist ?? []);
  const debug = options.debug ?? false;
  const indexOutput = options.indexOutput ?? "data/auto-link-index.json";

  // 全局索引（onPrepared 构建，extendsMarkdown 使用）
  let globalIndex: AutoLinkEntry[] = [];

  return {
    name: "vuepress-plugin-auto-linker-pro",

    /** 1. 构建索引 + 写 JSON */
    async onPrepared(app) {
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
        const title = (fm.autoLinkTitle ?? page.title ?? "").toString().trim();
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

      globalIndex = index;

      if (debug) {
        console.log("[autoLinkerPro] built index:", index);
      }

      // 写 JSON 索引到 public 目录
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
    },

    /** 2. 在 markdown 渲染阶段，真正把文本替换成链接 */
    extendsMarkdown(md) {
      if (debug) {
        console.log("[autoLinkerPro] extendsMarkdown registered");
      }

      md.core.ruler.push("auto-linker-pro", (state) => {
        if (!globalIndex.length) return;

        const env: any = state.env || {};
        const fm: any = env.frontmatter || {};
        const rel: string = env.filePathRelative || "(unknown)";

        // frontmatter.autoLink: false 可以关闭本页
        const autoLink = fm.autoLink;
        if (autoLink === false) return;

        const ignoreList: string[] = Array.isArray(fm.autoLinkIgnore)
          ? fm.autoLinkIgnore
          : [];
        const ignoreSet = new Set(ignoreList);

        let totalLinksInserted = 0;
        const termCountMap = new Map<string, number>();

        /** 内部：对一段纯文本做替换，返回新文本和新增数量 */
        const linkifyOneTerm = (
          text: string,
          entry: AutoLinkEntry
        ): { text: string; added: number } => {
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
            if (maxLinksPerPage > 0 && totalLinksInserted >= maxLinksPerPage) {
              result += term + parts.slice(i).join(term);
              return { text: result, added };
            }

            const prevCount = termCountMap.get(term) ?? 0;
            // 单词上限
            if (maxLinksPerTerm > 0 && prevCount >= maxLinksPerTerm) {
              result += term + parts[i];
              continue;
            }

            const first = prevCount === 0;
            const classes = first
              ? "auto-link auto-link--first"
              : "auto-link";

            let replaced = "";

            if (isExternal(to)) {
              // 外链
              replaced =
                `<a href=" " class="${classes}" target="_blank" rel="noopener noreferrer">` +
                term +
                `</a >`;
            } else {
              // 内链：使用 RouteLink
              replaced =
                `<RouteLink to="${to}" class="${classes}">` +
                term +
                `</RouteLink>`;
            }

            result += replaced + parts[i];

            termCountMap.set(term, prevCount + 1);
            totalLinksInserted++;
            added++;
          }

          return { text: result, added };
        };

        const tokens = state.tokens;

        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];
          if (token.type !== "inline" || !token.children) continue;

          const children = token.children;
          let inLink = false;

          for (let j = 0; j < children.length; j++) {
            const child = children[j];

            if (child.type === "link_open") {
              inLink = true;
              continue;
            }
            if (child.type === "link_close") {
              inLink = false;
              continue;
            }
            if (inLink) continue;
            if (child.type !== "text") continue;

            let original = child.content;
            let modified = original;
            let changed = false;

            for (const entry of globalIndex) {
              const term = entry.term;

              // 不给本页自己链自己
              if (entry.path === env.path) continue;

              // 本页忽略词
              if (ignoreSet.has(term)) continue;

              if (
                maxLinksPerPage > 0 &&
                totalLinksInserted >= maxLinksPerPage
              ) {
                break;
              }

              const res = linkifyOneTerm(modified, entry);
              if (res.added > 0) {
                modified = res.text;
                changed = true;

                if (debug) {
                  console.log(
                    `[autoLinkerPro] link term="${term}" to="${entry.path}" on page ${rel}, added ${res.added}`
                  );
                }
              }
            }

            if (changed && modified !== original) {
              child.type = "html_inline";
              child.tag = "";
              child.content = modified;
              child.children = null;
            }
          }
        }

        if (debug) {
          console.log(
            `[autoLinkerPro] page ${rel} inserted links:`,
            totalLinksInserted
          );
        }
      });
    },
  };
};

export default autoLinkerProPlugin;