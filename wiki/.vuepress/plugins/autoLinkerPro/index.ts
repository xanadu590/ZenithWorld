// docs/.vuepress/plugins/autoLinkerPro/index.ts
import type { App, Page, Plugin } from "vuepress";

export interface AutoLinkEntry {
  term: string;   // 要匹配的词
  path: string;   // 对应页面路径
}

export interface AutoLinkerProOptions {
  /**
   * 最短词长，低于这个长度不自动链接
   * 中文建议 2，纯英文项目可以设为 3
   */
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

  /** 这些组件的标签内部内容不参与自动内链 */
  ignoreComponentNames?: string[];
}

/**
 * 内部：全局标题索引缓存
 */
let globalTitleIndex: AutoLinkEntry[] | null = null;

/**
 * 工具：转义正则特殊字符
 */
const escapeRegExp = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * 构建全站标题索引（仅执行一次）
 */
const buildTitleIndex = (
  app: App,
  options: Required<AutoLinkerProOptions>
): AutoLinkEntry[] => {
  const { minLength, blacklist, whitelist, debug } = options;

  const index: AutoLinkEntry[] = [];

  for (const page of app.pages) {
    const fm: any = page.frontmatter || {};
    const autoLink = fm.autoLink ?? true; // 默认启用

    if (!autoLink) continue;

    // 标题优先级：frontmatter.autoLinkTitle > frontmatter.title > page.title
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
 * 工具：占位并保护不想被处理的区域
 * - fenced code block   ```...```
 * - inline code         `...`
 * - markdown link       [text](...)
 * - image               ![alt](...)
 * - HTML 注释           <!-- ... -->
 * - 指定组件块         <Tag ...>...</Tag> 或 <Tag ... />
 *
 * 返回值：
 *   { text: 替换后的文本, restore: 恢复函数 }
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

  // 顺序有点讲究：先长块再行内
  const patterns: RegExp[] = [
    // fenced code block
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

  // 新增：忽略的 Vue 组件块
  // 1. <Tag ... /> 自闭合组件
  // 2. <Tag ...> ... </Tag> 成对组件（支持多行）
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
 * 核心：对单个页面执行自动内链替换
 * 注意：这里不再需要 app，只依赖全局的 globalTitleIndex
 */
const processPageContent = (
  page: Page,
  options: Required<AutoLinkerProOptions>
) => {
  const fm: any = page.frontmatter || {};
  const autoLink = fm.autoLink ?? true;
  if (!autoLink) return;

  // 没内容或没索引不处理
  if (!page.content || !globalTitleIndex || globalTitleIndex.length === 0) {
    return;
  }

  const ignoreList: string[] = Array.isArray(fm.autoLinkIgnore)
    ? fm.autoLinkIgnore
    : [];

  let content = page.content;
  const { text: protectedText, restore } = protectSensitiveAreas(
    content,
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

    // 在 working 文本中替换该 term
    working = working.replace(
      pattern,
      (match, ...args: any[]): string => {
        // 原始字符串在最后一个参数
        const fullText: string = args[args.length - 1];
        const offset: number = args[args.length - 2];

        // 再次检查全局 / 词级 上限
        if (isOverPageLimit() || isOverTermLimit(term)) {
          return match;
        }

        // 前后字符检查，避免在 markdown 标记中乱插
        const before = offset > 0 ? fullText[offset - 1] : "";
        const after =
          offset + match.length < fullText.length
            ? fullText[offset + match.length]
            : "";

        // 如果前面是 [ 或 ! 或 `，很可能是链接 / 图片 / 代码，跳过
        if (before === "[" || before === "!" || before === "`") {
          return match;
        }

        // 确认要替换
        increaseTermCount(term);
        totalLinksInserted++;

        const link = entry.path;

        return `[${match}](${link})`;
      }
    );
  }

  // 恢复所有保护区域
  content = restore(working);
  page.content = content;
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

    // 每次 dev / build 启动时清空索引缓存
    onInitialized() {
      globalTitleIndex = null;
    },

    // 在所有页面解析完之后构建索引并处理页面内容
    async onPrepared(app) {
      // 先构建全局索引
      globalTitleIndex = buildTitleIndex(app, resolved);

      // 然后遍历每一页做自动内链
      for (const page of app.pages) {
        processPageContent(page, resolved);
      }

      if (resolved.debug) {
        console.log(
          "[autoLinkerPro] processed pages with auto linking, total pages:",
          app.pages.length
        );
      }
    },
  };
};

export default autoLinkerProPlugin;