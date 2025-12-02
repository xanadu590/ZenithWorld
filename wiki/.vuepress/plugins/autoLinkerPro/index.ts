// docs/.vuepress/plugins/autoLinkerPro/index.ts
import type { App, Page, Plugin } from "vuepress";

/**
 * 一个可自动被链接的词条
 */
export interface AutoLinkEntry {
  term: string;               // 要匹配的词
  path: string;               // 对应页面最终路由路径，如 /docs/world/xxx.html
  filePathRelative?: string;  // 源文件相对路径，用来识别“当前页面 = 自己”的情况
}

export interface AutoLinkerProOptions {
  /** 最短词长，低于这个长度不自动链接（中文推荐 2） */
  minLength?: number;

  /** 黑名单：这些词即使是标题也不会自动链接 */
  blacklist?: string[];

  /** 白名单：如果设置了，则只有白名单里的词会自动链接 */
  whitelist?: string[];

  /** 每个页面最多插入多少个自动链接（防止满屏“蓝光”） */
  maxLinksPerPage?: number;

  /** 每个词在一页里最多出现多少次链接（比如同一词只链前 3 次） */
  maxLinksPerTerm?: number;

  /** 调试用：开启后会在控制台输出索引信息 */
  debug?: boolean;
}

/** 全站标题索引缓存：onInitialized 时构建，渲染时使用 */
let globalTitleIndex: AutoLinkEntry[] | null = null;

/** 构建全站标题索引（基于所有页面 frontmatter） */
const buildTitleIndex = (
  app: App,
  options: Required<AutoLinkerProOptions>
): AutoLinkEntry[] => {
  const { minLength, blacklist, whitelist, debug } = options;

  const index: AutoLinkEntry[] = [];

  for (const page of app.pages) {
    const fm: any = page.frontmatter || {};
    const autoLink = fm.autoLink ?? true;
    if (!autoLink) continue;

    // 标题优先级：autoLinkTitle > title > page.title
    const baseTitle: string | undefined =
      fm.autoLinkTitle || fm.title || page.title;

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
      if (whitelist.length > 0 && !whitelist.includes(trimmed)) continue;

      index.push({
        term: trimmed,
        path: page.path,
        filePathRelative: page.filePathRelative,
      });
    }
  }

  // 长词优先（保证“异常构造”先于“异常”匹配）
  index.sort((a, b) => b.term.length - a.term.length);

  if (debug) {
    console.log("[autoLinkerPro] built index:", index);
  }

  return index;
};

export const autoLinkerProPlugin = (
  options: AutoLinkerProOptions = {}
): Plugin => {
  const resolved: Required<AutoLinkerProOptions> = {
    minLength: options.minLength ?? 2,
    blacklist: options.blacklist ?? [],
    whitelist: options.whitelist ?? [],
    maxLinksPerPage: options.maxLinksPerPage ?? 80,
    maxLinksPerTerm: options.maxLinksPerTerm ?? 5,
    debug: options.debug ?? false,
  };

  return {
    name: "vuepress-plugin-auto-linker-pro-md",

    /**
     * 1. 应用初始化完成后，构建一次全站标题索引
     */
    onInitialized(app) {
      globalTitleIndex = buildTitleIndex(app, resolved);
      if (resolved.debug) {
        console.log(
          "[autoLinkerPro] auto linker initialized, pages:",
          app.pages.length
        );
      }
    },

    /**
     * 2. 扩展 Markdown：注册一个 core 规则，在每个页面渲染时把词替换成 <a>
     */
    extendsMarkdown(md) {
      if (resolved.debug) {
        console.log("[autoLinkerPro] extendsMarkdown registered");
      }

      md.core.ruler.push("auto-linker-pro", (state) => {
        if (!globalTitleIndex || globalTitleIndex.length === 0) return;

        const env: any = state.env || {};
        const fm: any = env.frontmatter || {};

        // 页内开关：frontmatter.autoLink: false 可以关闭
        const autoLink = fm.autoLink ?? true;
        if (!autoLink) return;

        const ignoreList: string[] = Array.isArray(fm.autoLinkIgnore)
          ? fm.autoLinkIgnore
          : [];

        // 当前页面的源文件相对路径，用来识别“自页面”
        const currentRel: string | undefined = env.filePathRelative;

        const { maxLinksPerPage, maxLinksPerTerm } = resolved;

        let totalLinksInserted = 0;
        const termCountMap = new Map<string, number>();

        // 一个小工具：限制单页 / 单词出现次数，并生成 <a href=" ">term</a >
        const linkifyOneTerm = (
          text: string,
          entry: AutoLinkEntry
        ): { text: string; added: number } => {
          const term = entry.term;
          const href = entry.path;

          if (!text.includes(term)) return { text, added: 0 };

          const parts = text.split(term);
          if (parts.length === 1) return { text, added: 0 };

          let result = parts[0];
          let added = 0;

          for (let i = 1; i < parts.length; i++) {
            // 全页上限
            if (maxLinksPerPage > 0 && totalLinksInserted >= maxLinksPerPage) {
              // 后面的全都不再加链接，原样拼回去
              result += term + parts.slice(i).join(term);
              return { text: result, added };
            }

            // 单词上限
            const prevCount = termCountMap.get(term) ?? 0;
            if (maxLinksPerTerm > 0 && prevCount >= maxLinksPerTerm) {
              result += term + parts[i];
              continue;
            }

            // 真正生成链接
            result += `<a href="${href}">${term}</a >` + parts[i];

            termCountMap.set(term, prevCount + 1);
            totalLinksInserted++;
            added++;
          }

          return { text: result, added };
        };

        // 遍历所有 token
        const tokens = state.tokens;
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];

          // 只处理 inline token（行内内容）
          if (token.type !== "inline" || !token.children) continue;

          const children = token.children;

          let inLink = false;

          for (let j = 0; j < children.length; j++) {
            const child = children[j];

            // 追踪是否在 <a> ... </a > 内部：避免套娃
            if (child.type === "link_open") {
              inLink = true;
              continue;
            }
            if (child.type === "link_close") {
              inLink = false;
              continue;
            }
            if (inLink) continue;

            // 只改纯文本 token；code_inline / html_inline 等都跳过
            if (child.type !== "text") continue;

            let original = child.content;
            let modified = original;
            let changed = false;

            // 依次尝试每个可链接 term
            for (const entry of globalTitleIndex) {
              const term = entry.term;

              // 自己页面的标题 / 别名：避免自连
              if (
                currentRel &&
                entry.filePathRelative &&
                entry.filePathRelative === currentRel
              ) {
                continue;
              }

              // 页内忽略名单
              if (ignoreList.includes(term)) continue;

              // 页标题与 term 本身相等：也跳过（避免对标题自己乱连）
              if (fm.title && fm.title === term) continue;

              // 全页上限用完，直接退出
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
              }
            }

            if (changed && modified !== original) {
              // 用 html_inline 输出原始 HTML（不会被转义）
              child.type = "html_inline";
              child.tag = "";
              child.content = modified;
              child.children = null;
            }
          }
        }

        if (resolved.debug) {
          const rel = env.filePathRelative || "(unknown)";
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