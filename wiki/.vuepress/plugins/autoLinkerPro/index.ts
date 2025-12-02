// docs/.vuepress/plugins/autoLinkerPro/index.ts
import type { Plugin, App } from "vuepress";
import { fs, path } from "vuepress/utils";

/**
 * 一个可自动被链接的词条
 */
export interface AutoLinkEntry {
  term: string;              // 要匹配的词
  path: string;              // 对应页面最终路由路径，如 /docs/world/xxx.html 或外链 https://...
  filePathRelative?: string; // 只是调试用：这个 term 是哪一个源文件贡献的
}

export interface AutoLinkerProOptions {
  /**
   * 最小匹配长度：term 长度小于这个数的不参与自动内链（比如中文 2）
   */
  minLength?: number;

  /**
   * 黑名单：这些词即使被扫描出来，也永远不自动内链
   * 例如 ["火", "风", "水", "土", "主神", "力量"]
   */
  blacklist?: string[];

  /**
   * 每个页面最多插入多少个自动链接（防止满屏“蓝光”）
   */
  maxLinksPerPage?: number;

  /**
   * 每个词在一页里最多出现多少次链接（比如同一词只链前 3 次）
   */
  maxLinksPerTerm?: number;

  /**
   * 调试用：开启后会在控制台输出更多日志
   */
  debug?: boolean;
}

/** 判断是否外链：以 http:// 或 https:// 开头 */
const isExternal = (to: string): boolean => /^https?:\/\//i.test(to.trim());

/**
 * 利用 app.pages 自动构建「标题/别名 → 路径」索引
 */
const buildTitleIndex = (
  app: App,
  options: Required<AutoLinkerProOptions>
): AutoLinkEntry[] => {
  const { minLength, blacklist, debug } = options;

  const index: AutoLinkEntry[] = [];

  for (const page of app.pages) {
    const fm: any = page.frontmatter || {};

    // 页级开关：frontmatter.autoLink: false 可以关闭本页被扫描 & 被链接
    const autoLink = fm.autoLink ?? true;
    if (!autoLink) continue;

    // 标题优先级：frontmatter.autoLinkTitle > frontmatter.title > page.title
    const baseTitle: string | undefined =
      fm.autoLinkTitle || fm.title || page.title;

    // 别名：frontmatter.autoLinkAliases
    const aliases: string[] = Array.isArray(fm.autoLinkAliases)
      ? fm.autoLinkAliases
      : [];

    const allTerms = [baseTitle, ...aliases].filter(
      (s): s is string => !!s && s.trim().length >= minLength
    );

    for (const term of allTerms) {
      const trimmed = term.trim();
      if (!trimmed) continue;
      if (blacklist.includes(trimmed)) continue;

      index.push({
        term: trimmed,
        path: page.path,
        filePathRelative: page.filePathRelative || "",
      });
    }
  }

  // 按 term 长度从长到短排序，保证“异常构造”先于“异常”
  index.sort((a, b) => b.term.length - a.term.length);

  if (debug) {
    console.log("[autoLinkerPro] built index:", index);
  }

  return index;
};

// ----------------- 主插件 -----------------

