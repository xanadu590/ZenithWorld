<template>
  <div class="meili-filter-search">
    <!-- ✅ 顶部固定区域：搜索输入 + 分类 + 标签 + 排序 -->
    <div class="mfs-header-sticky">
      <!-- 顶部控制区：搜索输入 + 分类 + 标签 -->
      <MeiliFilterControls
        :keyword="keyword"
        :selected-tags="selectedTags"
        :type-options="typeOptions"
        :active-type="activeType"
        :available-tags="availableTags"
        :visible-tags="visibleTags"
        :has-any-filter="hasAnyFilter"
        @update:keyword="handleUpdateKeyword"
        @search="search"
        @toggle-tag="toggleTag"
        @set-type="setType"
        @reset-filters="resetFilters"
      />

      <!-- 排序方式选择：相关度 / 最新更新 / 最多访问（真实访问量） -->
      <div class="mfs-sort">
        <span class="mfs-sort-label">排序：</span>

        <button
          class="mfs-sort-btn"
          :class="{ 'is-active': sortMode === 'relevance' }"
          @click="setSort('relevance')"
        >
          相关度
        </button>

        <button
          class="mfs-sort-btn"
          :class="{ 'is-active': sortMode === 'updatedAt' }"
          @click="setSort('updatedAt')"
        >
          最新更新
        </button>

        <button
          class="mfs-sort-btn"
          :class="{ 'is-active': sortMode === 'viewCount' }"
          @click="setSort('viewCount')"
        >
          最多访问
        </button>
      </div>
    </div>

    <!-- 搜索状态提示 -->
    <div class="mfs-status" v-if="loading">正在搜索……</div>
    <div class="mfs-status" v-else-if="error">出错了：{{ error }}</div>

    <!-- 无结果时：显示推荐内容 -->
    <div v-else-if="!results.length && searchedOnce" class="mfs-empty">
      <div class="mfs-empty-title">没有搜索结果</div>
      <div class="mfs-empty-sub">要不要看看最近更新、热门或随机条目？</div>

      <div class="mfs-empty-panels">
        <!-- 最近更新（来自 git 时间） -->
        <section class="mfs-empty-block">
          <h3 class="mfs-empty-block-title">📅 最近更新</h3>
          <RecentPages :limit="5" />
        </section>

        <!-- 最近热门（Twikoo 真实访问量 pv） -->
        <section class="mfs-empty-block">
          <h3 class="mfs-empty-block-title">🔥 最近热门</h3>
          <HotPages :limit="5" :days="30" />
        </section>

        <!-- 随机条目（从 recommended-pages.json 随机抽样） -->
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

    <!-- 有结果时：折叠 / 展开结果列表 -->
    <ul class="mfs-results" v-else-if="results.length">
      <li
        v-for="hit in results"
        :key="hitKey(hit)"
        class="mfs-result-item"
        :class="{ 'is-open': isExpanded(hit) }"
      >
        <!-- 整卡片仍然可以点击跳转 -->
        <a :href="hit.url" class="mfs-result-link">
          <!-- 头部：标题 + 展开按钮 -->
          <div class="mfs-result-head">
            <div class="mfs-result-title">
              <!-- 根据 URL 推断类型，在标题前加上 [人物]/[势力] 这样的标记 -->
              <span v-if="inferType(hit)" class="mfs-tag">
                [{{ typeLabelMap[inferType(hit)!] || inferType(hit) }}]
              </span>
              {{ hit.title || hit.hierarchy_lvl1 || hit.hierarchy_lvl0 || "(无标题)" }}
            </div>

            <button
            type="button"
            class="mfs-toggle-btn"
            @click.stop.prevent="toggleHit(hit)"
            >
            {{ isExpanded(hit) ? "收起详情" : "展开详情" }}
          </button>
        </div>

          <!-- 折叠态：只显示一行摘要 -->
          <div
            v-if="!isExpanded(hit)"
            class="mfs-result-summary mfs-result-summary--collapsed"
          >
            {{ shortSummary(hit.summary || hit.text || "（暂无摘要）") }}
          </div>

          <!-- 展开态：详细内容（这块你之后可以随便改布局） -->
          <div v-else class="mfs-result-detail">
            <!-- 摘要全文 -->
            <div class="mfs-result-summary-full">
              {{ hit.summary || hit.text || "（暂无摘要）" }}
            </div>

            <!-- meta 信息：类型 / 区域 / 标签 / 更新时间 / 访问量 -->
            <div class="mfs-result-meta-line">
              <span v-if="inferType(hit)">
                类型：{{ typeLabelMap[inferType(hit)!] || inferType(hit) }}
              </span>
              <span v-if="hit.region">
                · 区域：{{ hit.region }}
              </span>
              <span v-if="hit.tags?.length">
                · 标签：{{ hit.tags.join(" / ") }}
              </span>
              <span v-if="hit.updatedAt">
                · 更新：{{ new Date(hit.updatedAt).toLocaleDateString() }}
              </span>
              <span v-if="hit.viewCount">
                · 访问：{{ hit.viewCount }} 次
              </span>
            </div>

            <!-- 原始 URL -->
            <div class="mfs-result-url">
              {{ hit.url }}
            </div>
          </div>
        </a >
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import HotPages from "../../plugins/recommended-articles/HotPages.vue";
import RecentPages from "../../plugins/recommended-articles/RecentPages.vue";
import { useWikiSearch } from "./useWikiSearch.js";
// @ts-ignore
import { nosearchPaths } from "@temp/nosearch/nosearchPaths.js";

