// docs/.vuepress/plugins/autoLinkerPro/index.ts
import type { Plugin } from "vuepress";

/**
 * 单个可被自动链接的词条定义
 *
 * - term: 要在正文中匹配的文字（完全匹配，区分大小写）
 * - path: 对应的站内路由地址，如 "/docs/world/xxx.html"
 *
 * 注意：
 * 1. 这里的 path 只用于“站内链接”，不会处理 http / https 的外链
 * 2. term 建议不要太短（例如“火”“风”这种），防止误触发
 */
export interface AutoLinkEntry {
  term: string;  // 要匹配的词
  path: string;  // 只用于站内路径，如 "/docs/xxx.html"
}

/**
 * 插件配置项
 *
 * 整体设计思路：
 * - 本插件不会“自动扫描页面标题”，只使用你手动传入的 entries 做索引
 * - 所有“要自动链接的词”和“跳转目标”都由你在 config.ts 里显式配置
 */
export interface AutoLinkerProOptions {
  /**
   * 词条索引列表（必填）
   *
   * 例：
   * entries: [
   *   { term: "灵动骑士", path: "/docs/world/characters/superhero/character-EtherealKnight.html" },
   *   { term: "异常构造", path: "/docs/world/concepts/isomer/" },
   * ]
   */
  entries: AutoLinkEntry[];

  /**
   * 词条最小长度（默认：2）
   *
   * - 用于过滤太短的 term，防止“火”“风”这种高频、单字词乱匹配
   * - 一般中文站点推荐值：2
   */
  minLength?: number;

  /**
   * 黑名单：
   * - 在这里列出的词，即便出现在 entries 里也会被忽略，不参与自动链接
   * - 适合放入“容易误击的短词”，例如：["火", "风", "水", "土"]
   */
  blacklist?: string[];

  /**
   * 白名单：
   * - 如果为空（默认），表示“所有 entries 中的词只要通过其他过滤就会参与自动链接”
   * - 如果不为空，则“只有白名单里的词才会被真正使用”，其他词会被丢弃
   * - 适合在数据比较杂的时候，先只允许一小撮重点词条
   */
  whitelist?: string[];

  /**
   * 每页最多插入多少个自动生成的链接（默认：80）
   *
   * - 防止某些词频率非常高，导致页面几乎每行都是蓝色链接，影响阅读体验
   * - 设为 0 或负数表示“不限制总数”（一般不建议）
   */
  maxLinksPerPage?: number;

  /**
   * 同一个 term 在同一页最多出现多少次链接（默认：5）
   *
   * - 比如 "灵动骑士" 在某篇文章中出现了 20 次，但你只想前 3 次变成链接，
   *   后面保持普通文本，就可以设置 maxLinksPerTerm: 3
   * - 设为 0 或负数表示“不限制单词次数”
   */
  maxLinksPerTerm?: number;

  /**
   * 调试开关（默认：false）
   *
   * - true 时会在控制台输出索引内容和每页插入的链接统计
   * - 建议开发调试时开，正式环境关
   */
  debug?: boolean;
}

/**
 * 全局静态索引
 *
 * - 在 onInitialized 钩子里，根据 options.entries 过滤、排序之后写入
 * - 运行时只读，不再修改
 */
let globalIndex: AutoLinkEntry[] = [];

/**
 * 插件主函数（纯静态站内版）
 *
 * 核心特点：
 * 1. 不依赖 app.pages，不自动扫描任何页面标题或 frontmatter
 * 2. 不处理外链（http / https），只处理站内路径
 * 3. 遍历 Markdown-it 的 token 列表，对纯文本节点做字符串替换
 */
