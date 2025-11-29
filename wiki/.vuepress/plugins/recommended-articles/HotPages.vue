<!-- .vuepress/plugins/recommended-articles/HotPages.vue -->
<template>
  <div class="hot-pages">
    <!-- 上方标题：如 “🔥 热门文章” -->
    <h2 v-if="title">{{ title }}</h2>

    <!-- 加载 / 错误状态 -->
    <div v-if="loading">加载热门文章中…</div>
    <div v-else-if="error" class="error">加载失败，请稍后重试</div>

    <!-- 真正的热门列表 -->
    <ul v-else>
      <li v-for="page in hotList" :key="page.path" class="hot-item">
        <RouterLink :to="page.path" class="hot-link">
          <!-- 标题显示用 formatTitle，优先用 VuePress 的页面标题 -->
          <span class="hot-title">{{ formatTitle(page) }}</span>
          <span class="hot-pv">🔥 {{ page.hotScore }} 次访问</span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
/*
  HotPages 组件：使用 Twikoo 的 /api/popular 真实访问量，展示热门文章列表。

  ⭐ 核心设计：
  1. PV & 排名 来源：Twikoo 后端 /api/popular
  2. 标题 来源：VuePress 页面数据（frontmatter.title / page.title）
     - 这样可以避免 Twikoo 里历史遗留的“巅峰世界”旧标题
  3. 支持排除逻辑：
     - 手动黑名单 excludePaths
     - 所有 frontmatter 写了 nosearch: true 的页面（由 nosearch 插件生成）

  props:
    - title?: string  → 模块标题，如 “🔥 热门文章”
    - limit?: number  → 显示条数（默认 10）
    - days?: number   → 统计多少天内的访问量（默认 7）
*/

import { ref, onMounted, computed } from "vue";
// 运行时由 VuePress 注入的临时文件，编辑器找不到所以用 ts-ignore
// 里面是所有 frontmatter.nosearch === true 的页面路径
// 例如：["/docs/xxx.html", "/docs/world/characters/..."]
// @ts-ignore
import { nosearchPaths } from "@temp/nosearch/nosearchPaths.js";
// VuePress 提供的所有页面数据访问接口
// 用它来根据 path 取到当前站点的真实标题
// @ts-ignore
import { usePagesData } from "@vuepress/client";

const API_BASE = "https://comment.zenithworld.top";

/** 内部使用的页面结构 */
interface PageMeta {
  title: string;      // 最终展示用标题（经过修正）
  rawTitle: string;   // Twikoo 返回的原始 title（只用于调试）
  path: string;       // 页面路径，如 "/docs/world/xxx.html"
  hotScore: number;   // 热度 = pv
}

/** Twikoo /api/popular 原始返回结构 */
interface PopularItem {
  title: string;
  path: string;
  pv: number;
}

/** 组件 props 定义 */
const props = defineProps<{
  title?: string;
  limit?: number;
  days?: number;
}>();

/** 状态：数据 / 加载 / 错误 */
const pages = ref<PageMeta[]>([]);
const loading = ref(true);
const error = ref(false);

/** 配置：条数 & 天数 */
const limit = computed(() => props.limit ?? 10);
const days = computed(() => props.days ?? 7);

/** ① 手动排除的路径（黑名单） */
const excludePaths = [
  // 例如想永远不展示高级搜索页，可以这样写：
  // "/docs/advanced-search.html",
];

/** 统一规范 path：去掉 index.html / .html 和末尾 /，便于比较 */
function normalizePath(path: string): string {
  if (!path) return "/";
  path = path.replace(/index\.html$/, "");
  path = path.replace(/\.html$/, "");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}

/** 判断一个路径是否需要被排除（黑名单 + nosearch） */
function isExcluded(rawPath: string): boolean {
  const norm = normalizePath(rawPath);

  // a. 手动黑名单
  const inStatic = excludePaths.some(
    (ex) => normalizePath(ex) === norm
  );

  // b. frontmatter.nosearch === true 的页面
  const inNosearch = (nosearchPaths as string[]).some(
    (p) => normalizePath(p) === norm
  );

  // 调试时可以打开这行看看具体命中情况
  console.log("[HotPages] check path", { raw: rawPath, norm, inStatic, inNosearch });

  return inStatic || inNosearch;
}

