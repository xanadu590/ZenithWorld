// docs/.vuepress/plugins/autoLinkerPro/index.ts
import type { Plugin } from "vuepress";

/**
 * 一个可自动被链接的词条
 */
export interface AutoLinkEntry {
  term: string;  // 要匹配的词
  path: string;  // 对应页面最终路由路径，如 /docs/world/xxx.html 或外链 https://...
}

export interface AutoLinkerProOptions {
  /** 提前准备好的“词 → 路径”索引（静态配置或脚本生成） */
  entries: AutoLinkEntry[];

  /** 每个页面最多插入多少个自动链接（防止满屏“蓝光”） */
  maxLinksPerPage?: number;

  /** 每个词在一页里最多出现多少次链接（比如同一词只链前 3 次） */
  maxLinksPerTerm?: number;

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
 * 插件主函数（静态索引版）
 * 这里不依赖 app.pages，只吃传进来的 entries
 */
export const autoLinkerProPlugin = (
  options: AutoLinkerProOptions
): Plugin => {
  const resolved = {
    maxLinksPerPage: options.maxLinksPerPage ?? 80,
    maxLinksPerTerm: options.maxLinksPerTerm ?? 5,
    debug: options.debug ?? false,
  };

  const globalTitleIndex: AutoLinkEntry[] = options.entries || [];

  return {
    name: "vuepress-plugin-auto-linker-pro-md-static",

    extendsMarkdown(md) {
      if (resolved.debug) {
        console.log(
          "[autoLinkerPro] extendsMarkdown registered, entries =",
          globalTitleIndex
        );
      }

      md.core.ruler.push("auto-linker-pro-static", (state) => {
        if (!globalTitleIndex.length) return;

        const env: any = state.env || {};
        const fm: any = env.frontmatter || {};
        const rel: string = env.filePathRelative || "(unknown)";

        // 页内开关：frontmatter.autoLink: false 可以关闭
        const autoLink = fm.autoLink ?? true;
        if (!autoLink) return;

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
         * 会为所有自动生成的链接增加 class="auto-link ..."，方便你用 CSS 控制样式
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