// wiki/.vuepress/plugins/autoLinkerPro/index.ts
import type { Plugin } from "vuepress";
import { path as vpPath } from "vuepress/utils";
import fs from "fs";

/** 一个可自动被链接的词条 */
export interface AutoLinkEntry {
  term: string;              // 要匹配的词
  path: string;              // 路由路径，如 /docs/world/xxx.html
  filePathRelative?: string;
  tooltip?: string;          // 悬停提示文本
}

/** 插件配置项 */
export interface AutoLinkerProOptions {
  /** 最小匹配长度：term 小于这个长度就不参与自动内链（中文推荐 2） */
  minLength?: number;

  /** 每页最多插入多少个自动链接（防止“满屏蓝字”） */
  maxLinksPerPage?: number;

  /** 同一个词在一页最多出现多少次链接 */
  maxLinksPerTerm?: number;

  /** 黑名单：即便被收录，也永远不自动内链 */
  blacklist?: string[];

  /** 调试开关：true 时会在控制台输出详细 log */
  debug?: boolean;

  /** 索引 JSON 输出路径（相对 public），默认 data/auto-link-index.json */
  indexOutput?: string;
}

/**
 * 把一段纯文本里的 term 替换成 <RouterLink>，并控制次数
 * ⚠️ 注意：只应该对「纯文本」片段使用，不要传入包含 <tag> 的字符串
 */