/** ========= ② 用 VuePress 的页面数据修正标题 ========= */

const pagesData = usePagesData();

/** 根据 Twikoo 的 path 找到对应的 VuePress 页面 key */
function resolvePageDataKey(path: string): string | null {
  // 优先使用完整路径
  if (pagesData[path]) return path;

  // 如果带 hash（#xxx），尝试去掉 hash 部分再查一次
  const base = path.split("#")[0];
  if (pagesData[base]) return base;

  // 再尝试补一个 .html
  if (!base.endsWith(".html") && pagesData[`${base}.html`])
    return `${base}.html`;

  return null;
}

/** 根据 VuePress 页面数据覆盖错误 title */
async function patchTitlesWithPageData() {
  const tasks = pages.value.map(async (p) => {
    const key = resolvePageDataKey(p.path);
    if (!key) return;

    try {
      const loader = pagesData[key];
      const data = await loader(); // { title, frontmatter, ... }
      const fm: any = data.frontmatter || {};

      // 标题优先级：frontmatter.title > data.title > Twikoo 原始标题
      const realTitle: string =
        (fm.title as string) ||
        (data.title as string) ||
        p.rawTitle ||
        p.title;

      if (realTitle && realTitle !== p.title) {
        p.title = realTitle;
      }
    } catch (e) {
      console.warn("[HotPages] load pageData failed", p.path, e);
    }
  });

  await Promise.all(tasks);
}

/** ========= ③ 拉取热门访问数据 + 过滤 + 修正标题 ========= */

onMounted(async () => {
  loading.value = true;
  error.value = false;

  try {
    const url = `${API_BASE}/api/popular?days=${days.value}&limit=${
      limit.value * 2
    }`;
    console.log("[HotPages] fetch url =", url);

    const res = await fetch(url);
    const data = await res.json();

    console.log("[HotPages] raw api data =", data);

    if (!data.ok || !Array.isArray(data.items)) {
      error.value = true;
      return;
    }

    const items = data.items as PopularItem[];

    // 1. 先把 Twikoo 数据转成内部格式，并按 isExcluded 过滤
    pages.value = items
      .map((it) => ({
        title: it.title || "",
        rawTitle: it.title || "",
        path: it.path,
        hotScore: it.pv,
      }))
      .filter((p) => !isExcluded(p.path));

    // 2. 再用 VuePress 的页面数据覆盖掉错误标题
    await patchTitlesWithPageData();

    console.log("[HotPages] pages after patch =", pages.value);
  } catch (e) {
    console.error("加载热门文章失败", e);
    error.value = true;
  } finally {
    loading.value = false;
  }
});

/** ========= ④ 排序 + 截断（最终展示列表） ========= */

const hotList = computed(() => {
  const list = [...pages.value]
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, limit.value);

  console.log("[HotPages] final hotList =", list);
  return list;
});

/** ========= ⑤ 标题展示函数 =========
 * 此时 page.title 已经是“修正后的标题”，这里再兜底一次：
 * - 正常情况：显示修正后的 title
 * - 实在拿不到：最后用 path 顶着
 */
function formatTitle(page: PageMeta): string {
  return (page.title || "").trim() || page.path;
}
</script>

<style scoped>
.hot-pages ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.hot-item {
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0;
}

/* 第一行：标题 + 热度值 */
.hot-link {
  display: flex;
  justify-content: space-between;
  text-decoration: none;
  font-size: 0.9rem;
}

.hot-title {
  flex: 1;
  margin-right: 0.5rem;
}

.hot-pv {
  white-space: nowrap;
  opacity: 0.8;
  font-size: 0.8rem;
}

/* 错误提示 */
.error {
  color: #dc2626;
  font-size: 0.85rem;
}
</style>