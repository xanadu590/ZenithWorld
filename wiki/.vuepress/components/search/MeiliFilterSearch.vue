<template>
  <div class="meili-filter-search">
    <!-- 搜索输入框 + 已选标签都在同一圆角框里 -->
    <div class="mfs-bar">
      <div class="mfs-input-wrapper">
        <!-- 已选标签：显示在搜索框里，点击取消 -->
        <div
          v-for="tag in selectedTags"
          :key="tag"
          class="tag-card"
          @click="toggleTag(tag)"
        >
          <span class="tag-box">
            {{ tag }}
            <span class="tag-circle"></span>
          </span>
        </div>

        <!-- 关键字输入 -->
        <input
          v-model="keyword"
          class="mfs-input"
          type="search"
          placeholder="搜索角色 / 概念 / 势力 / 地理 / 历史……"
          @keyup.enter="search"
        />
      </div>

      <!-- 功能 1：一键重置筛选条件 -->
      <button
        v-if="hasAnyFilter"
        class="mfs-reset-btn"
        @click="resetFilters"
      >
        重置
      </button>

      <button class="mfs-btn" @click="search">搜索</button>
    </div>

    <!-- 分类筛选按钮 -->
    <div class="mfs-filters">
      <span class="mfs-filters-label">分类：</span>
      <button
        v-for="opt in typeOptions"
        :key="String(opt.value)"
        class="mfs-filter-btn"
        :class="{ 'is-active': activeType === opt.value }"
        @click="setType(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- 标签筛选区域：只显示“未选中”的标签 -->
    <div class="mfs-tags" v-if="availableTags.length">
      <span class="mfs-tags-label">标签：</span>

      <button
        v-for="tag in visibleTags"
        :key="tag"
        class="mfs-tag-btn"
        :class="{ 'is-active': selectedTags.includes(tag) }"
        @click="toggleTag(tag)"
      >
        <span class="tag-box">
          {{ tag }}
          <span class="tag-circle"></span>
        </span>
      </button>
    </div>

    <!-- 状态提示 -->
    <div class="mfs-status" v-if="loading">正在搜索……</div>
    <div class="mfs-status" v-else-if="error">出错了：{{ error }}</div>
    <div class="mfs-status" v-else-if="!results.length && searchedOnce">
      没有搜索结果
    </div>

    <!-- 搜索结果 -->
    <ul class="mfs-results" v-if="results.length">
      <li
        v-for="hit in results"
        :key="hit.id || hit.objectID || hit.url"
        class="mfs-result-item"
      >
        <a :href="hit.url" class="mfs-result-link">
          <div class="mfs-result-title">
            <span v-if="inferType(hit)" class="mfs-tag">
              [{{ typeLabelMap[inferType(hit)!] || inferType(hit) }}]
            </span>
            {{ hit.title || hit.hierarchy_lvl1 || hit.hierarchy_lvl0 || "(无标题)" }}
          </div>

          <div class="mfs-result-meta">
            <span v-if="hit.region">区域：{{ hit.region }}</span>
            <span v-if="hit.tags?.length">
              · 标签：{{ hit.tags.join(" / ") }}
            </span>
          </div>

          <div class="mfs-result-summary">
            {{ hit.summary || hit.text || "（暂无摘要）" }}
          </div>

          <div class="mfs-result-url">{{ hit.url }}</div>
        </a >
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
// @ts-ignore
import { nosearchPaths } from "@temp/nosearch/nosearchPaths.js";
// @ts-ignore
import { taxonomyData } from "@temp/wiki-taxonomy/data.js";

/* =========================================================
 * 一、MeiliSearch 基本配置
 * ======================================================= */

const host = "https://search.zenithworld.top";
const indexUid = "wiki";
const apiKey =
  "e12946c7f8693e562f078360da358419a57197338607669795398c2ee3fddf59";

const keyword = ref("");
const activeType = ref<string | null>(null);
const results = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchedOnce = ref(false);

/* =========================================================
 * 二、分类筛选配置
 * ======================================================= */

const typeOptions = [
  { value: null,        label: "全部" },
  { value: "character", label: "人物" },
  { value: "concept",   label: "概念" },
  { value: "faction",   label: "势力" },
  { value: "geography", label: "地理" },
  { value: "history",   label: "历史" },
];

const typeLabelMap: Record<string, string> = {
  character: "人物",
  concept: "概念",
  faction: "势力",
  geography: "地理",
  history: "历史",
};

/* =========================================================
 * 三、标签状态：候选 / 已选
 * ======================================================= */

const availableTags = ref<string[]>([]);
const selectedTags = ref<string[]>([]);

/** 用于下方标签按钮，只显示“未选中”的标签 */
const visibleTags = computed(() =>
  availableTags.value.filter(tag => !selectedTags.value.includes(tag))
);

/** 是否有任何筛选（用于显示 / 隐藏重置按钮） */
const hasAnyFilter = computed(() =>
  keyword.value.trim() !== "" ||
  activeType.value !== null ||
  selectedTags.value.length > 0
);

