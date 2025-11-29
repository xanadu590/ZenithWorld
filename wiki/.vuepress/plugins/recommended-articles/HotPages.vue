<!-- .vuepress/plugins/recommended-articles/HotPages.vue -->
<template>
  <div class="hot-pages">
    <h2 v-if="title">{{ title }}</h2>

    <div v-if="loading">加载热门文章中…</div>
    <div v-else-if="error" class="error">加载失败，请稍后重试</div>

    <ul v-else>
      <li v-for="page in hotList" :key="page.path" class="hot-item">
        <RouterLink :to="page.path" class="hot-link">
          <span class="hot-title">{{ formatTitle(page) }}</span>
          <span class="hot-pv">🔥 {{ page.hotScore }} 次访问</span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
/*
  HotPages 组件：使用 Twikoo 的 /api/popular 真实访问量，展示热门文章列表

  ✅ 数据来源：
    GET https://comment.zenithworld.top/api/popular?days=7&limit=10

  ✅ 已接入：
    - hotScore = pv (真实访问量)
    - 支持 props: title / limit / days
    - 自动排除：
        1) 代码里的 excludePaths（手动写死）
        2) 所有 frontmatter 写 nosearch: true 的页面
*/

import { ref, onMounted, computed } from "vue";
// 这是挂在构建期生成的临时模块，路径不要带 .js 后缀
import { nosearchPaths } from "@temp/nosearch/nosearchPaths";

const API_BASE = "https://comment.zenithworld.top";

interface PageMeta {
  title: string;
  path: string;
  hotScore: number; // 直接用 pv
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

const pages = ref<PageMeta[]>([]);
const loading = ref(true);
const error = ref(false);

const limit = computed(() => props.limit ?? 10);
const days = computed(() => props.days ?? 7);

/** === 手动排除的路径（简单黑名单）=== */
const excludePaths = [
  // "/docs/advanced-search.html",
  // "/docs/tmp/test.html",
];

/** 统一规范 path：去 index.html / .html 和末尾 / */
function normalizePath(path: string): string {
  if (!path) return "/";
  path = path.replace(/index\.html$/, "");
  path = path.replace(/\.html$/, "");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}

/** 核心：拉取热门访问数据 + 过滤 nosearch */
onMounted(async () => {
  loading.value = true;
  error.value = false;

  try {
    const res = await fetch(
      `${API_BASE}/api/popular?days=${days.value}&limit=${limit.value * 2}`
      // *2：多拉一些，防止过滤掉之后数量不够
    );
    const data = await res.json();

    if (!data.ok || !Array.isArray(data.items)) {
      error.value = true;
      return;
    }

    const items = data.items as PopularItem[];

    pages.value = items
      // API 数据 → 内部结构
      .map((it) => ({
        title: it.title,
        path: it.path,
        hotScore: it.pv,
      }))
      // 1）过滤手动 excludePaths
      .filter((p) => {
        const norm = normalizePath(p.path);
        return !excludePaths.some((ex) => normalizePath(ex) === norm);
      })
      // 2）过滤 frontmatter: nosearch: true 的页面
      .filter((p) => {
        const norm = normalizePath(p.path);
        return !nosearchPaths.includes(norm);
      });
  } catch (e) {
    console.error("加载热门文章失败", e);
    error.value = true;
  } finally {
    loading.value = false;
  }
});

/** 排序 + 截断 */
const hotList = computed(() => {
  return [...pages.value]
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, limit.value);
});

/** 标题显示：现在直接用后端给的 title，如果为空就用 path 兜底 */
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