// docs/.vuepress/plugins/autoLinkerPro/index.ts
import type { Plugin, App, Page } from "vuepress";

/**
 * 单个可被自动链接的词条
 */
export interface AutoLinkEntry {
  term: string;  // 要匹配的词
  path: string;  // 站内路径，如 "/docs/xxx.html"
}

/**
 * 插件配置
 */
export interface AutoLinkerProOptions {
  /**
   * 额外手写的索引项（可选）
   * - 可以用来覆盖 / 补充自动生成的
   */
  entries?: AutoLinkEntry[];

  /** 最短词长，低于这个长度不自动链接 */
  minLength?: number;

  /** 黑名单：这些词不参与自动内链 */
  blacklist?: string[];

  /** 白名单：非空时，只允许这些词参与自动内链 */
  whitelist?: string[];

  /** 每个页面最多插入多少个自动链接 */
  maxLinksPerPage?: number;

  /** 每个词在一页里最多出现多少次链接 */
  maxLinksPerTerm?: number;

  /** 调试开关 */
  debug?: boolean;
}

/** 全局索引缓存（自动 + 手写） */
let globalIndex: AutoLinkEntry[] | null = null;

/** 工具：转义正则特殊字符 */
const escapeRegExp = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * 根据 app.pages 自动生成索引，并合并手写 entries
 */
