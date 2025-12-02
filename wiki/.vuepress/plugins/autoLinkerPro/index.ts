// wiki/.vuepress/plugins/autoLinkerPro/index.ts
import type { Plugin } from "vuepress";
import { path as vpPath } from "vuepress/utils";
import fs from "fs";

/** 一个可自动被链接的词条 */
export interface AutoLinkEntry {
  term: string;            // 要匹配的词
  path: string;            // 路由路径，如 /docs/world/xxx.html
  filePathRelative?: string;
}

/** 插件配置项 */
export interface AutoLinkerProOptions {
  /** 最小匹配长度：term 小于这个长度就不参与自动内链（中文推荐 2） */
  minLength?: number;

  /** 每页最多插入多少个自动链接（防止“满屏蓝字”） */
  maxLinksPerPage?: number;

  /** 同一个词在一页最多出现多少次链接 */
  maxLinksPerTerm?: number;

  /** 黑名单：即便被收录，也永远不自动内链 */
  blacklist?: string[];

  /** 调试开关：true 时会在控制台输出详细 log */
  debug?: boolean;

  /** 索引 JSON 输出路径（相对 public），默认 data/auto-link-index.json */
  indexOutput?: string;
}

/** 全局索引，在 onInitialized 里填充，在 extendsMarkdown 里使用 */
let globalIndex: AutoLinkEntry[] = [];

/**
 * 生成链接替换函数：
 * 给一段纯文本 text，把其中的 term 替换成 <RouteLink> 或 <a> 片段
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

      const first = prevCount === 0;
      const classes = first
        ? "auto-link auto-link--first"
        : "auto-link";

      // 这里直接生成 HTML 片段，交给 Vue 直接渲染
      const link =
        `<RouteLink to="${to}" class="${classes}">` +
        term +
        `</RouteLink>`;

      result += link + parts[i];

      termCountMap.set(term, prevCount + 1);
      counters.totalInserted++;
      added++;
    }

    return { text: result, added };
  };
}

/**
 * 插件主函数
 */
export const autoLinkerProPlugin = (
  options: AutoLinkerProOptions = {}
): Plugin => {
  const minLength = options.minLength ?? 2; // 中文建议 2
  const maxLinksPerPage = options.maxLinksPerPage ?? 60;
  const maxLinksPerTerm = options.maxLinksPerTerm ?? 4;
  const blacklist = new Set(options.blacklist ?? []);
  const debug = options.debug ?? false;
  const indexOutput = options.indexOutput ?? "data/auto-link-index.json";

  const linkify = createLinkifier(maxLinksPerPage, maxLinksPerTerm);

  return {
    name: "vuepress-plugin-auto-linker-pro",

    /**
     * 1. 在 onInitialized 阶段，已经有了 app.pages
     *    - 扫描所有页面标题 & 别名，构建全局索引 globalIndex
     *    - 写一份 JSON 到 public 目录（方便调试或前端使用）
     */
    async onInitialized(app) {
      const idx: AutoLinkEntry[] = [];

      const addTerm = (
        term: string,
        pagePath: string,
        filePathRelative?: string
      ) => {
        const t = (term || "").trim();
        if (!t) return;
        if (t.length < minLength) return;
        if (blacklist.has(t)) return;

        idx.push({
          term: t,
          path: pagePath,
          filePathRelative,
        });
      };

      for (const page of app.pages) {
        const fm: any = page.frontmatter || {};
        const pagePath = page.path;
        if (!pagePath) continue;

        // 优先用 autoLinkTitle，否则用 page.title
        const title =
          (fm.autoLinkTitle ?? page.title ?? "").toString().trim();
        const aliases: string[] = Array.isArray(fm.autoLinkAliases)
          ? fm.autoLinkAliases
          : [];

        if (title) {
          addTerm(title, pagePath, page.filePathRelative || undefined);
        }

        for (const alias of aliases) {
          addTerm(alias, pagePath, page.filePathRelative || undefined);
        }
      }

      // 按词长从长到短排序（避免“异常构造”被“异常”截胡）
      idx.sort((a, b) => b.term.length - a.term.length);
      globalIndex = idx;

      if (debug) {
        console.log("[autoLinkerPro] built index:", globalIndex);
      }

      // 写 JSON 索引到 public 目录
      const outFile = vpPath.resolve(app.dir.public(), indexOutput);
      await fs.promises.mkdir(vpPath.dirname(outFile), { recursive: true });
      await fs.promises.writeFile(
        outFile,
        JSON.stringify(globalIndex, null, 2),
        "utf-8"
      );

      if (debug) {
        console.log("[autoLinkerPro] index json written:", outFile);
      }
    },

    /**
     * 2. 在 extendsMarkdown 阶段，挂 markdown-it 的 core rule
     *    - 这里真正对 token 做替换，把文本变成 <RouteLink>
     */
    extendsMarkdown(md) {
      if (debug) {
        console.log("[autoLinkerPro] extendsMarkdown registered");
      }

      md.core.ruler.push("auto-linker-pro", (state) => {
        if (!globalIndex.length) return;

        const env: any = state.env || {};
        const fm: any = env.frontmatter || {};
        const rel: string = env.filePathRelative || "(unknown)";

        // 页内开关：autoLink: false 可以关闭本页自动内链
        const autoLink = fm.autoLink;
        if (autoLink === false) return;

        // 本页忽略的词
        const ignoreList: string[] = Array.isArray(fm.autoLinkIgnore)
          ? fm.autoLinkIgnore
          : [];
        const ignoreSet = new Set(ignoreList);

        let totalLinksInserted = 0;
        const termCountMap = new Map<string, number>();

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
              // 不在本页把本页自己再链一遍
              if (entry.path === env.path) continue;
              if (ignoreSet.has(entry.term)) continue;

              if (
                maxLinksPerPage > 0 &&
                totalLinksInserted >= maxLinksPerPage
              ) {
                break;
              }

              const res = linkify(
                modified,
                entry,
                termCountMap,
                { totalInserted: totalLinksInserted }
              );

              if (res.added > 0) {
                // 注意：linkify 内部会更新 totalInserted（通过引用对象）
                totalLinksInserted += res.added;
                modified = res.text;
                changed = true;

                if (debug) {
                  console.log(
                    `[autoLinkerPro] link term="${entry.term}" to="${entry.path}" on page ${rel}, added ${res.added}`
                  );
                }
              }
            }

            if (changed && modified !== original) {
              // 把纯文本 token 变成原始 HTML
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