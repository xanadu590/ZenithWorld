// docs/.vuepress/plugins/autoLinkerPro/index.ts
import type { Plugin, App } from "vuepress";

/**
 * 一个可自动被链接的词条
 */
export interface AutoLinkEntry {
  term: string;  // 要匹配的词
  path: string;  // 对应页面路由路径，如 /docs/world/xxx.html 或外链 https://...
}

export interface AutoLinkerProOptions {
  /** 每个页面最多插入多少个自动链接（防止满屏蓝光） */
  maxLinksPerPage?: number;

  /** 每个词在一页最多出现多少次（建议 3~5） */
  maxLinksPerTerm?: number;

  /** 最小匹配长度（中文推荐 2） */
  minLength?: number;

  /** 黑名单词（不自动内链） */
  blacklist?: string[];

  /** 白名单（如设置则只有白名单词参与） */
  whitelist?: string[];

  /** 调试输出 */
  debug?: boolean;
}

/**
 * 判断是否外链
 */
const isExternal = (to: string) => /^https?:\/\//i.test(to.trim());

/**
 * 自动从所有页面扫描标题，生成词 → 路径映射
 */
const buildTitleIndex = (app: App, opt: Required<AutoLinkerProOptions>): AutoLinkEntry[] => {
  const raw: AutoLinkEntry[] = [];

  for (const page of app.pages) {
    const title = (page.title || "").trim();
    if (!title) continue;

    const to = page.path;

    // 应用白名单
    if (opt.whitelist.length && !opt.whitelist.includes(title)) {
      continue;
    }

    // 屏蔽黑名单
    if (opt.blacklist.includes(title)) continue;

    // 最小长度过滤
    if (title.length < opt.minLength) continue;

    raw.push({
      term: title,
      path: to,
    });
  }

  // 按长度从长到短排序（避免“异常构造”被“异常”覆盖）
  raw.sort((a, b) => b.term.length - a.term.length);

  return raw;
};

/**
 * 插件主函数
 */
export const autoLinkerProPlugin = (
  options: AutoLinkerProOptions
): Plugin => {
  
  const resolved: Required<AutoLinkerProOptions> = {
    maxLinksPerPage: options.maxLinksPerPage ?? 80,
    maxLinksPerTerm: options.maxLinksPerTerm ?? 5,
    minLength: options.minLength ?? 1,
    blacklist: options.blacklist ?? [],
    whitelist: options.whitelist ?? [],
    debug: options.debug ?? false,
  };

  let globalIndex: AutoLinkEntry[] = [];

  return {
    name: "vuepress-plugin-auto-linker-pro",

    /**
     * 在页面全部加载完毕后扫描标题
     */
    onInitialized(app) {
      globalIndex = buildTitleIndex(app, resolved);

      if (resolved.debug) {
        console.log("[autoLinkerPro] built index:", globalIndex);
        console.log("[autoLinkerPro] pages count =", app.pages.length);
      }
    },

    /**
     * Markdown 扩展（自动替换成链接）
     */
    extendsMarkdown(md) {
      if (resolved.debug) {
        console.log("[autoLinkerPro] extendsMarkdown registered");
      }

      md.core.ruler.push("auto-linker-pro", (state) => {
        if (!globalIndex.length) return;

        const env: any = state.env || {};
        const fm: any = env.frontmatter || {};
        const rel = env.filePathRelative || "(unknown)";

        // 页面级开关
        if (fm.autoLink === false) return;

        const ignoreList: string[] = Array.isArray(fm.autoLinkIgnore)
          ? fm.autoLinkIgnore
          : [];

        const { maxLinksPerPage, maxLinksPerTerm } = resolved;

        let totalLinks = 0;
        const termCount = new Map<string, number>();

        /**
         * 替换文本中的 term → <RouteLink>
         */
        const linkifyOneTerm = (text: string, entry: AutoLinkEntry) => {
          const term = entry.term;
          const to = entry.path;

          if (!text.includes(term)) {
            return { text, added: 0 };
          }

          const parts = text.split(term);
          if (parts.length === 1) return { text, added: 0 };

          let result = parts[0];
          let added = 0;

          for (let i = 1; i < parts.length; i++) {

            if (totalLinks >= maxLinksPerPage) {
              result += term + parts.slice(i).join(term);
              return { text: result, added };
            }

            const prev = termCount.get(term) ?? 0;
            if (prev >= maxLinksPerTerm) {
              result += term + parts[i];
              continue;
            }

            const classes = prev === 0
              ? "auto-link auto-link--first"
              : "auto-link";

            let html = "";

            if (isExternal(to)) {
              html =
                `<a href=" " class="${classes}" target="_blank" rel="noopener noreferrer">` +
                term +
                `</a >`;
            } else {
              html =
                `<RouteLink to="${to}" class="${classes}">` +
                term +
                `</RouteLink>`;
            }

            result += html + parts[i];

            termCount.set(term, prev + 1);
            totalLinks++;
            added++;
          }

          return { text: result, added };
        };

        /**
         * 遍历 tokens 进行替换
         */
        const tokens = state.tokens;

        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];
          if (token.type !== "inline" || !token.children) continue;

          let inLink = false;

          for (let j = 0; j < token.children.length; j++) {
            const child = token.children[j];

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

            let modified = child.content;
            let changed = false;

            for (const entry of globalIndex) {
              const term = entry.term;

              if (ignoreList.includes(term)) continue;
              if (totalLinks >= maxLinksPerPage) break;

              const res = linkifyOneTerm(modified, entry);
              if (res.added > 0) {
                modified = res.text;
                changed = true;

                if (resolved.debug) {
                  console.log(
                    `[autoLinkerPro] link term="${term}" → ${entry.path} | page=${rel} | added=${res.added}`
                  );
                }
              }
            }

            if (changed) {
              child.type = "html_inline";
              child.tag = "";
              child.content = modified;
              child.children = null;
            }
          }
        }

        if (resolved.debug) {
          console.log(
            `[autoLinkerPro] page ${rel} totalLinks=`,
            totalLinks
          );
        }
      });
    },
  };
};

export default autoLinkerProPlugin;