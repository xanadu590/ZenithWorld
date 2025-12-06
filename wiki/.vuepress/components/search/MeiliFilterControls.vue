<template>
  <div>
    <!--
      顶部搜索条：
      - 左侧：圆角输入框（内部会塞入已选标签 + 文本输入）
      - 右侧：重置按钮 + 搜索按钮
    -->
    <div class="mfs-bar">
      <!-- 
        输入区域外再包一层：
        - 用 position: relative 作为下拉框的定位参照
        - flex: 1 让它在整行中占满左侧空间
      -->
      <div class="mfs-input-area" style="position: relative; flex: 1;">
        <!-- 真正的“输入胶囊”：只负责显示标签 + 输入框，本身继续保留 max-height + overflow-y -->
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

          <!-- 关键字输入框（受控组件：用 :value + @input 手动实现 v-model） -->
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

        <!-- 自动补全 + 搜索历史下拉框（来自 Meili 官方 suggest API + 本地 history）
             注意：现在已经在 mfs-input-wrapper 外面，不会被它的 overflow 限制 -->
        <ul
          v-if="showSuggestBox && (suggestions.length || searchHistory.length)"
          class="mfs-suggest-box"
          style="position:absolute;left:0;right:0;top:100%;margin-top:0.25rem;z-index:30;background:#ffffff;border:1px solid #d1d5db;border-radius:0.5rem;max-height:260px;overflow-y:auto;list-style:none;padding:0;"
        >
          <!-- 官方联想词 -->
          <li
            v-for="s in suggestions"
            :key="'sg-' + s"
            style="padding:0.45rem 0.7rem;cursor:pointer;font-size:0.85rem;"
            @mousedown.prevent="applySuggestion(s)"
          >
            🔍 {{ s }}
          </li>
          <!-- 搜索历史 -->
          <li
            v-for="h in searchHistory"
            :key="'his-' + h"
            style="padding:0.45rem 0.7rem;cursor:pointer;font-size:0.8rem;color:#6b7280;border-top:1px solid #f3f4f6;"
            @mousedown.prevent="applySuggestion(h)"
          >
            🕘 {{ h }}
          </li>
        </ul>
      </div>

      <!-- 当存在任何筛选条件时，显示“重置”按钮 -->
      <button
        v-if="hasAnyFilter"
        class="mfs-reset-btn"
        @click="$emit('reset-filters')"
      >
        重置
      </button>

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

    <!-- 标签筛选区域：
         - availableTags 中的标签全部展示
         - 但实际上只传进来了 visibleTags（排除了已选标签）
         - 最多显示三行，高度超出时出现滚动条
    -->
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

/** ==== 和父组件约定的 props ==== */
const props = defineProps<{
  keyword: string;
  selectedTags: string[];
  typeOptions: { value: string | null; label: string }[];
  activeType: string | null;
  availableTags: string[];
  visibleTags: string[];
  hasAnyFilter: boolean;
}>();

/** ==== 和父组件约定的事件 ==== */
const emit = defineEmits<{
  (e: "update:keyword", value: string): void;
  (e: "search"): void;
  (e: "toggle-tag", tag: string): void;
  (e: "set-type", value: string | null): void;
  (e: "reset-filters"): void;
}>();

/* =========================================================
 * MeiliSearch 连接信息（只读搜索 key，可以直接写死在前端）
 * ======================================================= */

const SEARCH_HOST = "https://search.zenithworld.top";
const SEARCH_INDEX = "wiki";
const SEARCH_API_KEY =
  "e12946c7f8693e562f078360da358419a57197338607669795398c2ee3fddf59";

/* =========================================================
 * 自动补全 + 搜索历史 相关状态
 * ======================================================= */

/** 来自 MeiliSearch /search 的联想词（用 title 当建议词） */
const suggestions = ref<string[]>([]);
/** 本地搜索历史（存在 localStorage） */
const searchHistory = ref<string[]>([]);
/** 是否显示下拉框（联想词 / 历史） */
const showSuggestBox = ref(false);

const HISTORY_KEY = "zw-meili-search-history";

/** 挂载时，从 localStorage 读取历史记录 */
onMounted(() => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    searchHistory.value = raw ? JSON.parse(raw) : [];
  } catch {
    searchHistory.value = [];
  }
});

/** 保存一条搜索词到历史记录（去重 + 只保留最近 10 条） */
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
    /* 忽略持久化失败 */
  }
}