const buildGlobalIndex = (
  app: App,
  options: Required<Omit<AutoLinkerProOptions, "entries">> & {
    entries?: AutoLinkEntry[];
  }
): AutoLinkEntry[] => {
  const { minLength, blacklist, whitelist, debug } = options;

  // 用 Map 去重，key 用 term
  const indexMap = new Map<string, AutoLinkEntry>();

  const addEntry = (term: string, path: string) => {
    const t = term.trim();
    const p = path.trim();
    if (!t || !p) return;
    if (t.length < minLength) return;
    if (blacklist.includes(t)) return;
    if (whitelist.length > 0 && !whitelist.includes(t)) return;
    // 只做站内链接：过滤 http/https
    if (/^https?:\/\//i.test(p)) return;
    if (!indexMap.has(t)) {
      indexMap.set(t, { term: t, path: p });
    }
  };

  // 1. 先加上手写 entries（优先级更高）
  if (options.entries && options.entries.length > 0) {
    for (const e of options.entries) {
      if (!e || !e.term || !e.path) continue;
      addEntry(e.term, e.path);
    }
  }

  // 2. 再扫描所有页面标题 / 别名
  for (const page of app.pages) {
    const fm: any = page.frontmatter || {};
    const autoLink = fm.autoLink ?? true;
    if (!autoLink) continue;

    const baseTitle: string | undefined =
      fm.autoLinkTitle || fm.title || page.title;

    const aliases: string[] = Array.isArray(fm.autoLinkAliases)
      ? fm.autoLinkAliases
      : [];

    const allTerms = [baseTitle, ...aliases].filter(
      (s): s is string => !!s && s.trim().length >= minLength
    );

    for (const term of allTerms) {
      addEntry(term, page.path);
    }
  }

  const index = Array.from(indexMap.values()).sort(
    (a, b) => b.term.length - a.term.length
  );

  if (debug) {
    console.log("[autoLinkerPro] built global index:", index);
  }

  return index;
};

/**
 * 工具：保护不希望被处理的区域
 * - 代码块 ``` ```
 * - 行内代码 `code`
 * - Markdown 链接 [text](url)
 * - 图片 ![alt](url)
 * - HTML 注释 <!-- -->
 *
 * 返回 { text: 替换后的文本, restore: 恢复函数 }
 */
const protectSensitiveAreas = (raw: string) => {
  const placeholders: string[] = [];
  const contents: string[] = [];

  let text = raw;

  const pushPlaceholder = (match: string): string => {
    const id = `__AUTO_LINK_PRO_PLACEHOLDER_${placeholders.length}__`;
    placeholders.push(id);
    contents.push(match);
    return id;
  };

  const patterns: RegExp[] = [
    /```[\s\S]*?```/g,                // fenced code block
    /<!--[\s\S]*?-->/g,               // HTML comments
    /!\[[^\]]*?\]\([^\)]*?\)/g,       // images
    /\[[^\]]+?\]\([^\)]*?\)/g,        // links
    /`[^`]*`/g,                       // inline code
  ];

  for (const pattern of patterns) {
    text = text.replace(pattern, (m) => pushPlaceholder(m));
  }

  const restore = (processed: string): string => {
    let out = processed;
    placeholders.forEach((ph, i) => {
      out = out.replace(ph, contents[i]);
    });
    return out;
  };

  return { text, restore };
};

/**
 * 对单个页面执行自动内链（在 extendsPage 阶段）
 */
const processPageContent = (
  page: Page,
  app: App,
  options: Required<Omit<AutoLinkerProOptions, "entries">> & {
    entries?: AutoLinkEntry[];
  }
) => {
  const fm: any = page.frontmatter || {};
  const autoLink = fm.autoLink ?? true;
  if (!autoLink) return;

  if (!page.content) return;

  // 如果还没构建索引，这里构建一次
  if (!globalIndex) {
    globalIndex = buildGlobalIndex(app, options);
  }

  const ignoreList: string[] = Array.isArray(fm.autoLinkIgnore)
    ? fm.autoLinkIgnore
    : [];

  let content = page.content;
  const { text: protectedText, restore } = protectSensitiveAreas(content);

  let working = protectedText;

  const { maxLinksPerPage, maxLinksPerTerm, debug } = options;

  let totalLinksInserted = 0;
  const termCountMap = new Map<string, number>();

  const isOverPageLimit = () =>
    maxLinksPerPage > 0 && totalLinksInserted >= maxLinksPerPage;

  const increaseTermCount = (term: string) => {
    const prev = termCountMap.get(term) ?? 0;
    termCountMap.set(term, prev + 1);
  };

  const isOverTermLimit = (term: string) => {
    if (maxLinksPerTerm <= 0) return false;
    const count = termCountMap.get(term) ?? 0;
    return count >= maxLinksPerTerm;
  };

  for (const entry of globalIndex!) {
    const term = entry.term;

    // 跳过本页面自己的标题（避免自我链接）
    if (entry.path === page.path) continue;

    // 页面内忽略词
    if (ignoreList.includes(term)) continue;

    // 页内标题等于 term 时也忽略
    if (fm.title && fm.title === term) continue;

    if (isOverPageLimit()) break;
    if (isOverTermLimit(term)) continue;

    const escapedTerm = escapeRegExp(term);
    const pattern = new RegExp(escapedTerm, "g");

    working = working.replace(pattern, (match) => {
      if (isOverPageLimit() || isOverTermLimit(term)) {
        return match;
      }

      increaseTermCount(term);
      totalLinksInserted++;

      const link = entry.path;
      return `[${match}](${link})`; // 交给 Markdown 渲染成 RouterLink
    });
  }

  if (debug && totalLinksInserted > 0) {
    console.log(
      `[autoLinkerPro] patch page: ${page.path} inserted links: ${totalLinksInserted}`
    );
  }

  content = restore(working);
  page.content = content;
};

/**
 * 插件主函数
 */
export const autoLinkerProPlugin = (
  options: AutoLinkerProOptions
): Plugin => {
  const resolved: Required<Omit<AutoLinkerProOptions, "entries">> & {
    entries?: AutoLinkerProOptions["entries"];
  } = {
    minLength: options.minLength ?? 2,
    blacklist: options.blacklist ?? [],
    whitelist: options.whitelist ?? [],
    maxLinksPerPage: options.maxLinksPerPage ?? 80,
    maxLinksPerTerm: options.maxLinksPerTerm ?? 5,
    debug: options.debug ?? false,
    entries: options.entries,
  };

  return {
    name: "vuepress-plugin-auto-linker-pro-page",

    // 每次 dev / build 启动时清空索引缓存
    onInitialized() {
      globalIndex = null;
      if (resolved.debug) {
        console.log("[autoLinkerPro] initialized, reset global index");
      }
    },

    // 对每个 page，在生成阶段直接改 Markdown 内容
    extendsPage(page, app) {
      processPageContent(page, app, resolved);
    },
  };
};

export default autoLinkerProPlugin;