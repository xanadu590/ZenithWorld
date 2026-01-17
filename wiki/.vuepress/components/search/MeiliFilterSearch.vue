<!-- docs/.vuepress/components/search/MeiliFilterSearch.vue -->
<template>
  <div class="meili-filter-search">
    <!-- ✅ 顶部固定区域：搜索输入 + 分类 + 排序 + 标签 -->
    <div class="mfs-header-sticky">
      <!-- 搜索输入 + 分类 -->
      <MeiliFilterControls
        :keyword="keyword"
        :selected-tags="selectedTags"
        :type-options="typeOptions"
        :active-type="activeType"
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

      <!-- ✅ 标签行：始终占位，避免首屏“加载完才出现” -->
      <div class="mfs-tags-wrap" aria-label="标签筛选">
        <!-- 关键：TagPager 永远渲染 -->
        <TagPager
          :available-tags="availableTags"
          :visible-tags="visibleTags"
          :selected-tags="selectedTags"
          @toggle-tag="toggleTag"
        />

        <!-- ✅ 首屏占位：当 TagPager 还没内容时显示 -->
        <!-- 说明：如果 TagPager 内部有 v-if 导致它不渲染，也没关系，占位会顶上来 -->
        <div
          v-if="showTagPlaceholder"
          class="mfs-tags-placeholder"
        >
          <span v-if="loading">标签加载中…</span>
          <span v-else>暂无可用标签</span>
        </div>
      </div>
    </div>

    <!-- 搜索状态提示 -->
    <div class="mfs-status" v-if="loading">正在搜索……</div>
    <div class="mfs-status" v-else-if="error">出错了：{{ error }}</div>

    <!-- 无结果时：显示推荐内容 -->
    <SearchEmptyState v-else-if="!results.length && searchedOnce" />

    <!-- 有结果时：折叠 / 展开结果列表 -->
    <SearchResultsList
      v-else
      :results="results"
      :type-label-map="typeLabelMap"
      :infer-type="inferType"
      :keyword="keyword"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useWikiSearch } from "./useWikiSearch.js";
import MeiliFilterControls from "./MeiliFilterControls.vue";
import TagPager from "./TagPager.vue";
import SearchEmptyState from "./SearchEmptyState.vue";
import SearchResultsList from "./SearchResultsList.vue";

const {
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
  handleUpdateKeyword,
  toggleTag,
  resetFilters,
  setType,
  setSort,
  search,
  inferType,
} = useWikiSearch();

/**
 * ✅ 什么时候显示“占位标签行”？
 * - 首屏 / 未加载到可用标签时显示
 * - 一旦 visibleTags/availableTags 有内容，就隐藏占位
 */
const showTagPlaceholder = computed(() => {
  const hasTags =
    (visibleTags?.value?.length ?? 0) > 0 ||
    (availableTags?.value?.length ?? 0) > 0;

  // 如果已经有标签了，就不显示占位
  if (hasTags) return false;

  // 没标签时：首屏给一个占位行，避免“加载完才出现”
  return true;
});
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

/* 让搜索栏 + 分类 + 排序 + 标签 固定在顶部 */
.mfs-header-sticky {
  position: sticky;
  top: var(--nav-height, 4rem); /* 保持贴在导航栏下方 */
  z-index: 20;
  background: var(--vp-bg, #fff);
  padding-bottom: 0.25rem;
  margin-bottom: 0.2rem;
}

/* 🔥 让搜索栏“往上长出一块空白”盖住上方露出的内容 */
.mfs-header-sticky::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: -1rem; /* 想往上延伸多少就调这里 */
  height: 1rem;
  background: var(--vp-bg, #fff);
  pointer-events: none;
}

/* 排序区域 */
.mfs-sort {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0.25rem 0 0.5rem;
  font-size: 0.9rem;
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

/* ✅ 标签包裹：用于“始终占位” */
.mfs-tags-wrap {
  position: relative;
  margin-top: 0.25rem;
}

/**
 * ✅ 占位行：当 TagPager 没渲染任何可见标签时显示
 * 重点：给它一个稳定高度，避免 sticky 高度抖动
 */
.mfs-tags-placeholder {
  display: flex;
  align-items: center;
  min-height: 32px; /* 你 Tag 的高度差不多就行 */
  padding: 0.15rem 0.2rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-2, #6b7280);
}

/* 如果你希望占位行更“像标签”，可以加一点视觉 */
.mfs-tags-placeholder span {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  border: 1px dashed var(--vp-c-border, #d0d7de);
  background: var(--vp-bg, #fff);
}
</style>
