<template>
  <div>
    <!-- 顶部搜索条：左边输入胶囊，右边搜索按钮 -->
    <div class="mfs-bar">
      <!-- 输入区域外层：作为下拉框和重置按钮的定位父元素 -->
      <div class="mfs-input-area">
        <!-- 真正的“输入胶囊”：只负责显示标签 + 输入框 -->
        <div class="mfs-input-wrapper">
          <!-- 已选标签 -->
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

          <!-- 关键字输入框 -->
          <input
            :value="keyword"
            class="mfs-input"
            type="search"
            placeholder="搜索角色 / 概念 / 势力 / 地理 / 历史……"
            @input="onInput(($event.target as HTMLInputElement).value)"
            @keyup.enter="onEnter"
            @focus="onFocus"
            @blur="onBlur"
          />
        </div>

        <!-- 自动补全 + 搜索历史下拉框 -->
        <ul
          v-if="showSuggestBox && (suggestions.length || searchHistory.length)"
          class="mfs-suggest-box"
        >
          <!-- 官方联想词 -->
          <li
            v-for="s in suggestions"
            :key="'sg-' + s"
            class="mfs-suggest-item"
            @mousedown.prevent="applySuggestion(s)"
          >
            🔍 {{ s }}
          </li>
          <!-- 搜索历史 -->
          <li
            v-for="h in searchHistory"
            :key="'his-' + h"
            class="mfs-history-item"
            @mousedown.prevent="applySuggestion(h)"
          >
            🕘 {{ h }}
          </li>

          <!-- 清空历史 -->
          <li
            v-if="searchHistory.length"
            class="mfs-history-clear"
            @mousedown.prevent="clearHistory"
          >
            清除所有历史记录
          </li>
        </ul>

        <!-- 🔁 放在搜索框内部右侧的小圆形重置按钮 -->
        <button
          v-if="hasAnyFilter"
          class="mfs-reset-icon-btn"
          @click="$emit('reset-filters')"
          title="清空筛选条件"
        >
          ⟳
        </button>
      </div>

      <!-- 右侧主搜索按钮 -->
      <button class="mfs-btn" @click="onClickSearch">搜索</button>
    </div>

    <!-- 分类按钮区域 -->
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

    <!-- 标签筛选区域 -->
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
import { ref, onMounted } from "vue";

/** ==== props ==== */
const props = defineProps<{
  keyword: string;
  selectedTags: string[];
  typeOptions: { value: string | null; label: string }[];
  activeType: string | null;
  availableTags: string[];
  visibleTags: string[];
  hasAnyFilter: boolean;
}>();

/** ==== emits ==== */
const emit = defineEmits<{
  (e: "update:keyword", value: string): void;
  (e: "search"): void;
  (e: "toggle-tag", tag: string): void;
  (e: "set-type", value: string | null): void;
  (e: "reset-filters"): void;
}>();

/* =========================================================
 * MeiliSearch 连接信息
 * ======================================================= */

const SEARCH_HOST = "https://search.zenithworld.top";
const SEARCH_INDEX = "wiki";
const SEARCH_API_KEY =
  "e12946c7f8693e562f078360da358419a57197338607669795398c2ee3fddf59";

/* =========================================================
 * 自动补全 + 搜索历史
 * ======================================================= */

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

/** 保存历史（去重 + 最多 10 条） */
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
    /* 忽略 */
  }
}

/** 清空所有历史记录 */
function clearHistory() {
  searchHistory.value = [];
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* 忽略 */
  }
}