/** 切换某个标签选中状态（用于按钮和顶部卡片） */
function toggleTag(tag: string) {
  const idx = selectedTags.value.indexOf(tag);
  if (idx === -1) {
    selectedTags.value.push(tag);
  } else {
    selectedTags.value.splice(idx, 1);
  }
  // 每次调整标签都重新搜索
  search();
}

/** 功能 1：一键重置所有条件 */
function resetFilters() {
  keyword.value = "";
  activeType.value = null;
  selectedTags.value = [];
  search();
}

/* =========================================================
 * 四、random-index 简介数据：用于补充 summary
 * ======================================================= */

interface RandomIndexItem {
  title: string;
  path: string;
  excerpt: string;
}

const randomIndex = ref<RandomIndexItem[]>([]);
const randomIndexLoaded = ref(false);

/** 只加载一次 random-index.json */
async function loadRandomIndex() {
  if (randomIndexLoaded.value) return;
  try {
    const res = await fetch("/data/random-index.json");
    const json = await res.json();
    randomIndex.value = Array.isArray(json.pages) ? json.pages : [];
  } catch {
    // 失败就静默，summary 用原始搜索结果
  } finally {
    randomIndexLoaded.value = true;
  }
}

/* =========================================================
 * 五、taxonomy path → tags 映射
 * ======================================================= */

const pageTagMap: Record<string, string[]> = {};

