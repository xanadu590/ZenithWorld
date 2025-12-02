// docs/.vuepress/plugins/autoLinkerPro/index.ts
import type { Plugin, App, Page } from "vuepress";
import { fs, path } from "vuepress/utils";

/** 一个可自动被链接的词条 */
export interface AutoLinkEntry {
  term: string;              // 要匹配的词
  path: string;              // 对应页面最终路由路径，如 /docs/world/xxx.html
  filePathRelative?: string; // 调试用：来自哪个源文件
}

export interface AutoLinkerProOptions {
  /** 最小匹配长度：term 长度小于这个数的不参与自动内链（比如中文 2） */
  minLength?: number;
  /** 黑名单：这些词即使被扫描出来，也永远不自动内链 */
  blacklist?: string[];
  /** 每个页面最多插入多少个自动链接（防止满屏“蓝光”） */
  maxLinksPerPage?: number;
  /** 每个词在一页里最多出现多少次链接（比如同一词只链前 3 次） */
  maxLinksPerTerm?: number;
  /** 调试开关 */
  debug?: boolean;
}

/** 判断是否外链：以 http:// 或 https:// 开头 */
const isExternal = (to: string): boolean => /^https?:\/\//i.test(to.trim());

/** 工具：转义正则特殊字符 */
const escapeRegExp = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * 扫描 app.pages，生成“标题/别名 → 路径”索引
 */
const buildTitleIndex = (
  app: App,
  options: Required<AutoLinkerProOptions>
): AutoLinkEntry[] => {
  const { minLength, blacklist, debug } = options;
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

      index.push({
        term: trimmed,
        path: page.path,
        filePathRelative: page.filePathRelative || "",
      });
    }
  }

  // 长词优先（“异常构造”先于“异常”）
  index.sort((a, b) => b.term.length - a.term.length);

  if (debug) {
    console.log("[autoLinkerPro] built index:", index);
  }

  return index;
};

/**
 * 保护不想被替换的区域：
 * - fenced code block   ```...```
 * - HTML 注释           <!-- ... -->
 * - markdown image      ![alt](url)
 * - markdown link       [text](url)
 * - inline code         `code`
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
    /<!--[\s\S]*?-->/g,               // HTML 注释
    /!\[[^\]]*?\]\([^\)]*?\)/g,       // image
    /\[[^\]]+?\]\([^\)]*?\)/g,        // markdown link
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
 * 对单个页面执行自动内链（直接修改 page.content）
 */
const processPageContent = (
  page: Page,
  index: AutoLinkEntry[],
  options: Required<AutoLinkerProOptions>
) => {
  const fm: any = page.frontmatter || {};
  const autoLink = fm.autoLink ?? true;
  if (!autoLink) return;
  if (!page.content) return;

  const ignoreList: string[] = Array.isArray(fm.autoLinkIgnore)
    ? fm.autoLinkIgnore
    : [];

  const { maxLinksPerPage, maxLinksPerTerm, debug } = options;

  let totalLinksInserted = 0;
  const termCountMap = new Map<string, number>();

  const originalContent = page.content;
  const { text: protectedText, restore } = protectSensitiveAreas(originalContent);
  let working = protectedText;

  const isOverPageLimit = () =>
    maxLinksPerPage > 0 && totalLinksInserted >= maxLinksPerPage;

  const isOverTermLimit = (term: string) => {
    if (maxLinksPerTerm <= 0) return false;
    const count = termCountMap.get(term) ?? 0;
    return count >= maxLinksPerTerm;
  };

  // 针对整个 Markdown 文本执行“全局替换”
  for (const entry of index) {
    const term = entry.term;

    // 不在本页中自我链接
    if (entry.path === page.path) continue;

    // 页内忽略
    if (ignoreList.includes(term)) continue;

    if (isOverPageLimit()) break;
    if (!working.includes(term)) continue;

    const escapedTerm = escapeRegExp(term);
    const pattern = new RegExp(escapedTerm, "g");

    working = working.replace(pattern, (match: string): string => {
      if (isOverPageLimit() || isOverTermLimit(term)) {
        return match;
      }

      const prev = termCountMap.get(term) ?? 0;
      termCountMap.set(term, prev + 1);
      totalLinksInserted++;

      const to = entry.path;

      // 内链 / 外链统一先转成 Markdown 链接，交给 VuePress 后续处理
      if (!isExternal(to)) {
        return `[${match}](${to})`;
      }
      return `[${match}](${to})`;
    });
  }

  const finalContent = restore(working);

  // 如果开启 debug，并且真的插入了链接，打印前后对比的片段
  if (debug && totalLinksInserted > 0) {
    const rel = page.filePathRelative || "(unknown)";
    console.log(
      `[autoLinkerPro] page ${rel} inserted links: ${totalLinksInserted}`
    );

    // 打印一小段差异，方便你肉眼确认
    // 这里取前 400 个字符做示例
    const beforeSample = originalContent.slice(0, 400);
    const afterSample = finalContent.slice(0, 400);
    console.log(
      `[autoLinkerPro] BEFORE sample for ${rel}:\n` + beforeSample
    );
    console.log(
      `[autoLinkerPro] AFTER sample for ${rel}:\n` + afterSample
    );
  }

  page.content = finalContent;
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

  return {
    name: "vuepress-plugin-auto-linker-pro-onPrepared",

    /**
     * onPrepared 阶段：
     * 1. 扫描 pages 生成索引
     * 2. 写索引 JSON（temp + public）
     * 3. 直接修改每个 page.content（Markdown）实现自动内链
     */
    async onPrepared(app) {
      const index = buildTitleIndex(app, resolved);

      // ❶ 写 temp JSON，方便将来其它 Node 端插件复用
      const tempFile = app.dir.temp("auto-linker/index.json");
      await fs.ensureDir(path.dirname(tempFile));
      await fs.writeFile(tempFile, JSON.stringify(index, null, 2), "utf-8");

      // ❷ 写 public JSON，方便前端 fetch 使用
      const publicFile = path.resolve(
        app.dir.public(),
        "data/auto-link-index.json"
      );
      await fs.ensureDir(path.dirname(publicFile));
      await fs.writeFile(publicFile, JSON.stringify(index, null, 2), "utf-8");

      if (resolved.debug) {
        console.log("[autoLinkerPro] index json written:", {
          tempFile,
          publicFile,
        });
      }

      // ❸ 遍历所有页面，直接改写 Markdown 内容
      for (const page of app.pages) {
        processPageContent(page, index, resolved);
      }
    },
  };
};

export default autoLinkerProPlugin;