<!-- docs/.vuepress/components/search/MeiliFilterControls.vue -->
<template>
  <div>
    <!-- 顶部搜索条：输入框 + 搜索 -->
    <div class="mfs-bar">
      <!-- 左侧输入区域（SearchInputBox） -->
      <SearchInputBox
        :keyword="keyword"
        :selected-tags="selectedTags"
        :has-any-filter="hasAnyFilter"
        @update:keyword="$emit('update:keyword', $event)"
        @search="$emit('search')"
        @toggle-tag="$emit('toggle-tag', $event)"
        @reset-filters="$emit('reset-filters')"
      />

      <!-- 右侧主搜索按钮 -->
      <button class="mfs-btn" @click="$emit('search')">搜索</button>
    </div>

    <!-- 分类按钮区域：全部 / 人物 / 概念 / 势力 / 地理 / 历史 -->
    <div class="mfs-filters">
      <span class="mfs-filters-label">分类：</span>
      <button
        v-for="opt in typeOptions"
        :key="String(opt.value)"
        class="mfs-filter-btn"
        :class="{ 'is-active': activeType === opt.value }"
        @click="$emit('set-type', opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- 标签分页区域 -->
    <TagPager
      :available-tags="availableTags"
      :visible-tags="visibleTags"
      :selected-tags="selectedTags"
      @toggle-tag="$emit('toggle-tag', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import SearchInputBox from "./SearchInputBox.vue";
// @ts-ignore
import TagPager from "./TagPager.vue";

const props = defineProps<{
  keyword: string;
  selectedTags: string[];
  typeOptions: { value: string | null; label: string }[];
  activeType: string | null;
  availableTags: string[];
  visibleTags: string[];
  hasAnyFilter: boolean;
}>();

const emit = defineEmits<{
  (e: "update:keyword", value: string): void;
  (e: "search"): void;
  (e: "toggle-tag", tag: string): void;
  (e: "set-type", value: string | null): void;
  (e: "reset-filters"): void;
}>();
</script>

<style scoped>
/* 顶部一行：输入框 + 搜索按钮 */
.mfs-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

/* 主搜索按钮 */
.mfs-btn {
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  white-space: nowrap;
  background: var(--vp-c-accent, #6366f1);
  color: #fff;
}

/* 分类按钮区域 */
.mfs-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.mfs-filters-label {
  font-weight: 600;
}

.mfs-filter-btn {
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-border, #d0d7de);
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
}

.mfs-filter-btn.is-active {
  background: var(--vp-c-accent, #6366f1);
  color: #fff;
  border-color: transparent;
}
</style>