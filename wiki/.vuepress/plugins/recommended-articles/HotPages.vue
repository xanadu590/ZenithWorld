<!-- .vuepress/plugins/recommended-articles/HotPages.vue -->

<template>
  <div class="hot-pages">
    <!-- 上方可选标题，比如“🔥 热门文章” -->
    <h2 v-if="title">{{ title }}</h2>

    <!-- 加载 / 错误状态 -->
    <div v-if="loading">加载热门文章中…</div>
    <div v-else-if="error" class="error">加载失败，请稍后重试</div>

    <!-- 正常数据：热门文章列表 -->
    <ul v-else>
      <li v-for="page in hotList" :key="page.path" class="hot-item">
        <!--
          RouterLink：
          - 左边显示清洗后的标题
          - 右边显示真实访问量（hotScore = pv）
        -->
        <RouterLink :to="page.path" class="hot-link">
          <span class="hot-title">{{ formatTitle(page) }}</span>
          <span class="hot-pv">🔥 {{ page.hotScore }} 次访问</span>
        </RouterLink>

        <!-- 如果以后想加“最后更新时间”，可以在这里恢复
        <span v-if="page.lastUpdated" class="date">
          {{ formatDate(page.lastUpdated) }}
        </span>
        -->
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
/*
  HotPages 组件：在侧边栏 / 页面中展示“热门文章列表”。

  ✅ 数据来源（真实访问量）：
    - 调用 Twikoo 后端：
        https://comment.zenithworld.top/api/popular?days=7&limit=10

      返回数据 PopularItem：
        {
          title: string   // 文章标题
          path: string    // 页面路径，如 "/docs/world/xxx.html"
          pv: number      // 真实访问量（page view）
        }

    - 我们把 pv 映射为 PageMeta.hotScore，用来排序和显示。

  ✅ 过滤规则：
    - 会自动跳过 frontmatter 中设置了 `nosearch: true` 的页面
      （例如你不想让首页 / 一些测试页出现在热门列表里）

  ✅ 可配置 props：
    - title?: string   → 组件上方标题，如 "🔥 热门文章"
    - limit?: number   → 显示条数，默认 10
    - days?: number    → 统计近几天的访问量：
                          7      = 近 7 天
                          30     = 近 30 天
                          36500  = 历史总访问（约 100 年）

  ✅ 在 Markdown 中使用（例）：
    ```vue
    <HotPages title="🔥 热门文章" :limit="8" :days="30" />
    ```
*/

import { ref, onMounted, computed } from "vue";
import { usePages } from "vuepress/client";

const API_BASE = "https://comment.zenithworld.top";

interface PageMeta {
  title: string;
  path: string;
  hotScore: number;        // 这里直接用 pv
  lastUpdated: number | null;
}

interface PopularItem {
  title: string;
  path: string;
  pv: number;
}

const props = defineProps<{
  title?: string;
  limit?: number;
  days?: number;
}>();

// 所有页面元数据（用于读取 frontmatter.nosearch）
const pagesData = usePages();

// 原始热门数据（从 Twikoo /api/popular 读取）
const pages = ref<PageMeta[]>([]);

// 状态
const loading = ref(true);
const error = ref(false);

// 限制条数 & 天数
const limit = computed(() => props.limit ?? 10);
const days = computed(() => props.days ?? 7);

/** ========= 路径工具 & nosearch 检测 ========= **/

// 清洗路径：去掉 index.html / .html 和结尾的 /
function normalizePath(path: string): string {
  if (!path) return "/";
  path = path.replace(/index\.html$/, "");
  path = path.replace(/\.html$/, "");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}

// 判断某个路径对应的页面是否标记了 nosearch: true
function isNoSearch(path: string): boolean {
  const norm = normalizePath(path);
  const page = pagesData.value.find((p) => normalizePath(p.path) === norm);
  const fm = (page as any)?.frontmatter as any;
  return fm?.nosearch === true;
}

/** ========= 挂载时从 Twikoo 拉取数据 ========= **/

onMounted(async () => {
  loading.value = true;
  error.value = false;

  try {
    const res = await fetch(
      `${API_BASE}/api/popular?days=${days.value}&limit=${limit.value}`
    );
    const data = await res.json();

    if (!data.ok || !Array.isArray(data.items)) {
      error.value = true;
      return;
    }

    const items = data.items as PopularItem[];

    // 映射为内部 PageMeta 结构，并过滤掉 nosearch 页面
    pages.value = items
      .filter((it) => !isNoSearch(it.path))
      .map((it) => ({
        title: it.title,
        path: it.path,
        hotScore: it.pv, // 🔥 真实访问量
        lastUpdated: null,
      }));
  } catch (e) {
    console.error("加载热门文章失败", e);
    error.value = true;
  } finally {
    loading.value = false;
  }
});

/** ========= 排序：按 hotScore（pv）降序 ========= **/

const hotList = computed(() => {
  return [...pages.value]
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, limit.value);
});

// 预留：如果以后 Twikoo 返回时间戳，可以用它格式化
function formatDate(ts: number | null) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

/** ========= 标题清洗：模仿你原来的逻辑，统一显示效果 ========= **/

// 某些特殊路径的“强制中文名映射”
const pathTitleOverrides: Record<string, string> = {
  "/": "首页",
  "/docs/": "首页",
  "/docs/advanced-search.html": "高级搜索",
  "/docs/world/characters/superhero/": "角色列表",
  // 以后有新的特殊页面，可以在这里继续加
};

// 核心：把原始 title/path 转成更好看的中文标题
function formatTitle(page: PageMeta): string {
  const rawTitle = (page.title || "").trim();
  const rawPath = page.path || "";

  // 1. 特殊路径优先（首页、高级搜索、汇总页等）
  const override = pathTitleOverrides[rawPath];
  if (override) return override;

  // 2. 去掉站点后缀「| 巅峰世界」
  let t = rawTitle.replace(/\s*\|\s*巅峰世界\s*$/u, "").trim();

  // 3. 如果标题为空，或者只有站点名，就改用路径推一个名字
  if (!t || t === "巅峰世界") {
    const p = normalizePath(rawPath);

    if (p === "/") return "首页";

    // 按目录结构做一些通用映射
    if (p.startsWith("/docs/world/characters/superhero"))
      return "角色：超级英雄列表";
    if (p.startsWith("/docs/world/characters")) return "角色介绍";
    if (p.startsWith("/docs/world/factions")) return "势力与组织";
    if (p.startsWith("/docs/world/concepts")) return "世界观概念";

    // 实在没有规则，就用最后一段路径兜底
    const segs = p.split("/").filter(Boolean);
    const last = segs[segs.length - 1] || "";
    return last || p;
  }

  return t;
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

/* 第二行：日期（如果以后恢复） */
.date {
  opacity: 0.6;
  font-size: 0.75em;
}

.error {
  color: #dc2626;
  font-size: 0.85rem;
}
</style>