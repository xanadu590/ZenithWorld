<template>
  <div>
    <!-- 顶部搜索条：输入框 + 搜索 -->
    <div class="mfs-bar">
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
            @input="onInput(($event.target as HTMLInputElement).value)"
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

      <!-- 右侧主搜索按钮 -->
      <button class="mfs-btn" @click="onClickSearch">搜索</button>
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

    <!-- 标签区域：一行 + 左右翻页箭头 + 页码显示 -->
    <div class="mfs-tags" v-if="availableTags.length">
      <span class="mfs-tags-label">标签：</span>

      <!-- 左侧上一页箭头 -->
      <button
        class="mfs-tags-nav"
        :disabled="!hasPrevPage"
        @click="prevPage"
        title="上一组标签"
      >
        ▲
      </button>

      <!-- 中间这一页的标签（一行） -->
      <div class="mfs-tags-row" ref="tagsRowRef">
        <button
          v-for="tag in currentPageTags"
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

      <!-- 页码显示：第 x / y 页 -->
      <span class="mfs-tags-pageinfo">
         {{ currentPageNumber }} / {{ totalPages }} 
      </span>

      <!-- 右侧下一页箭头 -->
      <button
        class="mfs-tags-nav"
        :disabled="!hasNextPage"
        @click="nextPage"
        title="下一组标签"
      >
        ▼
      </button>
    </div>

    <!-- 隐藏的测量容器：用来计算分页（不显示在页面上） -->
    <div ref="measureRowRef" class="mfs-tags-measure">
      <button
        v-for="tag in visibleTags"
        :key="tag"
        class="mfs-tag-measure"
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
import {
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  watch,
  nextTick,
} from "vue";

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

function onInput(val: string) {
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

function onClickSearch() {
  if (props.keyword) saveHistory(props.keyword);
  emit("search");
  showSuggestBox.value = false;
}

function onEnter() {
  onClickSearch();
}

function applySuggestion(word: string) {
  emit("update:keyword", word);
  saveHistory(word);
  emit("search");
  showSuggestBox.value = false;
}

/* ================== 标签完整分页逻辑 ================== */

/** 实际显示标签的一行容器 */
const tagsRowRef = ref<HTMLElement | null>(null);
/** 隐藏的测量容器：里面渲染所有 visibleTags，用来计算宽度 */
const measureRowRef = ref<HTMLElement | null>(null);

/** 分好页的标签数组，例如 [ ['A','B'], ['C','D','E'], ... ] */
const pages = ref<string[][]>([]);
/** 当前页索引 */
const pageIndex = ref(0);

/** 当前这一页的标签 */
const currentPageTags = computed(() => {
  return pages.value[pageIndex.value] || [];
});

/** 页数 / 当前页（用于显示“第 x / y 页”） */
const totalPages = computed(() => (pages.value.length ? pages.value.length : 1));
const currentPageNumber = computed(() =>
  pages.value.length ? pageIndex.value + 1 : 1
);

/** 是否有上一页 / 下一页 */
const hasPrevPage = computed(() => pageIndex.value > 0);
const hasNextPage = computed(
  () => pageIndex.value < pages.value.length - 1
);

function prevPage() {
  if (hasPrevPage.value) pageIndex.value -= 1;
}

function nextPage() {
  if (hasNextPage.value) pageIndex.value += 1;
}

/**
 * 重新根据容器宽度 + 每个标签的宽度来划分页：
 * - 不截断标签
 * - 让每页刚好塞满一行（最后一页可能比较短）
 */
async function rebuildPages() {
  await nextTick();

  const row = tagsRowRef.value;
  const measure = measureRowRef.value;
  if (!row || !measure) {
    pages.value = [props.visibleTags.slice()];
    pageIndex.value = 0;
    return;
  }

  const maxWidth = row.clientWidth || row.offsetWidth;
  if (!maxWidth) {
    pages.value = [props.visibleTags.slice()];
    pageIndex.value = 0;
    return;
  }

  const children = Array.from(measure.children) as HTMLElement[];

  const result: string[][] = [];
  let current: string[] = [];
  let currentWidth = 0;

  const GAP = 8; // 标签间距（px），要和 .mfs-tags-row 的 gap 接近

  children.forEach((el, idx) => {
    const tag = props.visibleTags[idx];
    if (!tag) return;

    const w = el.offsetWidth;
    if (!w) return;

    const extra = current.length ? GAP : 0;

    if (current.length && currentWidth + extra + w > maxWidth) {
      result.push(current);
      current = [tag];
      currentWidth = w;
    } else {
      current.push(tag);
      currentWidth += extra + w;
    }
  });

  if (current.length) result.push(current);
  if (!result.length) result.push([]);

  pages.value = result;
  if (pageIndex.value >= result.length) {
    pageIndex.value = result.length - 1;
  }
}

/** 当可见标签集合变化时，重置到第一页并重新分页 */
watch(
  () => props.visibleTags,
  () => {
    pageIndex.value = 0;
    rebuildPages();
  },
  { deep: true }
);

function handleResize() {
  rebuildPages();
}

onMounted(() => {
  rebuildPages();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
/* 顶部一行：输入框 + 搜索按钮 */
.mfs-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

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

/* 标签区域：一行 + 左右翻页箭头 + 页码 */
.mfs-tags {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.mfs-tags-label {
  font-weight: 600;
}

/* 左右箭头按钮 */
.mfs-tags-nav {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-border, #d0d7de);
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
}

.mfs-tags-nav:disabled {
  opacity: 0.35;
  cursor: default;
}

/* 中间这一行的标签容器 */
.mfs-tags-row {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  overflow: hidden; /* 一行展示，真正的分页靠 JS 控制 */
}

/* 页码文字 */
.mfs-tags-pageinfo {
  font-size: 0.8rem;
  color: #6b7280;
  white-space: nowrap;
}

/* 标签按钮 + 已选标签卡片 共用样式 */
.mfs-tag-btn,
.tag-card,
.mfs-tag-measure {
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

/* 高亮：已选标签 + 输入框上方的选中卡片 */
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

/* 隐藏的测量容器：不占布局，只用于计算宽度 */
.mfs-tags-measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  height: 0;
  overflow: hidden;
}
</style>