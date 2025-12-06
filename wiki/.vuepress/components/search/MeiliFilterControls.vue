<template>
  <div>
    <!-- 顶部搜索条 -->
    <div class="mfs-bar">
      <div class="mfs-input-wrapper" @click="showSuggestions = true">
        <!-- 已选标签 -->
        <div
          v-for="tag in selectedTags"
          :key="tag"
          class="tag-card"
          @click.stop="$emit('toggle-tag', tag)"
        >
          <span class="tag-box">
            {{ tag }}
            <span class="tag-circle"></span>
          </span>
        </div>

        <!-- 输入框 -->
        <input
          :value="keyword"
          class="mfs-input"
          type="search"
          placeholder="搜索角色 / 概念 / 势力 / 地理 / 历史……"
          @input="onInput"
          @keyup.enter="$emit('search')"
          @focus="showSuggestions = true"
        />
      </div>

      <!-- 重置按钮 -->
      <button
        v-if="hasAnyFilter"
        class="mfs-reset-btn"
        @click="$emit('reset-filters')"
      >
        重置
      </button>

      <!-- 搜索按钮 -->
      <button class="mfs-btn" @click="$emit('search')">搜索</button>
    </div>

    <!-- 自动补全建议列表 -->
    <ul
      v-if="showSuggestions && suggestions.length"
      class="mfs-autocomplete"
    >
      <li
        v-for="s in suggestions"
        :key="s"
        class="mfs-autocomplete-item"
        @click="selectSuggestion(s)"
      >
        {{ s }}
      </li>
    </ul>

    <!-- 分类按钮 -->
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

    <!-- 标签选项 -->
    <div class="mfs-tags" v-if="availableTags.length">
      <span class="mfs-tags-label">标签：</span>

      <button
        v-for="tag in visibleTags"
        :key="tag"
        class="mfs-tag-btn"
        :class="{ 'is-active': selectedTags.includes(tag) }"
        @click="$emit('toggle-tag', tag)"
      >
        <span class="tag-box">
          {{ tag }}
          <span class="tag-circle"></span>
        </span>
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

// ---------------------
// props & emits（保持原样）
// ---------------------
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

// =====================================================
// 自动补全功能
// =====================================================

// 建议池（来自 availableTags + selectedTags + type labels）
const suggestions = ref<string[]>([]);
const showSuggestions = ref(false);

// 输入时触发（替代你原有的 $emit('update:keyword')）
function onInput(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  emit("update:keyword", value);
  updateSuggestions(value);
}

// 自动补全逻辑：本地模糊匹配（不会影响性能）
function updateSuggestions(kw: string) {
  if (!kw.trim()) {
    suggestions.value = [];
    return;
  }

  const lower = kw.toLowerCase();

  const pool = [
    ...props.availableTags,
    ...props.visibleTags,
    ...props.selectedTags,
  ];

  suggestions.value = pool
    .filter((t) => t.toLowerCase().includes(lower))
    .slice(0, 10);

  showSuggestions.value = true;
}

// 选择建议
function selectSuggestion(s: string) {
  emit("update:keyword", s);
  showSuggestions.value = false;
  emit("search");
}

// =====================================================
// ESC 全局重置（不需要点搜索框就能触发）
// =====================================================
function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    emit("reset-filters");
    showSuggestions.value = false;
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

/* 自动补全列表 */

.mfs-autocomplete {
  position: absolute;
  margin-top: 0.3rem;
  background: #ffffff;
  border: 1px solid var(--vp-c-border, #d1d5de);
  border-radius: 0.5rem;
  max-height: 14rem;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  width: calc(100% - 3rem);
  z-index: 20;
}

.mfs-autocomplete-item {
  padding: 0.45rem 0.8rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.mfs-autocomplete-item:hover {
  background: rgba(99, 102, 241, 0.12);
  color: #4f46e5;
}