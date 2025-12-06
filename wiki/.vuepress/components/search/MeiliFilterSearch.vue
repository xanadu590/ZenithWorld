<template>
  <div class="meili-filter-search">
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

    <!-- 搜索状态提示 -->
    <div class="mfs-status" v-if="loading">正在搜索……</div>
    <div class="mfs-status" v-else-if="error">出错了：{{ error }}</div>
    <div class="mfs-status" v-else-if="!results.length && searchedOnce">
      没有搜索结果
    </div>

    <!-- 搜索结果列表 -->
    <ul class="mfs-results" v-if="results.length">
      <li
        v-for="hit in results"
        :key="hit.id || hit.objectID || hit.url"
        class="mfs-result-item"
      >
        <a :href="hit.url" class="mfs-result-link">
          <div class="mfs-result-title">
            <!-- 根据 URL 推断类型，在标题前加上 [人物]/[势力] 这样的标记 -->
            <span v-if="inferType(hit)" class="mfs-tag">
              [{{ typeLabelMap[inferType(hit)!] || inferType(hit) }}]
            </span>
            {{ hit.title || hit.hierarchy_lvl1 || hit.hierarchy_lvl0 || "(无标题)" }}
          </div>

          <!-- 结果的补充信息：区域 + 标签 -->
          <div class="mfs-result-meta">
            <span v-if="hit.region">区域：{{ hit.region }}</span>
            <span v-if="hit.tags?.length">
              · 标签：{{ hit.tags.join(" / ") }}
            </span>
          </div>

          <!-- 结果摘要：由 random-index / Meili 字段拼出来 -->
          <div class="mfs-result-summary">
            {{ hit.summary || hit.text || "（暂无摘要）" }}
          </div>

          <!-- 显示原始 URL，方便确认跳转位置 -->
          <div class="mfs-result-url">{{ hit.url }}</div>
        </a >
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useWikiSearch } from "./useWikiSearch.js";

const {
  // 状态
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

/* 结果标题行 */
.mfs-result-title {
  font-weight: 600;
  margin-bottom: 0.2rem;
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

/* 区域 + 标签等元信息 */
.mfs-result-meta {
  font-size: 0.8rem;
  color: var(--vp-c-text-2, #9ca3af);
  margin-bottom: 0.25rem;
}

/* 摘要文本 */
.mfs-result-summary {
  font-size: 0.85rem;
  color: var(--vp-c-text-1, #4b5563);
  margin-bottom: 0.3rem;
}

/* URL 展示行 */
.mfs-result-url {
  font-size: 0.75rem;
  color: var(--vp-c-text-3, #9ca3af);
}
</style>