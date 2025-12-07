<template>
  <div class="meili-filter-search">
    <!-- ✅ 顶部固定区域：搜索输入 + 分类 + 标签 + 排序 -->
    <div class="mfs-header-sticky">
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
    <SearchEmptyState
      v-else-if="!results.length && searchedOnce"
    />

    <!-- 有结果时：折叠 / 展开结果列表 -->
    <SearchResultsList
      v-else
      :results="results"
      :type-label-map="typeLabelMap"
      :infer-type="inferType"
    />
  </div>
</template>

<script setup lang="ts">
import MeiliFilterControls from "./MeiliFilterControls.vue";
import SearchEmptyState from "./SearchEmptyState.vue";
import SearchResultsList from "./SearchResultsList.vue";
import { useWikiSearch } from "./useWikiSearch.js";

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
  top: -1rem;            /* 想往上延伸多少就调这里 */
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
</style>