/** 统一规范化路径：去掉域名、锚点、查询参数、结尾斜杠 */
function normalizePath(raw: string | undefined | null): string {
  if (!raw) return "/";
  let p = raw.trim();
  // 去掉协议和域名
  p = p.replace(/^https?:\/\/[^/]+/, "");

  const h = p.indexOf("#");
  const q = p.indexOf("?");
  const cut = h === -1 ? q : q === -1 ? h : Math.min(h, q);
  if (cut !== -1) p = p.slice(0, cut);

  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

/** 从 taxonomyData 中建立 path → tags 映射表 */
function buildPageTagMap() {
  const cats = (taxonomyData as any).categories || {};
  for (const key of Object.keys(cats)) {
    const entry = cats[key];
    if (!entry || !Array.isArray(entry.pages)) continue;
    for (const page of entry.pages) {
      const norm = normalizePath(page.path);
      const tags = Array.isArray(page.tags) ? page.tags : [];
      pageTagMap[norm] = tags.map((t: any) => String(t).trim());
    }
  }
}

/** 根据 url/path 从 taxonomy 中取 tags 数组 */
function getTagsFromTaxonomy(url?: string | null) {
  const norm = normalizePath(url);
  return pageTagMap[norm] || [];
}

/** 是否 frontmatter:nosearch 页面 */
function isNosearchUrl(url?: string) {
  const norm = normalizePath(url);
  return (nosearchPaths as string[]).some(
    (p) => normalizePath(p) === norm
  );
}

/* =========================================================
 * 六、搜索增强：加载 random-index + 合成 summary / tags
 * ======================================================= */

/** 为 Meili 的单条 hit 补充 summary 和 tags */
function attachSummary(hit: any) {
  const hitPathNorm = normalizePath(hit.url || hit.path);

  // 1）summary：优先 random-index.excerpt
  const match = randomIndex.value.find(
    (it) => normalizePath(it.path) === hitPathNorm
  );
  const summary =
    match?.excerpt?.trim() ||
    hit.summary?.trim() ||
    hit.text?.trim() ||
    "";

  // 2）tags：优先 taxonomyData，其次用 Meili 原始字段
  const tagsFromTax = getTagsFromTaxonomy(hit.url || hit.path);

  let fallbackTags: string[] = [];
  if (Array.isArray(hit.tags)) {
    fallbackTags = hit.tags.map((t: any) => String(t).trim());
  } else if (typeof hit.tags === "string") {
    fallbackTags = [hit.tags.trim()];
  }

  return {
    ...hit,
    summary,
    tags: tagsFromTax.length ? tagsFromTax : fallbackTags,
  };
}

/* =========================================================
 * 七、类型推断 & 分类按钮逻辑
 * ======================================================= */

function inferType(hit: any): string | null {
  const url: string = hit.url || "";
  if (url.includes("/world/characters/")) return "character";
  if (url.includes("/world/concepts/"))   return "concept";
  if (url.includes("/world/factions/"))   return "faction";
  if (url.includes("/world/geography/"))  return "geography";
  if (url.includes("/world/history/"))    return "history";
  return null;
}

function setType(v: string | null) {
  // 再次点击同一分类 = 取消分类过滤
  activeType.value = v === activeType.value ? null : v;
  search();
}

/* =========================================================
 * 八、搜索主流程
 * ======================================================= */

async function search() {
  searchedOnce.value = true;
  loading.value = true;
  error.value = null;

  try {
    await loadRandomIndex();

    const res = await fetch(`${host}/indexes/${indexUid}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ q: keyword.value, limit: 500 }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    let hits: any[] = (await res.json()).hits || [];

    // 1）按分类过滤
    if (activeType.value) {
      hits = hits.filter((h) => inferType(h) === activeType.value);
    }

    // 2）过滤 nosearch 页面
    hits = hits.filter((h) => !isNosearchUrl(h.url || h.path));

    // 3）按“页面”去重（去掉 #锚点重复）
    const seen = new Set<string>();
    const unique = hits.filter((h) => {
      const base = (h.url || "").split("#")[0];
      if (seen.has(base)) return false;
      seen.add(base);
      return true;
    });

    // 4）补充 summary 与 tags
    let enriched = unique.map((h) => attachSummary(h));

    // 5）统计当前条件下所有 tag，填充标签列表
    const tagSet = new Set<string>();
    enriched.forEach((h) => {
      if (Array.isArray(h.tags)) {
        h.tags.forEach((t: string) => {
          const s = String(t || "").trim();
          if (s) tagSet.add(s);
        });
      }
    });
    availableTags.value = [...tagSet].sort((a, b) =>
      a.localeCompare(b, "zh-Hans-CN")
    );

    // 6）如果选中了标签，就做 AND 过滤
    if (selectedTags.value.length) {
      enriched = enriched.filter((h) => {
        const tagArr: string[] = Array.isArray(h.tags) ? h.tags : [];
        return selectedTags.value.every((t) => tagArr.includes(t));
      });
    }

    results.value = enriched;
  } catch (e: any) {
    error.value = e.message || String(e);
  } finally {
    loading.value = false;
  }
}

/* =========================================================
 * 九、初始化：构建 tag 映射 + 首次搜索
 * ======================================================= */

buildPageTagMap();
onMounted(() => {
  search().catch(() => {});
});
</script>

<style scoped>
/* =========================================================
 * A. 搜索整体布局
 * ======================================================= */

.meili-filter-search {
  max-width: 860px;
  margin: 1.5rem auto;
  padding: 1.5rem;
  border-radius: 1rem;
  background: var(--vp-bg, #fff);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
}

/* 搜索框 + 选中标签在同一圆角框里 */
.mfs-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

/* 外层圆角框
 * 功能 2：max-height + overflow-y 实现“标签太多时可滚动” */
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

  max-height: 4.5rem;    /* 允许两三行标签 */
  overflow-y: auto;      /* 超出时出现竖向滚动条 */
}

/* 真正的输入框 */
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

/* 功能 1：重置按钮（弱一点的灰色样式） */
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

/* 分类按钮行 */
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

/* 状态提示 */
.mfs-status {
  font-size: 0.9rem;
  color: var(--vp-c-text-2, #6b7280);
  margin: 0.5rem 0;
}

/* =========================================================
 * B. 标签卡片样式（药丸 + 右上角小圆点）
 * ======================================================= */

.mfs-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.mfs-tags-label {
  font-weight: 600;
  margin-right: 0.25rem;
}

/* 统一：按钮 & 选中卡片的外层容器 */
.mfs-tag-btn,
.tag-card {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;

  font-size: 0.9rem;
  --tag-dot-size: 0.33em;     /* ◎ 小圆点直径，占文字高度的比例 */
}

/* 标签矩形 */
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

/* 右上角小圆点 */
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

/* 选中状态：上方卡片 + 下方按钮统一样式 */
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

/* =========================================================
 * C. 搜索结果列表
 * ======================================================= */

.mfs-results {
  list-style: none;
  margin: 0;
  padding: 0;
}

.mfs-result-item + .mfs-result-item {
  margin-top: 0.75rem;
}

.mfs-result-link {
  display: block;
  padding: 0.7rem 0.9rem;
  border-radius: 0.75rem;
  border: 1px solid var(--vp-c-border, #e5e7eb);
  text-decoration: none;
  color: inherit;
}

.mfs-result-link:hover {
  border-color: var(--vp-c-accent, #6366f1);
  background: rgba(99, 102, 241, 0.02);
}

.mfs-result-title {
  font-weight: 600;
  margin-bottom: 0.2rem;
}

.mfs-tag {
  display: inline-block;
  margin-right: 0.35rem;
  padding: 0 0.35rem;
  border-radius: 0.5rem;
  background: rgba(99, 102, 241, 0.12);
  color: #4f46e5;
  font-size: 0.75rem;
}

.mfs-result-meta {
  font-size: 0.8rem;
  color: var(--vp-c-text-2, #9ca3af);
  margin-bottom: 0.25rem;
}

.mfs-result-summary {
  font-size: 0.85rem;
  color: var(--vp-c-text-1, #4b5563);
  margin-bottom: 0.3rem;
}

.mfs-result-url {
  font-size: 0.75rem;
  color: var(--vp-c-text-3, #9ca3af);
}
</style>