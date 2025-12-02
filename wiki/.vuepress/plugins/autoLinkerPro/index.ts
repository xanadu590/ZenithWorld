// docs/.vuepress/plugins/autoLinkerPro/index.ts
import type { Plugin } from "vuepress";

/**
 * 单个可被自动链接的词条
 */
export interface AutoLinkEntry {
  term: string;  // 要匹配的词
  path: string;  // 只用于站内路径，如 "/docs/xxx.html"
}

/**
 * 插件配置
 */
export interface AutoLinkerProOptions {
  entries: AutoLinkEntry[];  // 仅使用静态 entries，不扫描 pages

  minLength?: number;
  blacklist?: string[];
  whitelist?: string[];

  maxLinksPerPage?: number;
  maxLinksPerTerm?: number;

  debug?: boolean;
}

/** 全局静态索引（只来自 entries，且只保留站内链接） */
let globalIndex: AutoLinkEntry[] = [];

/**
 * 插件主函数（纯静态站内版）
 */
export const autoLinkerProPlugin = (
  options: AutoLinkerProOptions
): Plugin => {
  const resolved = {
    minLength: options.minLength ?? 2,
    blacklist: options.blacklist ?? [],
    whitelist: options.whitelist ?? [],
    maxLinksPerPage: options.maxLinksPerPage ?? 80,
    maxLinksPerTerm: options.maxLinksPerTerm ?? 5,
    debug: options.debug ?? false,
  };

  return {
    name: "vuepress-plugin-auto-linker-pro-static",

    /**
     * 初始化只做一件事：
     * ✔ 将 entries 过滤、排序 → 变成最终索引
     *   - 过滤掉外链（以 http/https 开头的 path）
     */
    onInitialized() {
      const { minLength, blacklist, whitelist, debug } = resolved;

      globalIndex = (options.entries || [])
        .filter((e) => {
          if (!e.term || !e.path) return false;

          const term = e.term.trim();
          const path = e.path.trim();

          if (!term) return false;
          if (term.length < minLength) return false;
          if (blacklist.includes(term)) return false;
          if (whitelist.length > 0 && !whitelist.includes(term)) return false;

          // 🚫 去掉所有外链：只保留站内路径
          if (/^https?:\/\//i.test(path)) return false;

          return true;
        })
        // 长词优先，避免“主神”被“十二主神”之类的短词抢占
        .sort((a, b) => b.term.length - a.term.length);

      if (debug) {
        console.log("[autoLinkerPro] static index (internal only):", globalIndex);
      }
    },

    /**
     * Markdown 渲染阶段执行自动内链
     */
    extendsMarkdown(md) {
      if (resolved.debug) {
        console.log("[autoLinkerPro] extendsMarkdown registered (static mode)");
      }

      md.core.ruler.push("auto-linker-pro-static", (state) => {
        if (!globalIndex.length) return;

        const env: any = state.env || {};
        const fm: any = env.frontmatter || {};
        const rel: string = env.filePathRelative || "(unknown)";

        // 页内禁用
        if (fm.autoLink === false) return;

        const ignoreList: string[] = Array.isArray(fm.autoLinkIgnore)
          ? fm.autoLinkIgnore
          : [];

        const { maxLinksPerPage, maxLinksPerTerm } = resolved;

        let totalLinksInserted = 0;
        const termCountMap = new Map<string, number>();

        /**
         * 把 text 中出现的 term 替换成 RouteLink
         * （已经保证只有站内 path，没有外链）
         */
        const linkifyOneTerm = (
          text: string,
          entry: AutoLinkEntry
        ): { text: string; added: number } => {
          const term = entry.term;
          const to = entry.path;

          if (!text.includes(term)) return { text, added: 0 };

          const parts = text.split(term);
          if (parts.length < 2) return { text, added: 0 };

          let result = parts[0];
          let added = 0;

          for (let i = 1; i < parts.length; i++) {
            // 一页总上限
            if (maxLinksPerPage > 0 && totalLinksInserted >= maxLinksPerPage) {
              result += term + parts.slice(i).join(term);
              return { text: result, added };
            }

            // 单词上限
            const prev = termCountMap.get(term) ?? 0;
            if (maxLinksPerTerm > 0 && prev >= maxLinksPerTerm) {
              result += term + parts[i];
              continue;
            }

            const first = prev === 0;
            const classes = first
              ? "auto-link auto-link--first"
              : "auto-link";

            // 这里只生成 RouteLink，不再处理外链
            const html = `<RouteLink to="${to}" class="${classes}">${term}</RouteLink>`;

            result += html + parts[i];

            termCountMap.set(term, prev + 1);
            totalLinksInserted++;
            added++;
          }

          return { text: result, added };
        };

        /** 遍历 tokens 内容 */
        const tokens = state.tokens;

        for (const token of tokens) {
          if (token.type !== "inline" || !token.children) continue;

          let inLink = false;

          for (const child of token.children) {
            if (child.type === "link_open") {
              inLink = true;
              continue;
            }
            if (child.type === "link_close") {
              inLink = false;
              continue;
            }
            if (inLink) continue;

            // 只处理纯文本
            if (child.type !== "text") continue;

            let text = child.content;
            let modified = text;
            let changed = false;

            for (const entry of globalIndex) {
              const term = entry.term;

              if (ignoreList.includes(term)) continue;

              // 页上限
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
                    `[autoLinkerPro] link term="${term}" → ${entry.path} on page ${rel}, added ${res.added}`
                  );
                }
              }
            }

            if (changed && modified !== text) {
              child.type = "html_inline";
              child.tag = "";
              child.content = modified;
              child.children = null;
            }
          }
        }

        if (resolved.debug) {
          console.log(
            `[autoLinkerPro] page ${rel} inserted total =`,
            totalLinksInserted
          );
        }
      });
    },
  };
};

export default autoLinkerProPlugin;