export const autoLinkerProPlugin = (
  options: AutoLinkerProOptions = {}
): Plugin => {
  const resolved: Required<AutoLinkerProOptions> = {
    minLength: options.minLength ?? 2,
    blacklist: options.blacklist ?? [],
    maxLinksPerPage: options.maxLinksPerPage ?? 80,
    maxLinksPerTerm: options.maxLinksPerTerm ?? 5,
    debug: options.debug ?? false,
  };

  // 这里存放「全站标题索引」
  let globalTitleIndex: AutoLinkEntry[] = [];

  return {
    name: "vuepress-plugin-auto-linker-pro",

    /**
     * 初始化阶段：
     * 1. 从 app.pages 扫描标题/别名，构建全站索引
     * 2. 把索引写成：
     *    - .temp/auto-linker/index.json（给 Node 端其它插件 import）
     *    - public/data/auto-link-index.json（给浏览器 fetch）
     */
    async onInitialized(app) {
      globalTitleIndex = buildTitleIndex(app, resolved);

      // 写入临时目录：.vuepress/.temp/auto-linker/index.json
      const tempFile = app.dir.temp("auto-linker/index.json");
      const tempDir = path.dirname(tempFile);
      await fs.ensureDir(tempDir);
      await fs.writeFile(
        tempFile,
        JSON.stringify(globalTitleIndex, null, 2),
        "utf-8"
      );

      // 写入 public：.vuepress/public/data/auto-link-index.json
      const publicFile = path.resolve(
        app.dir.public(),
        "data/auto-link-index.json"
      );
      const publicDir = path.dirname(publicFile);
      await fs.ensureDir(publicDir);
      await fs.writeFile(
        publicFile,
        JSON.stringify(globalTitleIndex, null, 2),
        "utf-8"
      );

      if (resolved.debug) {
        console.log("[autoLinkerPro] index json written:", {
          tempFile,
          publicFile,
        });
      }
    },

    /**
     * Markdown 渲染阶段：
     * 利用 globalTitleIndex 对所有普通文本执行自动内链
     */
    extendsMarkdown(md) {
      if (resolved.debug) {
        console.log("[autoLinkerPro] extendsMarkdown registered");
      }

      md.core.ruler.push("auto-linker-pro-dynamic", (state) => {
        const env: any = state.env || {};
        const fm: any = env.frontmatter || {};
        const rel: string = env.filePathRelative || "(unknown)";

        if (resolved.debug) {
          console.log(
            "[autoLinkerPro] RULE START page =",
            rel,
            "| frontmatter.autoLink =",
            fm.autoLink,
            "| globalIndex length =",
            globalTitleIndex.length
          );
        }

        if (!globalTitleIndex.length) {
          if (resolved.debug) {
            console.warn(
              "[autoLinkerPro] globalIndex is empty, skip page:",
              rel
            );
          }
          return;
        }

        // 页内开关：frontmatter.autoLink: false 可以关闭本页自动内链
        const autoLink = fm.autoLink ?? true;
        if (!autoLink) {
          if (resolved.debug) {
            console.log(
              "[autoLinkerPro] page disabled by frontmatter.autoLink=false:",
              rel
            );
          }
          return;
        }

        // 页内忽略列表：frontmatter.autoLinkIgnore: [ "灵动骑士", "异常构造" ]
        const ignoreList: string[] = Array.isArray(fm.autoLinkIgnore)
          ? fm.autoLinkIgnore
          : [];

        const { maxLinksPerPage, maxLinksPerTerm } = resolved;

        let totalLinksInserted = 0;
        const termCountMap = new Map<string, number>();

        /**
         * 把一段纯文本里的 term 替换成链接
         * - 内链：<RouteLink to="...">
         * - 外链：<a href=" " target="_blank" rel="noopener noreferrer">
         * 所有自动生成的链接都会带上 class="auto-link ..."，方便你在 CSS 里高亮
         * 首次出现的链接会额外加 auto-link--first
         */
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
            // 全页上限
            if (maxLinksPerPage > 0 && totalLinksInserted >= maxLinksPerPage) {
              result += term + parts.slice(i).join(term);
              return { text: result, added };
            }

            // 当前词的出现次数
            const prevCount = termCountMap.get(term) ?? 0;
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
                `<a href="${to}" class="${classes}" target="_blank" rel="noopener noreferrer">` +
                term +
                `</a >`;
            } else {
              // 内链：使用 RouteLink，走 Vue Router，无刷新跳转
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

            // 只处理纯文本节点
            if (child.type !== "text") continue;

            let original = child.content;
            let modified = original;
            let changed = false;

            for (const entry of globalTitleIndex) {
              const term = entry.term;

              // 页内忽略名单
              if (ignoreList.includes(term)) continue;

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

                if (resolved.debug) {
                  console.log(
                    `[autoLinkerPro] link term="${term}" to="${entry.path}" on page ${rel}, added ${res.added}`
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

        if (resolved.debug) {
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