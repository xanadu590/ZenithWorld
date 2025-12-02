// docs/.vuepress/plugins/autoLinkerPro/index.ts
import type { App, Page, Plugin } from "vuepress";

export interface AutoLinkEntry {
  term: string;   // 要匹配的词
  path: string;   // 对应页面路径
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

  /** 这些组件标签内部的文字不参与自动内链（<Tag>...</Tag> / <Tag />） */
  ignoreComponentNames?: string[];
}

/** 全局标题索引缓存 */
let globalTitleIndex: AutoLinkEntry[] | null = null;

/** 工具：转义正则特殊字符 */
const escapeRegExp = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
      });
    }
  }

  // 按 term 长度从长到短排序，保证“异常构造”先于“异常”匹配
  index.sort((a, b) => b.term.length - a.term.length);

  if (debug) {
    console.log("[autoLinkerPro] built index:", index);
  }

  return index;
};

/**
 * Markdown 级别保护区占位：
 * - ```code block```
 * - `inline code`
 * - [link](...)
 * - ![img](...)
 * - <!-- 注释 -->
 * - 指定组件块 <Tag>...</Tag> / <Tag />
 */
const protectSensitiveAreas = (
  raw: string,
  ignoreComponentNames: string[]
) => {
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
    // fenced code block ``` ... ```
    /```[\s\S]*?```/g,
    // HTML 注释
    /<!--[\s\S]*?-->/g,
    // markdown image ![alt](url)
    /!\[[^\]]*?\]\([^\)]*?\)/g,
    // markdown link [text](url)
    /\[[^\]]+?\]\([^\)]*?\)/g,
    // inline code `code`
    /`[^`]*`/g,
  ];

  // 忽略的 Vue 组件块
  for (const name of ignoreComponentNames) {
    if (!name) continue;

    // 自闭合 <Tag ... />
    patterns.push(new RegExp(`<${name}[^>]*?\/>`, "g"));

    // 成对标签 <Tag ...> ... </Tag>
    patterns.push(
      new RegExp(`<${name}[^>]*?>[\\s\\S]*?<\\/${name}>`, "g")
    );
  }

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
 * 核心：对单个页面执行自动内链替换（直接改 Markdown：page.content）
 */
const processPageContent = (
  page: Page,
  options: Required<AutoLinkerProOptions>
) => {
  const fm: any = page.frontmatter || {};
  const autoLink = fm.autoLink ?? true;
  if (!autoLink) return;

  if (!page.content) return;
  if (!globalTitleIndex || globalTitleIndex.length === 0) return;

  const ignoreList: string[] = Array.isArray(fm.autoLinkIgnore)
    ? fm.autoLinkIgnore
    : [];

  // 保护不该动的区域
  const { text: protectedText, restore } = protectSensitiveAreas(
    page.content,
    options.ignoreComponentNames
  );

  let working = protectedText;

  const { maxLinksPerPage, maxLinksPerTerm } = options;

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

  for (const entry of globalTitleIndex) {
    const term = entry.term;

    // 跳过本页面自己的标题（避免自我链接）
    if (entry.path === page.path) continue;

    // 页面内忽略词
    if (ignoreList.includes(term)) continue;

    // 页面自身标题如果等于 term，也忽略
    if (fm.title && fm.title === term) continue;

    // 已超本页链接上限，就直接 break
    if (isOverPageLimit()) break;

    // 每个词的计数已达上限
    if (isOverTermLimit(term)) continue;

    const escapedTerm = escapeRegExp(term);
    const pattern = new RegExp(escapedTerm, "g");

    working = working.replace(
      pattern,
      (match, ...args: any[]): string => {
        const fullText: string = args[args.length - 1];
        const offset: number = args[args.length - 2];

        // 再次检查上限
        if (isOverPageLimit() || isOverTermLimit(term)) {
          return match;
        }

        // 简单防一手：如果在 markdown 链接语法里已经被 [] 包裹过，尽量不动
        const before = offset > 0 ? fullText[offset - 1] : "";
        if (before === "[" || before === "!") {
          return match;
        }

        increaseTermCount(term);
        totalLinksInserted++;

        const link = entry.path;

        // 用 markdown 链接语法，之后由 VuePress 正常渲染为 <a>
        return `[${match}](${link})`;
      }
    );
  }

  const finalContent = restore(working);
  (page as any).content = finalContent;
};

/**
 * 插件主函数
 */
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
    ignoreComponentNames: options.ignoreComponentNames ?? [],
  };

  return {
    name: "vuepress-plugin-auto-linker-pro",

    onInitialized(app) {
      // 1. 先构建全局索引（此时 app.pages 已经就绪）
      globalTitleIndex = buildTitleIndex(app, resolved);

      // 2. 再遍历所有页面，直接修改 page.content（Markdown 原文）
      for (const page of app.pages) {
        processPageContent(page, resolved);
      }

      if (resolved.debug) {
        console.log(
          "[autoLinkerPro] auto linking done in onInitialized, pages:",
          app.pages.length
        );
      }
    },
  };
};

export default autoLinkerProPlugin;