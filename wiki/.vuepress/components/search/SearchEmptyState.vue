<template>
  <div class="mfs-empty">
    <div class="mfs-empty-title">没有搜索结果</div>
    <div class="mfs-empty-sub">要不要看看最近更新、热门或随机条目？</div>

    <div class="mfs-empty-panels">
      <section class="mfs-empty-block">
        <h3 class="mfs-empty-block-title">📅 最近更新</h3>
        <RecentPages :limit="5" />
      </section>

      <section class="mfs-empty-block">
        <h3 class="mfs-empty-block-title">🔥 最近热门</h3>
        <HotPages :limit="5" :days="30" />
      </section>

      <section class="mfs-empty-block">
        <h3 class="mfs-empty-block-title">🎲 随机条目</h3>
        <div v-if="randLoading">生成中…</div>
        <div v-else-if="randError" class="mfs-empty-rand-error">
          {{ randError }}
        </div>
        <ul v-else class="mfs-empty-rand-list">
          <li v-for="page in randList" :key="page.path">
            <RouterLink :to="page.path" class="mfs-empty-rand-link">
              {{ page.title }}
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import HotPages from "../../plugins/recommended-articles/HotPages.vue";
import RecentPages from "../../plugins/recommended-articles/RecentPages.vue";
// @ts-ignore
import { nosearchPaths } from "@temp/nosearch/nosearchPaths.js";

interface RandPage {
  title: string;
  path: string;
}

const randList = ref<RandPage[]>([]);
const randLoading = ref(true);
const randError = ref("");

function normalizePath(path: string): string {
  if (!path) return "/";
  path = path.split("#")[0];
  path = path.replace(/index\.html$/, "");
  path = path.replace(/\.html$/, "");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}

function isExcluded(rawPath: string): boolean {
  const norm = normalizePath(rawPath);
  const inNosearch = (nosearchPaths as string[]).some(
    (p) => normalizePath(p) === norm
  );
  return inNosearch;
}

onMounted(async () => {
  try {
    const res = await fetch("/data/recommended-pages.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const all = (await res.json()) as RandPage[];
    const pool = all.filter((p) => !isExcluded(p.path));

    // 洗牌
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    randList.value = pool.slice(0, 5);
  } catch (e: any) {
    randError.value = e?.message || "加载随机条目失败";
  } finally {
    randLoading.value = false;
  }
});
</script>

<style scoped>
.mfs-empty {
  margin-top: 0.5rem;
  padding: 0.9rem 1rem;
  border-radius: 0.9rem;
  border: 1px dashed var(--vp-c-border, #e5e7eb);
  background: rgba(148, 163, 184, 0.06);
}

.mfs-empty-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.15rem;
}

.mfs-empty-sub {
  font-size: 0.85rem;
  color: var(--vp-c-text-2, #6b7280);
  margin-bottom: 0.6rem;
}

/* 三列推荐块：小屏改为 2 / 1 列 */
.mfs-empty-panels {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

@media (max-width: 960px) {
  .mfs-empty-panels {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .mfs-empty-panels {
    grid-template-columns: 1fr;
  }
}

.mfs-empty-block {
  padding: 0.6rem 0.75rem;
  border-radius: 0.75rem;
  background: #ffffff;
  border: 1px solid var(--vp-c-border, #e5e7eb);
}

.mfs-empty-block-title {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.3rem;
}

/* 随机列表样式 */
.mfs-empty-rand-list {
  list-style: none;
  margin: 0;
  padding-left: 0.2rem;
}

.mfs-empty-rand-list li + li {
  margin-top: 0.2rem;
}

.mfs-empty-rand-link {
  font-size: 0.9rem;
  text-decoration: none;
}

.mfs-empty-rand-link:hover {
  text-decoration: underline;
}

.mfs-empty-rand-error {
  font-size: 0.8rem;
  color: #dc2626;
}
</style>