/** 调用 MeiliSearch 做自动补全 */
async function fetchSuggestions(q: string) {
  const kw = q.trim();
  if (!kw) {
    suggestions.value = [];
    return;
  }

  try {
    const res = await fetch(
      `${SEARCH_HOST}/indexes/${SEARCH_INDEX}/search`,
      {
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
      }
    );

    if (!res.ok) {
      suggestions.value = [];
      return;
    }

    const data = await res.json();
    const hits = Array.isArray(data.hits) ? data.hits : [];

    suggestions.value = hits
      .map(
        (h: any) =>
          h.title || h.hierarchy_lvl1 || h.hierarchy_lvl0 || ""
      )
      .filter((s: string) => s && typeof s === "string")
      .filter((s: string, idx: number, arr: string[]) => arr.indexOf(s) === idx)
      .slice(0, 8);
  } catch {
    suggestions.value = [];
  }
}

/** 输入变化 */
function onInput(val: string) {
  emit("update:keyword", val);
  fetchSuggestions(val);
  showSuggestBox.value = true;
}

/** focus 时展开下拉 */
function onFocus() {
  showSuggestBox.value = true;
  if (props.keyword?.trim()) {
    fetchSuggestions(props.keyword);
  }
}

/** blur 时稍微延迟关闭，让点击有时间触发 */
function onBlur() {
  setTimeout(() => {
    showSuggestBox.value = false;
  }, 150);
}

/** 点击“搜索”按钮或回车 */
function onClickSearch() {
  if (props.keyword) saveHistory(props.keyword);
  emit("search");
  showSuggestBox.value = false;
}

function onEnter() {
  onClickSearch();
}

/** 选择建议词 / 历史词 */
function applySuggestion(word: string) {
  emit("update:keyword", word);
  saveHistory(word);
  emit("search");
  showSuggestBox.value = false;
}
</script>

<style scoped>
/* 顶部一行：输入框 + 搜索按钮 */
.mfs-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

/* 输入区域：作为 dropdown 和 重置按钮 的定位父元素 */
.mfs-input-area {
  position: relative;
  flex: 1;
}

/* 胶囊输入容器 */
.mfs-input-wrapper {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  padding-right: 2.4rem; /* ⭐ 右侧预留空间给重置按钮 */
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

/* 搜索按钮 */
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

/* 下拉框外观 */
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

/* 清空历史 */
.mfs-history-clear {
  padding: 0.45rem 0.7rem;
  font-size: 0.8rem;
  color: #ef4444;
  border-top: 1px solid #f3f4f6;
  cursor: pointer;
}

.mfs-history-clear:hover {
  background: #fef2f2;
}

/* 搜索框内部的“重置图标”按钮（无边框无背景） */
.mfs-reset-icon-btn {
  position: absolute;
  right: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  
  width: 20px;
  height: 20px;

  border: none;
  background: none;
  padding: 0;

  cursor: pointer;
  font-size: 16px;
  color: #9ca3af;

  line-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;

  /* 平滑动画（旋转 + 缩放） */
  transition: transform 0.25s ease, color 0.2s ease;
}

/* 悬停：稍稍放大并旋转 45 度 */
.mfs-reset-icon-btn:hover {
  transform: translateY(-50%) scale(1.25) rotate(45deg);
  color: #4b5563;
}

/* 按下时稍微缩小，保持手感 */
.mfs-reset-icon-btn:active {
  transform: translateY(-50%) scale(0.9);
}

/* 分类区域 */
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

/* 标签区域 */
.mfs-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.4rem;
  margin-bottom: 0.75rem;

  max-height: calc(1.8rem * 3);
  overflow-y: auto;
  padding-right: 0.3rem;
}

.mfs-tags-label {
  font-weight: 600;
  margin-right: 0.25rem;
}

.mfs-tag-btn,
.tag-card {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;

  font-size: 0.9rem;
  --tag-dot-size: 0.33em;
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

/* 已选标签 & 激活标签高亮 */
.mfs-tag-btn.is-active .tag-box,
.tag-card .tag-box {
  font-size: 1.1em;
  background: #6366f1;
  color: #ffffff;
  border-color: #6366f1;
}

.mfs-tag-btn.is-active .tag-circle,
.tag-card .tag-circle {
  background: #ffffff;
  border-color: #ffffff;
}
</style>