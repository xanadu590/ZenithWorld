<!-- .vuepress/plugins/recommended-articles/RecentPages.vue -->
<template>
  <div class="recent-pages">
    <h2 v-if="title">{{ title }}</h2>

    <div v-if="loading">Loading recent pages…</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <ul v-else>
      <li v-for="page in recentList" :key="page.path">
        <RouterLink :to="page.path">
          <span>{{ page.title }}</span>
        </RouterLink>
        <span v-if="page.lastUpdated" class="date">
          {{ formatDate(page.lastUpdated) }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";

// 运行时由 VuePress 注入，编辑器可能找不到，忽略类型检查即可
// @ts-ignore
import { nosearchPaths } from "@temp/nosearch/nosearchPaths.js";

interface PageMeta {
  title: string;
  path: string;
  hotScore: number;
  lastUpdated: number | null;
}

const props = defineProps<{ title?: string; limit?: number; src?: string }>();

const pages = ref<PageMeta[]>([]);
const loading = ref(true);
const error = ref("");

const src = props.src ?? "/data/recommended-pages.json";
const limit = props.limit ?? 10;

/** 工具：规范 path（去掉 hash、index.html、.html 和末尾 /） */
function normalizePath(path: string): string {
  if (!path) return "/";

  // 去掉锚点 #xxx
  path = path.split("#")[0];

  path = path.replace(/index\.html$/, "");
  path = path.replace(/\.html$/, "");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}

/** 判断某个 path 是否应该被排除（nosearch） */
function isExcluded(rawPath: string): boolean {
  const norm = normalizePath(rawPath);

  const inNosearch = (nosearchPaths as string[]).some(
    (p) => normalizePath(p) === norm
  );

  return inNosearch;
}

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

const recentList = computed(() => {
  return [...pages.value]
    .filter((p) => p.lastUpdated && !isExcluded(p.path))
    .sort((a, b) => (b.lastUpdated ?? 0) - (a.lastUpdated ?? 0))
    .slice(0, limit);
});

function formatDate(ts: number | null) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}
</script>

<style scoped>
.recent-pages ul li {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
}
.date {
  opacity: 0.6;
  font-size: 0.8em;
}
</style>