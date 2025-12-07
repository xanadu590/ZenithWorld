<!-- docs/.vuepress/components/search/MeiliFilterControls.vue -->
<template>
  <div>
    <!-- 顶部搜索条：输入框 + 搜索 -->
    <div class="mfs-bar">
      <!-- 左侧：搜索输入框（含自动补全 + 搜索历史） -->
      <SearchInputBox
        ref="inputRef"
        :keyword="keyword"
        :selected-tags="selectedTags"
        :has-any-filter="hasAnyFilter"
        @update:keyword="(val) => $emit('update:keyword', val)"
        @search="$emit('search')"
        @toggle-tag="(tag) => $emit('toggle-tag', tag)"
        @reset-filters="$emit('reset-filters')"
      />

      <!-- 右侧主搜索按钮 -->
      <button class="mfs-btn" @click="handleClickSearch">
        搜索
      </button>
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
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import SearchInputBox from "./SearchInputBox.vue";

type TypeOption = { value: string | null; label: string };

const props = defineProps<{
  keyword: string;
  selectedTags: string[];
  typeOptions: TypeOption[];
  activeType: string | null;
  hasAnyFilter: boolean;
}>();

const emit = defineEmits<{
  (e: "update:keyword", value: string): void;
  (e: "search"): void;
  (e: "toggle-tag", tag: string): void;
  (e: "set-type", value: string | null): void;
  (e: "reset-filters"): void;
}>();

/**
 * 通过 ref 拿到 SearchInputBox 实例，
 * 调用它暴露出来的 saveCurrentKeywordToHistory()
 */
const inputRef = ref<InstanceType<typeof SearchInputBox> | null>(null);

function handleClickSearch() {
  // 先把当前关键字写入历史
  inputRef.value?.saveCurrentKeywordToHistory?.();
  // 再真正触发搜索
  emit("search");
}
</script>

<style scoped>
/* 顶部一行：输入框 + 搜索按钮 */
.mfs-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
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
</style>
