// docs/.vuepress/plugins/autoLinkerPro/index.ts
import type { Plugin, App } from "vuepress";
import fs from "fs";
import { path as vpPath } from "vuepress/utils";

/**
 * 一个可自动被链接的词条
 */
export interface AutoLinkEntry {
  term: string;  // 要匹配的词
  path: string;  // 对应页面最终路由路径，如 /docs/world/xxx.html 或外链 https://...
}

/**
 * 插件配置
 */
export interface AutoLinkerProOptions {
  /** 每个页面最多插入多少个自动链接（防止满屏“蓝光”） */
  maxLinksPerPage?: number;

  /** 每个词在一页里最多出现多少次链接（比如同一词只链前 3 次） */
  maxLinksPerTerm?: number;

  /** 最小匹配长度：term 长度小于这个数的不参与自动内链（比如中文 2） */
  minLength?: number;

  /** 黑名单：这些词即使在标题里出现，也永远不自动内链 */
  blacklist?: string[];

  /** 白名单：如设置，则只有白名单里的词才参与（一般留空不用） */
  whitelist?: string[];

  /** 调试用：开启后会在控制台输出索引信息 */
  debug?: boolean;
}

/**
 * 判断是否外链：以 http:// 或 https:// 开头
 */
const isExternal = (to: string): boolean => {
  return /^https?:\/\//i.test(to.trim());
};

/**
 * 全局索引缓存：由 onInitialized 构建
 */
let globalTitleIndex: AutoLinkEntry[] = [];

/**
 * 自动扫描全站页面，构建“标题/别名 → 路径”索引
 */
const buildTitleIndex = (
  app: App,
  options: Required<AutoLinkerProOptions>
): AutoLinkEntry[] => {
  const { minLength, blacklist, whitelist, debug } = options;

  const index: AutoLinkEntry[] = [];
  const seen = new Set<string>(); // term 去重

  for (const page of app.pages) {
    const fm: any = page.frontmatter || {};

    // page 级开关：autoLink: false 表示本页不作为“词条源”
    const autoLink = fm.autoLink ?? true;
    if (!autoLink) continue;

    // 优先级：autoLinkTitle > frontmatter.title > page.title
    const baseTitle: string | undefined =
      fm.autoLinkTitle || fm.title || page.title;

    const aliases: string[] = Array.isArray(fm.autoLinkAliases)
      ? fm.autoLinkAliases
      : [];

    const allTerms = [baseTitle, ...aliases].filter(
      (s): s is string => !!s && s.trim().length >= minLength
    );

    for (const raw of allTerms) {
      const term = raw.trim();
      if (!term) continue;

      // 长度过滤
      if (term.length < minLength) continue;
      // 黑名单过滤
      if (blacklist.includes(term)) continue;
      // 白名单限制
      if (whitelist.length && !whitelist.includes(term)) continue;

      const key = `${term}@@${page.path}`;
      if (seen.has(key)) continue;
      seen.add(key);

      index.push({
        term,
        path: page.path,
      });
    }
  }

  // 按 term 长度从长到短排序（保证“异常构造”优先于“异常”）
  index.sort((a, b) => b.term.length - a.term.length);

  if (debug) {
    console.log("[autoLinkerPro] built index:", index);
  }

  return index;
};

/**
 * 插件主函数
 */
export const autoLinkerProPlugin = (
  options: AutoLinkerProOptions = {}
): Plugin => {
  const resolved: Required<AutoLinkerProOptions> = {
    maxLinksPerPage: options.maxLinksPerPage ?? 80,
    maxLinksPerTerm: options.maxLinksPerTerm ?? 5,
    minLength: options.minLength ?? 1,
    blacklist: options.blacklist ?? [],
    whitelist: options.whitelist ?? [],
    debug: options.debug ?? false,
  };

  return {
    name: "vuepress-plugin-auto-linker-pro",

    /**
     * 初始化阶段：
     * 1. 扫描 app.pages 生成索引；
     * 2. 缓存在内存里给自动内链用；
     * 3. 同时写出一个静态 JSON 文件，方便你以后复用。
     */
    async onInitialized(app) {
      globalTitleIndex = buildTitleIndex(app, resolved);

      const json = JSON.stringify(globalTitleIndex, null, 2);

      // ① 写到临时目录：.vuepress/.temp/auto-linker/index.json
      const tempFile = vpPath.resolve(app.dir.temp(), "auto-linker/index.json");
      await fs.promises.mkdir(vpPath.dirname(tempFile), { recursive: true });
      await fs.promises.writeFile(tempFile, json, "utf-8");

      // ② 同时写到 public：.vuepress/public/data/auto-link-index.json
      const publicFile = vpPath.resolve(
        app.dir.public(),
        "data/auto-link-index.json"
      );
      await fs.promises.mkdir(vpPath.dirname(publicFile), { recursive: true });
      await fs.promises.writeFile(publicFile, json, "utf-8");

      if (resolved.debug) {
        console.log("[autoLinkerPro] index json written:", {
          tempFile,
          publicFile,
        });
      }
    },

    /**
     * Markdown 扩展：根据全局索引，把纯文本替换成内链/外链
     */
    extendsMarkdown(md) {
      if (resolved.debug) {
        console.log("[autoLinkerPro] extendsMarkdown registered");
      }

      md.core.ruler.push("auto-linker-pro-dynamic", (state) => {
        if (!globalTitleIndex.length) return;

        const env: any = state.env || {};
        const fm: any = env.frontmatter || {};
        const rel: string = env.filePathRelative || "(unknown)";

        // 页内总开关：frontmatter.autoLink: false 可以关闭本页自动内链
        const autoLink = fm.autoLink ?? true;
        if (!autoLink) return;

        // 本页的忽略词列表
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
         * 所有生成的链接都会带 class="auto-link"，首个还会加 auto-link--first
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

            if (child.type !== "text") continue;

            let original = child.content;
            let modified = original;
            let changed = false;

            for (const entry of globalTitleIndex) {
              const term = entry.term;

              // 页内忽略词
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