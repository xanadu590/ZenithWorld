<!-- docs/.vuepress/components/search/SearchInputBox.vue -->
<template>
  <!-- 输入区域：承载输入胶囊 + 重置按钮 + 下拉建议 -->
  <div class="mfs-input-area">
    <!-- 多标签输入胶囊 -->
    <div class="mfs-input-wrapper">
      <!-- 已选标签：显示在输入框内部，点击即可取消选中 -->
      <div
        v-for="tag in selectedTags"
        :key="tag"
        class="tag-card"
        @click="$emit('toggle-tag', tag)"
      >
        <span class="tag-box">
          {{ tag }}
          <span class="tag-circle"></span>
        </span>
      </div>

      <!-- 关键字输入框（受控组件） -->
      <input
        :value="keyword"
        class="mfs-input"
        type="search"
        placeholder="搜索角色 / 概念 / 势力 / 地理 / 历史……"
        @input="onInput"
        @keyup.enter="onEnter"
        @focus="onFocus"
        @blur="onBlur"
      />

      <!-- 内嵌在输入框右侧的重置按钮（箭头咬尾） -->
      <button
        v-if="hasAnyFilter"
        type="button"
        class="mfs-reset-icon"
        title="清除所有条件"
        @mousedown.prevent
        @click="$emit('reset-filters')"
      >
        ⟳
      </button>
    </div>

    <!-- 自动补全 + 搜索历史下拉框 -->
    <ul
      v-if="showSuggestBox && (suggestions.length || searchHistory.length)"
      class="mfs-suggest-box"
    >
      <!-- 联想词 -->
      <li
        v-for="s in suggestions"
        :key="'sg-' + s"
        class="mfs-suggest-item"
        @mousedown.prevent="applySuggestion(s)"
      >
        🔍 {{ s }}
      </li>
      <!-- 历史记录 -->
      <li
        v-for="h in searchHistory"
        :key="'his-' + h"
        class="mfs-history-item"
        @mousedown.prevent="applySuggestion(h)"
      >
        🕘 {{ h }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

/** ==== props ==== */
const props = defineProps<{
  keyword: string;
  selectedTags: string[];
  hasAnyFilter: boolean;
}>();

/** ==== emits ==== */
const emit = defineEmits<{
  (e: "update:keyword", value: string): void;
  (e: "search"): void;
  (e: "toggle-tag", tag: string): void;
  (e: "reset-filters"): void;
}>();

/* ================== MeiliSearch 自动补全 ================== */

const SEARCH_HOST = "https://search.zenithworld.top";
const SEARCH_INDEX = "wiki";
const SEARCH_API_KEY =
  "e12946c7f8693e562f078360da358419a57197338607669795398c2ee3fddf59";

const suggestions = ref<string[]>([]);
const searchHistory = ref<string[]>([]);
const showSuggestBox = ref(false);

const HISTORY_KEY = "zw-meili-search-history";

onMounted(() => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    searchHistory.value = raw ? JSON.parse(raw) : [];
  } catch {
    searchHistory.value = [];
  }
});

function saveHistory(word: string) {
  const kw = word.trim();
  if (!kw) return;
  const next = [kw, ...searchHistory.value.filter((h) => h !== kw)].slice(
    0,
    10
  );
  searchHistory.value = next;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

async function fetchSuggestions(q: string) {
  const kw = q.trim();
  if (!kw) {
    suggestions.value = [];
    return;
  }

  try {
    const res = await fetch(`${SEARCH_HOST}/indexes/${SEARCH_INDEX}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SEARCH_API_KEY}`,
      },
      body: JSON.stringify({
        q: kw,
        limit: 8,
        attributesToRetrieve: ["title", "hierarchy_lvl1", "hierarchy_lvl0"],
      }),
    });

    if (!res.ok) {
      suggestions.value = [];
      return;
    }

    const data = await res.json();
    const hits = Array.isArray(data.hits) ? data.hits : [];

    suggestions.value = hits
      .map(
        (h: any) => h.title || h.hierarchy_lvl1 || h.hierarchy_lvl0 || ""
      )
      .filter((s: string) => s && typeof s === "string")
      .filter((s: string, idx: number, arr: string[]) => arr.indexOf(s) === idx)
      .slice(0, 8);
  } catch {
    suggestions.value = [];
  }
}