function createLinkifier(
  maxLinksPerPage: number,
  maxLinksPerTerm: number
) {
  return function linkifyText(
    text: string,
    entry: AutoLinkEntry,
    termCountMap: Map<string, number>,
    counters: { totalInserted: number }
  ): { text: string; added: number } {
    const term = entry.term;
    const to = entry.path;

    if (!to) return { text, added: 0 };
    if (!text.includes(term)) return { text, added: 0 };

    const parts = text.split(term);
    if (parts.length === 1) return { text, added: 0 };

    let result = parts[0];
    let added = 0;

    for (let i = 1; i < parts.length; i++) {
      // 全页总上限
      if (maxLinksPerPage > 0 && counters.totalInserted >= maxLinksPerPage) {
        result += term + parts.slice(i).join(term);
        return { text: result, added };
      }

      const prevCount = termCountMap.get(term) ?? 0;
      // 单词上限
      if (maxLinksPerTerm > 0 && prevCount >= maxLinksPerTerm) {
        result += term + parts[i];
        continue;
      }

      const first = prevCount === 0;
      const classes = first
        ? "auto-link auto-link--first"
        : "auto-link";

      // tooltip 文本：优先用 entry.tooltip，没有就退回到 term 本身
      const tooltip = (entry.tooltip || term).replace(/"/g, "&quot;");

      // 生成 Vue 模板里的 <RouterLink>，交给前端渲染
      const link =
        `<RouterLink` +
        ` to="${to}"` +
        ` class="${classes}"` +
        ` data-tooltip="${tooltip}"` +    // ✅ 悬停提示用
        `>` +
        term +
        `</RouterLink>`;

      result += link + parts[i];

      termCountMap.set(term, prevCount + 1);
      counters.totalInserted++;
      added++;
    }

    return { text: result, added };
  };
}

/**
 * 插件主函数：在 onPrepared 阶段，直接修改 .temp/pages/*.html.vue 里的 <template>
 */
export const autoLinkerProPlugin = (
  options: AutoLinkerProOptions = {}
): Plugin => {
  const minLength = options.minLength ?? 2; // 中文建议 2
  const maxLinksPerPage = options.maxLinksPerPage ?? 60;
  const maxLinksPerTerm = options.maxLinksPerTerm ?? 4;
  const blacklist = new Set(options.blacklist ?? []);
  const debug = options.debug ?? false;
  const indexOutput = options.indexOutput ?? "data/auto-link-index.json";

  const linkify = createLinkifier(maxLinksPerPage, maxLinksPerTerm);

  return {
    name: "vuepress-plugin-auto-linker-pro-sfc",

    async onPrepared(app) {
      const index: AutoLinkEntry[] = [];

      const addTerm = (
        term: string,
        pagePath: string,
        filePathRelative?: string,
        tooltip?: string
      ) => {
        const t = (term || "").trim();
        if (!t) return;
        if (t.length < minLength) return;
        if (blacklist.has(t)) return;

        index.push({
          term: t,
          path: pagePath,
          filePathRelative,
          tooltip,
        });
      };

      // 1. 扫描所有页面标题 + 别名
      for (const page of app.pages) {
        const fm: any = page.frontmatter || {};
        const pagePath = page.path;
        if (!pagePath) continue;

        // 用于 tooltip 的基础文本（可选）
        const baseTooltip: string =
          (fm.autoLinkTooltip as string) ??
          (fm.summary as string) ??
          (fm.description as string) ??
          "";

        const title =
          (fm.autoLinkTitle ?? page.title ?? "").toString().trim();
        const aliases: string[] = Array.isArray(fm.autoLinkAliases)
          ? fm.autoLinkAliases
          : [];

        if (title) {
          addTerm(title, pagePath, page.filePathRelative || undefined, baseTooltip);
        }

        for (const alias of aliases) {
          addTerm(alias, pagePath, page.filePathRelative || undefined, baseTooltip);
        }
      }

      // 词长从长到短排序（先匹配“异常构造”再匹配“异常”）
      index.sort((a, b) => b.term.length - a.term.length);

      if (debug) {
        console.log("[autoLinkerPro] built index:", index);
      }

      // 2. 写 JSON 索引到 public 目录
      const outFile = vpPath.resolve(app.dir.public(), indexOutput);
      await fs.promises.mkdir(vpPath.dirname(outFile), { recursive: true });
      await fs.promises.writeFile(
        outFile,
        JSON.stringify(index, null, 2),
        "utf-8"
      );

      if (debug) {
        console.log("[autoLinkerPro] index json written:", outFile);
      }

      // 3. 修改 .temp/pages/*.html.vue
      for (const page of app.pages) {
        const fm: any = page.frontmatter || {};
        const autoLink = fm.autoLink;
        if (autoLink === false) continue; // 本页关闭自动内链

        const ignoreList: string[] = Array.isArray(fm.autoLinkIgnore)
          ? fm.autoLinkIgnore
          : [];
        const ignoreSet = new Set(ignoreList);

        const compRel = page.componentFilePathRelative;
        if (!compRel) continue;

        const compPath = vpPath.resolve(app.dir.temp(), compRel);

        // 读 .html.vue 文件
        let sfc: string;
        try {
          sfc = await fs.promises.readFile(compPath, "utf-8");
        } catch {
          continue;
        }

        // 提取 <template> 部分
        const templateMatch = sfc.match(/<template>([\s\S]*?)<\/template>/);
        if (!templateMatch) continue;

        let templateContent = templateMatch[1];

        let totalInserted = 0;
        const termCountMap = new Map<string, number>();

        // 👉 按「标签 / 文本」切分，只替换文本，不碰任何标签和属性
        const segments = templateContent.split(/(<[^>]+>)/g);
        const newSegments: string[] = [];

        // 简单追踪是否在 <a> 或 <RouterLink> 里面，避免嵌套链接
        let inLinkDepth = 0;

        const isTag = (seg: string) =>
          seg.startsWith("<") && seg.endsWith(">");

        const linkOpenRE = /^<\s*(a|RouterLink)\b[^>]*>$/i;
        const linkCloseRE = /^<\s*\/\s*(a|RouterLink)\s*>$/i;

        for (let seg of segments) {
          if (!seg) {
            newSegments.push(seg);
            continue;
          }

          if (isTag(seg)) {
            // 标签本身原样保留
            newSegments.push(seg);

            // 维护 inLinkDepth
            if (linkOpenRE.test(seg)) {
              // 自闭合 <RouterLink ... /> 不算进入
              if (!/\/\s*>$/.test(seg)) {
                inLinkDepth++;
              }
            } else if (linkCloseRE.test(seg)) {
              if (inLinkDepth > 0) inLinkDepth--;
            }

            continue;
          }

          // seg 是纯文本（标签之间的内容）
          // 1. 在已有 <a>/<RouterLink> 内部就不再自动加链接
          if (inLinkDepth > 0) {
            newSegments.push(seg);
            continue;
          }

          // 2. 纯空白就不处理
          if (!seg.trim()) {
            newSegments.push(seg);
            continue;
          }

          let modified = seg;
          let changed = false;

          for (const entry of index) {
            // 不链到自己
            if (
              entry.path === page.path ||
              entry.filePathRelative === page.filePathRelative
            ) {
              continue;
            }
            if (ignoreSet.has(entry.term)) continue;

            if (
              maxLinksPerPage > 0 &&
              totalInserted >= maxLinksPerPage
            ) {
              break;
            }

            const counters = { totalInserted };
            const res = linkify(
              modified,
              entry,
              termCountMap,
              counters
            );

            if (res.added > 0) {
              totalInserted += res.added;
              modified = res.text;
              changed = true;

              if (debug) {
                console.log(
                  `[autoLinkerPro] SFC page ${page.filePathRelative} link term="${entry.term}" -> "${entry.path}", added ${res.added}`
                );
              }
            }
          }

          newSegments.push(changed ? modified : seg);
        }

        const newTemplateContent = newSegments.join("");

        if (totalInserted > 0 && newTemplateContent !== templateContent) {
          const newTemplateBlock = `<template>${newTemplateContent}</template>`;
          const newSfc = sfc.replace(
            /<template>[\s\S]*?<\/template>/,
            newTemplateBlock
          );

          await fs.promises.writeFile(compPath, newSfc, "utf-8");

          if (debug) {
            console.log(
              `[autoLinkerPro] SFC page ${page.filePathRelative} patched, inserted = ${totalInserted}`
            );
          }
        }
      }
    },
  };
};

export default autoLinkerProPlugin;