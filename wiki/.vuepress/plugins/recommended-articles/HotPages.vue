<!-- .vuepress/plugins/recommended-articles/HotPages.vue -->
<template>
  <div class="hot-pages">
    <!-- 模块标题（可选） -->
    <h2 v-if="title">{{ title }}</h2>

    <!-- 加载 / 错误状态 -->
    <div v-if="loading">加载热门文章中…</div>
    <div v-else-if="error" class="error">加载失败，请稍后重试</div>

    <!-- 热门文章列表 -->
    <ul v-else>
      <li v-for="page in hotList" :key="page.path" class="hot-item">
        <RouterLink :to="page.path" class="hot-link">
          <!-- ⭐ 显示用标题：经过“标题映射 + 清洗” -->
          <span class="hot-title">{{ formatTitle(page) }}</span>
          <!-- ⭐ 真实访问量（pv） -->
          <span class="hot-pv">🔥 {{ page.hotScore }} 次访问</span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
/**
 * HotPages 组件
 * =============
 * 目标：用 Twikoo 统计到的“真实访问量（pv）”展示热门文章列表，
 *       但标题要和 RecentPages 一样，用 VuePress 自己的页面标题。
 *
 * 一、数据来源
 * -----------
 * 1) 热度数据（pv）：Twikoo 后端
 *    GET https://comment.zenithworld.top/api/popular?days=7&limit=10
 *
 *    items: { title, path, pv }
 *    - title：当时记录的 document.title（很多是「巅峰世界」或空）
 *    - path：页面路径（关键字段）
 *    - pv：真实访问量
 *
 * 2) 标题映射：构建期生成的 recommended-pages.json
 *    GET /data/recommended-pages.json
 *
 *    items: { title, path, hotScore, lastUpdated }
 *    - 这里的 title 是 VuePress 页面真正的标题（和 RecentPages 用的一样）
 *
 * 我们的做法是：
 *   - 用 Twikoo 的 path + pv 作为热门基础数据
 *   - 再用 /data/recommended-pages.json 把 path → title 映射出来
 *   - 最终标题优先用映射的 title，只有找不到时才兜底用 Twikoo 的 title 或路径片段
 *
 * 二、自动排除
 * -----------
 * 通过 isExcluded() 统一控制：
 *   1) excludePaths：手动黑名单
 *   2) nosearchPaths：所有 frontmatter 写了 nosearch: true 的页面
 */

import { ref, onMounted, computed } from "vue";
// 运行时由 VuePress 注入，编辑器可能找不到，忽略类型检查即可
// @ts-ignore
import { nosearchPaths } from "@temp/nosearch/nosearchPaths.js";

const API_BASE = "https://comment.zenithworld.top";

/** 热门页面的内部结构（基于 Twikoo） */
interface PageMeta {
  title: string;   // Twikoo 记录的原始标题（可能没用）
  path: string;    // 页面路径（匹配用关键）
  hotScore: number; // 真实访问量 pv
}

/** Twikoo /api/popular 返回的结构 */
interface PopularItem {
  title: string;
  path: string;
  pv: number;
}

/** 构建期 JSON 里的结构（只取我们要的字段） */
interface TitleItem {
  title: string;
  path: string;
}

/** 组件 props */
const props = defineProps<{
  title?: string;
  limit?: number;
  days?: number;
}>();

/** 状态：热门页面列表 / 标题映射 / 加载 / 错误 */
const pages = ref<PageMeta[]>([]);
const titleMap = ref<Record<string, string>>({}); // ⭐ path → 标题 映射
const loading = ref(true);
const error = ref(false);

/** 展示条数、统计天数 */
const limit = computed(() => props.limit ?? 10);
const days = computed(() => props.days ?? 7);

/** 手动排除路径（黑名单） */
const excludePaths = [
  // "/docs/advanced-search.html",
  // "/docs/tmp/test.html",
];

/** 工具：规范 path（去掉 index.html、.html 和末尾 /） */
function normalizePath(path: string): string {
  if (!path) return "/";
  path = path.replace(/index\.html$/, "");
  path = path.replace(/\.html$/, "");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}

/** 判断某个 path 是否应该被排除（黑名单 + nosearch） */
function isExcluded(rawPath: string): boolean {
  const norm = normalizePath(rawPath);

  const inStatic = excludePaths.some(
    (ex) => normalizePath(ex) === norm
  );

  const inNosearch = (nosearchPaths as string[]).some(
    (p) => normalizePath(p) === norm
  );

  return inStatic || inNosearch;
}

/** 读取 /data/recommended-pages.json，构建 path → title 映射表 */
async function loadTitleMap() {
  try {
    const res = await fetch("/data/recommended-pages.json");
    if (!res.ok) return;

    const list = (await res.json()) as TitleItem[];

    const map: Record<string, string> = {};
    for (const item of list) {
      const key = normalizePath(item.path);
      if (item.title) {
        map[key] = item.title;
      }
    }
    titleMap.value = map;
  } catch {
    // 失败就算了，只是标题会退回到“slug 兜底”的逻辑
  }
}

/** 核心：组件挂载后，同时拉热门数据和标题映射 */
onMounted(async () => {
  loading.value = true;
  error.value = false;

  try {
    const popularUrl = `${API_BASE}/api/popular?days=${days.value}&limit=${
      limit.value * 2
    }`;

    // 并行请求：热门数据 + 标题映射
    const [popularRes] = await Promise.all([
      fetch(popularUrl),
      loadTitleMap(),
    ]);

    const data = await popularRes.json();

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
      .filter((p) => !isExcluded(p.path));
  } catch (e) {
    console.error("加载热门文章失败", e);
    error.value = true;
  } finally {
    loading.value = false;
  }
});

/** 计算属性：按访问量排序 + 截断到 limit */
const hotList = computed(() => {
  return [...pages.value]
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, limit.value);
});

/**
 * 标题显示逻辑：
 *
 * 1. 优先从 titleMap（/data/recommended-pages.json）中查真正的页面标题。
 *    -> 这样就能和 RecentPages 完全一致。
 *
 * 2. 如果映射里没有，再看 Twikoo 记录的 title：
 *    - 去掉尾部的「| 巅峰世界」
 *    - 如果为「巅峰世界」或空，就认为没用
 *
 * 3. 最后兜底：用路径最后一段（解码后）作为标题。
 */
function formatTitle(page: PageMeta): string {
  const normPath = normalizePath(page.path);

  // ① 先用构建期标题映射（和 RecentPages 一致）
  const mapped = titleMap.value[normPath];
  if (mapped && mapped.trim()) return mapped.trim();

  // ② 再尝试使用 Twikoo 记录的标题做清洗
  let t = (page.title || "").trim();

  // 去掉站点后缀「| 巅峰世界」
  t = t.replace(/\s*\|\s*巅峰世界\s*$/u, "").trim();

  // 如果 title 合理，就直接用
  if (t && !/^巅峰世界$/u.test(t)) {
    return t;
  }

  // ③ 最后兜底：用路径最后一段
  const segs = normPath.split("/").filter(Boolean);
  let last = segs[segs.length - 1] || "";
  try {
    last = decodeURIComponent(last);
  } catch {
    // ignore
  }
  return last || normPath;
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