/** 调用 MeiliSearch 官方 /search API 做“自动补全”（用标题当建议词） */
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
          // 🔑 带上前端只读 key，否则 401
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
      // 失败就清空，避免控制台刷屏
      suggestions.value = [];
      return;
    }

    const data = await res.json();
    const hits = Array.isArray(data.hits) ? data.hits : [];

    // 从结果中提取“建议词”：优先 title，其次层级标题
    suggestions.value = hits
      .map(
        (h: any) =>
          h.title || h.hierarchy_lvl1 || h.hierarchy_lvl0 || ""
      )
      .filter((s: string) => s && typeof s === "string")
      // 去重
      .filter((s: string, idx: number, arr: string[]) => arr.indexOf(s) === idx)
      .slice(0, 8);
  } catch {
    suggestions.value = [];
  }
}

/* 当输入框内容变化时：
 * 1）通知父组件更新 keyword
 * 2）调用 /search 获取联想词
 * 3）展开下拉框
 */
function onInput(val: string) {
  emit("update:keyword", val);
  fetchSuggestions(val);
  showSuggestBox.value = true;
}

/** 输入框获得焦点：如果有关键字就请求一次联想，否则只展示历史 */
function onFocus() {
  showSuggestBox.value = true;
  if (props.keyword?.trim()) {
    fetchSuggestions(props.keyword);
  }
}

/** 失去焦点时延迟关闭下拉框，保证点击选项能生效 */
function onBlur() {
  setTimeout(() => {
    showSuggestBox.value = false;
  }, 150);
}

/** 点击“搜索”按钮或按回车：
 * 1）写入历史
 * 2）通知父组件搜索
 * 3）收起下拉框
 */
function onClickSearch() {
  if (props.keyword) saveHistory(props.keyword);
  emit("search");
  showSuggestBox.value = false;
}

function onEnter() {
  onClickSearch();
}

/** 选择某个联想词 / 历史记录：
 * 1）把它写入输入框
 * 2）写入历史
 * 3）立刻触发搜索
 */
function applySuggestion(word: string) {
  emit("update:keyword", word);
  saveHistory(word);
  emit("search");
  showSuggestBox.value = false;
}
</script>

<style scoped>
/* 顶部一行：输入框 + 重置按钮 + 搜索按钮 */
.mfs-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

/* 输入框外层的“胶囊”容器：
 * - 内部可以同时容纳多个标签 + 文本输入
 * - 如果标签过多，高度限制后出现竖向滚动条
 */
.mfs-input-wrapper {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-border, #d0d7de);
  background: #fff;

  max-height: 4.5rem;    /* 控制最多显示两三行标签 */
  overflow-y: auto;      /* 超出的部分改为滚动 */
}

/* 文本输入本体：不再显示原生边框 */
.mfs-input {
  flex: 1;
  min-width: 6rem;
  padding: 0.25rem 0.2rem;
  border: none;
  outline: none;
  font-size: 0.95rem;
}

/* 主搜索按钮：右侧蓝色按钮 */
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

/* 重置按钮：样式弱一些的灰色小按钮 */
.mfs-reset-btn {
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
  color: #4b5563;
}

/* 分类按钮区域整体布局 */
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

/* 单个分类按钮 */
.mfs-filter-btn {
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-border, #d0d7de);
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
}

/* 选中的分类按钮：高亮为主题色 */
.mfs-filter-btn.is-active {
  background: var(--vp-c-accent, #6366f1);
  color: #fff;
  border-color: transparent;
}

/* 标签区域：
 * - 多行 flex 布局
 * - 限制最大高度 ≈ 三行标签
 * - 超出时出现滚动条
 */
.mfs-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.4rem;
  margin-bottom: 0.75rem;

  max-height: calc(1.8rem * 3);
  overflow-y: auto;
  padding-right: 0.3rem; /* 给滚动条留一点空间，避免贴边 */
}

.mfs-tags-label {
  font-weight: 600;
  margin-right: 0.25rem;
}

/* 标签按钮与上方“已选标签卡片”使用统一外层样式 */
.mfs-tag-btn,
.tag-card {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;

  font-size: 0.9rem;
  --tag-dot-size: 0.33em; /* 小圆点大小基于字体高度 */
}

/* 标签的“药丸”矩形主体 */
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

/* 右上角的小圆点：仅做装饰用 */
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

/* 选中状态：统一高亮标签颜色，并略微放大文字 */
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