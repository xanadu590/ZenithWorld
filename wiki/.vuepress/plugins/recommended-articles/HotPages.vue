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
    - hotScore = pv（真实访问量）
    - 支持 props: title / limit / days
    - 自动排除：
        1) 代码里的 excludePaths（手动写死）
        2) 所有 frontmatter 写了 nosearch: true 的页面
*/

import { ref, onMounted, computed } from "vue";
// 👇 这行是插件在构建期生成的“排除路径列表”
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

/** ① 手动排除表（需要的话可以在这里继续加） */
const excludePaths = [
  // "/docs/advanced-search.html",
  // "/docs/tmp/test.html",
];

/** 统一规范一下 path（去掉 index.html / .html 和末尾的 /） */
function normalizePath(path: string): string {
  if (!path) return "/";
  path = path.replace(/index\.html$/, "");
  path = path.replace(/\.html$/, "");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}

/** ② 综合判断：是否需要排除 */
function isExcluded(path: string): boolean {
  const norm = normalizePath(path);

  // a. 手动写在 excludePaths 里的
  const inStatic = excludePaths.some((ex) => normalizePath(ex) === norm);

  // b. frontmatter 里写了 nosearch: true 的
  const inNosearch = (nosearchPaths as string[]).some(
    (p) => normalizePath(p) === norm
  );

  return inStatic || inNosearch;
}

/** 核心：拉取热门访问数据 */
onMounted(async () => {
  loading.value = true;
  error.value = false;

  try {
    const res = await fetch(
      `${API_BASE}/api/popular?days=${days.value}&limit=${limit.value * 2}`
      // *2：预留一些被过滤掉的名额
    );
    const data = await res.json();

    if (!data.ok || !Array.isArray(data.items)) {
      error.value = true;
      return;
    }

    const items = data.items as PopularItem[];

    pages.value = items
      .map((it) => ({
        title: it.title,
        path: it.path,
        hotScore: it.pv,
      }))
      // 👇 在这里统一过滤掉不该显示的页面
      .filter((p) => !isExcluded(p.path));
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

/** 标题清洗：目前用最简单策略，直接显示文章标题 */
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