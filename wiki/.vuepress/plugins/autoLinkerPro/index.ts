import type { Plugin } from "vuepress";
import { path as vpPath } from "vuepress/utils";
import {
  parse as vueParse,
  transform,
  generate,
  NodeTypes,
  ElementTypes,
} from "@vue/compiler-dom";
import fs from "fs";

/** 词条结构 */
interface Entry {
  term: string;
  path: string;
  filePathRelative?: string;
}

/** 用户配置 */
interface Options {
  minLength?: number;
  maxLinksPerPage?: number;
  maxLinksPerTerm?: number;
  blacklist?: string[];
  debug?: boolean;
  indexOutput?: string;
}

export const autoLinkerSfcAst = (options: Options = {}): Plugin => {
  const {
    minLength = 2,
    maxLinksPerPage = 60,
    maxLinksPerTerm = 4,
    blacklist = [],
    debug = false,
    indexOutput = "data/auto-link-index.json",
  } = options;

  const blacklistSet = new Set(blacklist);

  // 内部函数：生成 <RouterLink> AST 节点
  const makeRouterLink = (to: string, text: string, isFirst: boolean) => ({
    type: NodeTypes.ELEMENT,
    tag: "RouterLink",
    tagType: ElementTypes.COMPONENT,
    props: [
      {
        type: NodeTypes.ATTRIBUTE,
        name: "to",
        value: { type: NodeTypes.TEXT, content: to },
      },
      {
        type: NodeTypes.ATTRIBUTE,
        name: "class",
        value: {
          type: NodeTypes.TEXT,
          content: isFirst ? "auto-link auto-link--first" : "auto-link",
        },
      },
    ],
    // children 里放一个 TEXT 节点
    children: [{ type: NodeTypes.TEXT, content: text }],
  });

  return {
    name: "auto-linker-sfc-ast",

    async onPrepared(app) {
      const entries: Entry[] = [];

      // 1. 先扫描所有标题构建索引
      const addEntry = (
        term: string,
        pagePath: string,
        filePathRelative?: string
      ) => {
        const t = (term || "").trim();
        if (!t) return;
        if (t.length < minLength) return;
        if (blacklistSet.has(t)) return;

        entries.push({ term: t, path: pagePath, filePathRelative });
      };

      for (const page of app.pages) {
        const fm: any = page.frontmatter || {};
        const title = (fm.autoLinkTitle ?? page.title ?? "").toString().trim();
        const aliases = Array.isArray(fm.autoLinkAliases)
          ? fm.autoLinkAliases
          : [];

        if (title) addEntry(title, page.path, page.filePathRelative);
        for (const al of aliases)
          addEntry(al, page.path, page.filePathRelative);
      }

      entries.sort((a, b) => b.term.length - a.term.length);

      // 写 JSON
      const outFile = vpPath.resolve(app.dir.public(), indexOutput);
      await fs.promises.mkdir(vpPath.dirname(outFile), { recursive: true });
      await fs.promises.writeFile(
        outFile,
        JSON.stringify(entries, null, 2),
        "utf-8"
      );

      if (debug) console.log("[autoLinker] index:", entries);

      // 2. 修改 .temp/pages/*.html.vue
      for (const page of app.pages) {
        const fm: any = page.frontmatter || {};
        if (fm.autoLink === false) continue;

        const ignore = new Set(
          Array.isArray(fm.autoLinkIgnore) ? fm.autoLinkIgnore : []
        );

        const compRel = page.componentFilePathRelative;
        if (!compRel) continue;

        const compPath = vpPath.resolve(app.dir.temp(), compRel);
        let sfcCode = "";
        try {
          sfcCode = await fs.promises.readFile(compPath, "utf-8");
        } catch {
          continue;
        }

        const match = sfcCode.match(/<template>([\s\S]*?)<\/template>/);
        if (!match) continue;

        let templateCode = match[1];

        // 解析为 AST
        const ast = vueParse(templateCode);

        let totalInserted = 0;
        const termCount = new Map<string, number>();

        // AST transform: 找 TEXT node 并替换
        transform(ast, {
          nodeTransforms: [
            (node) => {
              // 这里强行把 node 当 any 用，避免 TS 报 node.type / children 错
              const n = node as any;
              if (n.type !== NodeTypes.TEXT) return;

              let text: string = n.content;
              let needReplace = false;
              const newChildren: any[] = [];

              for (const entry of entries) {
                if (entry.path === page.path) continue;
                if (ignore.has(entry.term)) continue;

                const t = entry.term;
                if (!text.includes(t)) continue;

                const parts = text.split(t);
                if (parts.length <= 1) continue;

                let rebuilt: string[] = [parts[0]];

                for (let i = 1; i < parts.length; i++) {
                  if (
                    maxLinksPerPage > 0 &&
                    totalInserted >= maxLinksPerPage
                  ) {
                    // 到达全页上限，后面全部原样拼回去
                    rebuilt.push(t);
                    rebuilt.push(parts.slice(i).join(t));
                    break;
                  }

                  const used = termCount.get(t) ?? 0;
                  if (maxLinksPerTerm > 0 && used >= maxLinksPerTerm) {
                    // 单个词上限，原样拼
                    rebuilt.push(t);
                    rebuilt.push(parts[i]);
                    continue;
                  }

                  // 先把当前累积的纯文本塞进 children
                  const plainText = rebuilt.join("");
                  if (plainText) {
                    newChildren.push(plainText);
                  }

                  // 再插一个 <RouterLink>
                  const linkNode = makeRouterLink(
                    entry.path,
                    t,
                    used === 0
                  );
                  newChildren.push(linkNode);

                  // 重置 rebuilt，从当前剩余文本开始
                  rebuilt = [parts[i]];

                  termCount.set(t, used + 1);
                  totalInserted++;
                  needReplace = true;
                }

                // 把最后一段文本也塞进去
                const tail = rebuilt.join("");
                if (tail) {
                  newChildren.push(tail);
                }

                if (needReplace) break;
              }

              if (needReplace) {
                // 把 TEXT 节点变成复合表达式节点
                n.type = NodeTypes.COMPOUND_EXPRESSION;
                n.children = newChildren; // 这里我们直接用 any，TS 不再报错
              }
            },
          ],
        });

        const newTemplate = generate(ast).code;
        const patched = sfcCode.replace(
          /<template>[\s\S]*?<\/template>/,
          `<template>${newTemplate}</template>`
        );

        await fs.promises.writeFile(compPath, patched, "utf-8");

        if (debug)
          console.log(
            `[autoLinker] patched ${page.filePathRelative}, inserted: ${totalInserted}`
          );
      }
    },
  };
};

export default autoLinkerSfcAst;