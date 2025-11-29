<!-- recommended-articles/HotPages.vue -->

<template>
  <div class="hot-pages">
    <!--
      props.title (可选)：组件上方显示的标题
      例：<HotPages title="🔥 热门文章" />

      如果没有传 title，就不显示这行 h2。
    -->
    <h2 v-if="title">{{ title }}</h2>

    <!-- 加载状态 / 错误状态提示 -->
    <div v-if="loading">Loading hot pages…</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <!-- 数据正常时展示“热门文章列表” -->
    <ul v-else>
      <li v-for="page in hotList" :key="page.path" class="hot-item">
        <!--
          RouterLink:
          - 点击后跳转到对应词条页面
          - 左边显示处理过的标题
          - 右边显示“热度值”（hotScore）
        -->
        <RouterLink :to="page.path" class="hot-link">
          <span class="hot-title">{{ formatTitle(page) }}</span>
          <span class="hot-pv">
            🔥 {{ page.hotScore ?? 0 }} 热度
          </span>
        </RouterLink>

        <!-- 
        下面这一小行是“最后更新时间”，可选 
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

  ✅ 数据来源：
    - 默认从 /data/recommended-pages.json 读取一个数组
      数组元素结构 PageMeta：
        {
          title: string        // 原始标题（可能是“巅峰世界 | 巅峰世界”）
          path: string         // 页面路径，如 "/docs/world/xxx.html"
          hotScore: number     // 热度值（可以是访问量、综合评分等）
          lastUpdated: number  // 最后更新时间的时间戳（毫秒），可选
        }

    - 这个 JSON 一般由你的脚本生成（比如结合真实 PV、更新时间计算一个 hotScore）

  ✅ 组件用途：
    - 在任意页面中插入一个“热门词条”小模块
    - 按 hotScore 从高到低排序，hotScore 相同时按 lastUpdated 从新到旧
    - 标题会做一层“清洗和映射”，避免出现难看的路径/站点名

  ✅ 可配置 props：
    - title?: string   → 组件上方标题，如 "🔥 热门文章"
    - limit?: number   → 显示条数，默认 10
    - src?: string     → 数据 JSON 的路径，默认 "/data/recommended-pages.json"
 */

import { ref, onMounted, computed } from "vue";

interface PageMeta {
  title: string;
  path: string;
  hotScore: number;
  lastUpdated: number | null;
}

const props = defineProps<{ title?: string; limit?: number; src?: string }>();

// 原始数据（从 JSON 读取）
const pages = ref<PageMeta[]>([]);

// 加载状态
const loading = ref(true);
const error = ref("");

// JSON 文件地址与条数限制
const src = props.src ?? "/data/recommended-pages.json";
const limit = props.limit ?? 10;

// 组件挂载后，从指定 src 拉取数据
onMounted(async () => {
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    pages.value = await res.json();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});

// 计算属性：按照 hotScore / lastUpdated 排序后，截取前 limit 条
const hotList = computed(() => {
  return [...pages.value]
    .sort(
      (a, b) =>
        (b.hotScore ?? 0) - (a.hotScore ?? 0) || // 先按热度值降序
        (b.lastUpdated ?? 0) - (a.lastUpdated ?? 0) // 热度相同再按更新时间
    )
    .slice(0, limit);
});

// 时间戳格式化为 YYYY-MM-DD
function formatDate(ts: number | null) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

/** ===== 标题清洗：模仿热门弹窗组件，统一显示效果 ===== */

// 某些特殊路径的“强制中文名映射”
const pathTitleOverrides: Record<string, string> = {
  "/": "首页",
  "/docs/": "首页",
  "/docs/advanced-search.html": "高级搜索",
  "/docs/world/characters/superhero/": "角色列表",
  // 以后有新的特殊页面，可以在这里继续加
};

// 清洗路径：去掉 index.html / .html 和结尾的 /
function normalizePath(path: string): string {
  if (!path) return "/";
  path = path.replace(/index\.html$/, "");
  path = path.replace(/\.html$/, "");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}

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

/* 第二行：日期（如果有） */
.date {
  opacity: 0.6;
  font-size: 0.75em;
}
</style>