function onInput(e: Event) {
  const target = e.target as HTMLInputElement | null;
  const val = target?.value ?? "";
  emit("update:keyword", val);
  fetchSuggestions(val);
  showSuggestBox.value = true;
}

function onFocus() {
  showSuggestBox.value = true;
  if (props.keyword?.trim()) {
    fetchSuggestions(props.keyword);
  }
}

function onBlur() {
  setTimeout(() => {
    showSuggestBox.value = false;
  }, 150);
}

function onEnter() {
  if (props.keyword) saveHistory(props.keyword);
  emit("search");
  showSuggestBox.value = false;
}

function applySuggestion(word: string) {
  emit("update:keyword", word);
  saveHistory(word);
  emit("search");
  showSuggestBox.value = false;
}

/**
 * 给父组件用的：把当前 keyword 写入搜索历史。
 * （用于“右侧搜索按钮”那条路径）
 */
function saveCurrentKeywordToHistory() {
  if (props.keyword) {
    saveHistory(props.keyword);
  }
}

defineExpose({
  saveCurrentKeywordToHistory,
});
</script>

<style scoped>
/* 输入区域：承载输入胶囊 + 重置按钮 + 下拉建议 */
.mfs-input-area {
  position: relative;
  flex: 1;
}

/* 输入胶囊：标签 + 输入框 */
.mfs-input-wrapper {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  padding-right: 2rem; /* 给右侧重置按钮留位置 */
  border-radius: 999px;
  border: 1px solid var(--vp-c-border, #d0d7de);
  background: #fff;
  max-height: 4.5rem;
  overflow-y: auto;
}

/* 文本输入本体 */
.mfs-input {
  flex: 1;
  min-width: 6rem;
  padding: 0.25rem 0.2rem;
  border: none;
  outline: none;
  font-size: 0.95rem;
}

/* 内嵌重置图标：嵌在输入框右侧 */
.mfs-reset-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.95rem;
  line-height: 1;
  padding: 0;
  color: #9ca3af;
  transition: transform 0.18s ease, color 0.18s ease;
}

.mfs-reset-icon:hover {
  color: #4b5563;
  transform: translateY(-50%) scale(1.15) rotate(45deg);
}

/* 自动补全下拉框 */
.mfs-suggest-box {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  margin-top: 0.25rem;
  z-index: 30;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  max-height: 260px;
  overflow-y: auto;
  list-style: none;
  padding: 0;
}

.mfs-suggest-item,
.mfs-history-item {
  padding: 0.45rem 0.7rem;
  cursor: pointer;
  font-size: 0.85rem;
}

.mfs-history-item {
  font-size: 0.8rem;
  color: #6b7280;
  border-top: 1px solid #f3f4f6;
}

.mfs-suggest-item:hover,
.mfs-history-item:hover {
  background: #f3f4f6;
}

/* 标签按钮 + 已选标签卡片 共用样式 */
.tag-card {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
  --tag-dot-size: 0.33em;
  flex-shrink: 0;
}

.tag-box {
  position: relative;
  padding: 0.2em 0.9em 0.2em 0.4em;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1em;
  color: #374151;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
}

.tag-circle {
  width: var(--tag-dot-size);
  height: var(--tag-dot-size);
  background: #ffffff;
  border: 0.5px solid #9ca3af;
  border-radius: 50%;
  position: absolute;
  right: 0.2em;
  top: 0.25em;
}

/* 高亮：输入框上方的选中卡片 */
.tag-card .tag-box {
  font-size: 1.1em;
  background: #6366f1;
  color: #ffffff;
  border-color: #6366f1;
}

.tag-card .tag-circle {
  background: #ffffff;
  border-color: #ffffff;
}
</style>