const {
  // 状态（来自 useWikiSearch）
  keyword,
  activeType,
  typeOptions,
  typeLabelMap,
  availableTags,
  selectedTags,
  visibleTags,
  hasAnyFilter,
  results,
  loading,
  error,
  searchedOnce,
  sortMode,
  // 方法
  handleUpdateKeyword,
  toggleTag,
  resetFilters,
  setType,
  setSort,
  search,
  inferType,
} = useWikiSearch();

/* ========= 纯随机推荐（从 recommended-pages.json 随机抽样） ========= */

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

    // 过滤掉 nosearch 的页面
    const pool = all.filter((p) => !isExcluded(p.path));

    // 简单洗牌，随机选最多 5 条
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

/* ========= 折叠 / 展开：每条搜索结果独立状态 ========= */

/** 哪些结果是“已展开”的：保存它们的 key */
const expandedKeys = ref<string[]>([]);

/** 统一计算一条结果的唯一 key */
function hitKey(hit: any): string {
  return hit.id || hit.objectID || hit.url || JSON.stringify(hit);
}

/** 当前这条是否展开 */
function isExpanded(hit: any): boolean {
  const key = hitKey(hit);
  return expandedKeys.value.includes(key);
}

/** 切换展开 / 收起 */
function toggleHit(hit: any) {
  const key = hitKey(hit);
  const list = expandedKeys.value;
  const idx = list.indexOf(key);
  expandedKeys.value =
    idx === -1 ? [...list, key] : list.filter((k) => k !== key);
}

/** 折叠态显示用的短摘要：默认 60 字，可以按需调 */
function shortSummary(text: string, maxLen = 60): string {
  const t = (text || "").trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen) + "…";
}
</script>

<style scoped>
.meili-filter-search {
  max-width: 860px;
  margin: 1.5rem auto;
  padding: 1.5rem;
  border-radius: 1rem;
  background: var(--vp-bg, #fff);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
}

/* 让搜索栏 + 分类 + 标签固定在顶部 */
.mfs-header-sticky {
  position: sticky;
  top: var(--nav-height, 4rem); /* 保持贴在导航栏下方 */
  z-index: 20;
  background: var(--vp-bg, #fff);
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
}

/* 🔥 让搜索栏“往上长出一块空白”盖住上方露出的内容 */
.mfs-header-sticky::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: -1rem;            /* 想往上延伸多少就调这里，例如 -1.2rem */
  height: 1rem;          /* 空白条高度，与上面的 top 配套 */
  background: var(--vp-bg, #fff);  /* 与页面背景色一致 */
  pointer-events: none;  /* 避免遮挡鼠标事件 */
}

/* 排序区域 */
.mfs-sort {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0.25rem 0 0.5rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-2, #6b7280);
}

.mfs-sort-label {
  font-weight: 600;
}

/* 排序按钮 */
.mfs-sort-btn {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-border, #d0d7de);
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
  white-space: nowrap;
}

.mfs-sort-btn.is-active {
  background: var(--vp-c-accent, #6366f1);
  color: #fff;
  border-color: transparent;
}

/* 搜索状态提示文字 */
.mfs-status {
  font-size: 0.9rem;
  color: var(--vp-c-text-2, #6b7280);
  margin: 0.5rem 0;
}

/* 无结果推荐区域 */
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

/* 搜索结果整体列表 */
.mfs-results {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* 每条结果之间的间距 */
.mfs-result-item + .mfs-result-item {
  margin-top: 0.75rem;
}

/* 单条结果外层链接块 */
.mfs-result-link {
  display: block;
  padding: 0.7rem 0.9rem;
  border-radius: 0.75rem;
  border: 1px solid var(--vp-c-border, #e5e7eb);
  text-decoration: none;
  color: inherit;
}

/* hover 时轻微高亮 */
.mfs-result-link:hover {
  border-color: var(--vp-c-accent, #6366f1);
  background: rgba(99, 102, 241, 0.02);
}

/* 结果卡片头部：标题 + 展开按钮一行 */
.mfs-result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

/* 结果标题行本体 */
.mfs-result-title {
  font-weight: 600;
}

/* 展开按钮 */
.mfs-toggle-btn {
  border: 1px solid var(--vp-c-border, #d0d7de);
  background: #f9fafb;
  border-radius: 999px;
  font-size: 0.8rem;
  padding: 0.2rem 0.7rem;
  cursor: pointer;
  white-space: nowrap;
}

.mfs-toggle-btn:hover {
  background: #e5e7eb;
}

/* 标题前面的类型标签 [人物]/[概念] */
.mfs-tag {
  display: inline-block;
  margin-right: 0.35rem;
  padding: 0 0.35rem;
  border-radius: 0.5rem;
  background: rgba(99, 102, 241, 0.12);
  color: #4f46e5;
  font-size: 0.75rem;
}

/* 折叠态摘要：单行 + 省略号 */
.mfs-result-summary--collapsed {
  max-height: 1.4em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 展开态整体块 */
.mfs-result-detail {
  margin-top: 0.25rem;
}

/* 展开态 meta 信息一行 */
.mfs-result-meta-line {
  margin-top: 0.2rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-2, #9ca3af);
}

/* 展开态全文摘要 */
.mfs-result-summary-full {
  font-size: 0.85rem;
  color: var(--vp-c-text-1, #4b5563);
  margin-top: 0.2rem;
}

/* 公共 URL 行样式 */
.mfs-result-url {
  font-size: 0.75rem;
  color: var(--vp-c-text-3, #9ca3af);
  margin-top: 0.25rem;
}
</style>