export const autoLinkerProPlugin = (
  options: AutoLinkerProOptions
): Plugin => {
  // 合并默认配置
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
     * 生命周期钩子：onInitialized
     *
     * - 在应用初始化完成后、页面解析前触发
     * - 这里我们只做一件事：
     *   根据传入的 entries 过滤、清洗、排序，得到最终用于匹配的 globalIndex
     */
    onInitialized() {
      const { minLength, blacklist, whitelist, debug } = resolved;

      globalIndex = (options.entries || [])
        .filter((e) => {
          // 基本字段为空直接丢弃
          if (!e.term || !e.path) return false;

          const term = e.term.trim();
          const path = e.path.trim();

          // 去掉空字符串
          if (!term) return false;

          // 根据最小长度过滤
          if (term.length < minLength) return false;

          // 黑名单优先：命中则直接排除
          if (blacklist.includes(term)) return false;

          // 如果配置了白名单，则只有白名单里的词才会被保留
          if (whitelist.length > 0 && !whitelist.includes(term)) return false;

          // 去掉所有以 http / https 开头的外链，只保留站内路径
          if (/^https?:\/\//i.test(path)) return false;

          return true;
        })
        /**
         * 排序规则：按 term 长度从长到短
         *
         * 原因：
         * - 比如你有 “十二主神” 和 “主神” 两个词
         * - 如果先替换“主神”，后替换“十二主神”，会出现嵌套和覆盖问题
         * - 先替换长词，“十二主神” 整体被替换掉后，就不会再命中“主神”了
         */
        .sort((a, b) => b.term.length - a.term.length);

      if (debug) {
        console.log("[autoLinkerPro] static index (internal only):", globalIndex);
      }
    },

    /**
     * 生命周期钩子：extendsMarkdown
     *
     * - 这里通过 Markdown-it 的 core.ruler 插入一个处理规则
     * - 每次渲染一篇 Markdown 时，都会执行一次该规则
     */
    extendsMarkdown(md) {
      if (resolved.debug) {
        console.log("[autoLinkerPro] extendsMarkdown registered (static mode)");
      }

      md.core.ruler.push("auto-linker-pro-static", (state) => {
        // 如果全局索引为空，直接跳过
        if (!globalIndex.length) return;

        // env 由 VuePress 传入，包含 frontmatter / filePathRelative 等信息
        const env: any = state.env || {};
        const fm: any = env.frontmatter || {};
        const rel: string = env.filePathRelative || "(unknown)";

        // 页内总开关：frontmatter.autoLink === false 时，直接跳过本页
        if (fm.autoLink === false) return;

        // 页内忽略列表：frontmatter.autoLinkIgnore: []（按词条精确匹配）
        const ignoreList: string[] = Array.isArray(fm.autoLinkIgnore)
          ? fm.autoLinkIgnore
          : [];

        const { maxLinksPerPage, maxLinksPerTerm } = resolved;

        // 本页已插入的“自动生成链接”总数
        let totalLinksInserted = 0;

        // 记录每个 term 在本页已被替换多少次
        const termCountMap = new Map<string, number>();

        /**
         * 核心函数：在一段纯文本 text 中，把 term 替换为 <RouteLink> 包裹的 HTML
         *
         * 注意：
         * - 这里不做 Markdown 语义解析，只做最朴素的字符串 split / join
         * - 只处理“一个 term”的情况（外层会循环遍历所有 entries）
         */
        const linkifyOneTerm = (
          text: string,
          entry: AutoLinkEntry
        ): { text: string; added: number } => {
          const term = entry.term;
          const to = entry.path;

          // 不包含该 term，直接返回原文
          if (!text.includes(term)) return { text, added: 0 };

          const parts = text.split(term);
          if (parts.length < 2) return { text, added: 0 };

          let result = parts[0];
          let added = 0;

          // 从第 2 段开始，依次在段与段之间插入链接
          for (let i = 1; i < parts.length; i++) {
            // 1. 检查“整页总上限”
            if (maxLinksPerPage > 0 && totalLinksInserted >= maxLinksPerPage) {
              // 已达上限：剩余部分不再处理，直接拼回原文
              result += term + parts.slice(i).join(term);
              return { text: result, added };
            }

            // 2. 检查“单词上限”
            const prev = termCountMap.get(term) ?? 0;
            if (maxLinksPerTerm > 0 && prev >= maxLinksPerTerm) {
              // 超过该 term 的本页次数上限：后续该词保持原样
              result += term + parts[i];
              continue;
            }

            // 是否是该 term 在本页出现的“第一次自动链接”
            // 方便你在样式上做区分（比如第一次使用更明显的颜色）
            const first = prev === 0;
            const classes = first
              ? "auto-link auto-link--first"
              : "auto-link";

            // 这里只生成站内 RouteLink，不处理外链
            const html = `<RouteLink to="${to}" class="${classes}">${term}</RouteLink>`;

            result += html + parts[i];

            termCountMap.set(term, prev + 1);
            totalLinksInserted++;
            added++;
          }

          return { text: result, added };
        };

        /**
         * 遍历 Markdown-it 的 token 列表
         *
         * 说明：
         * - 每个页面会被解析成一串 token（块级 + 行内）
         * - 我们只处理 type === "inline" 的 token，因为文本内容都在里面
         * - 再往下看 child tokens，只对 type === "text" 的节点做替换
         * - 已经在 [xxx](...) 这种链接内部的文本（link_open/link_close 之间）会被跳过
         */
        const tokens = state.tokens;

        for (const token of tokens) {
          if (token.type !== "inline" || !token.children) continue;

          let inLink = false;

          for (const child of token.children) {
            // 遇到原始 Markdown 链接的开始标记：[text](url)
            if (child.type === "link_open") {
              inLink = true;
              continue;
            }
            // 链接结束标记
            if (child.type === "link_close") {
              inLink = false;
              continue;
            }
            // 已在一个手写链接内部，不做自动内链，避免嵌套
            if (inLink) continue;

            // 只处理“纯文本”节点，其他（如 code_inline、html_inline 等）一律不动
            if (child.type !== "text") continue;

            let text = child.content;
            let modified = text;
            let changed = false;

            // 遍历所有词条索引，依次尝试替换
            for (const entry of globalIndex) {
              const term = entry.term;

              // 页内忽略：如果 frontmatter.autoLinkIgnore 里包含该 term，则跳过
              if (ignoreList.includes(term)) continue;

              // 再次检查整页总上限
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

            // 如果这段文本被替换过，则把当前 child 从 text 节点改为 html_inline 节点
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