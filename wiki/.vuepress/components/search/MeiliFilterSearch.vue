<template>
  <div class="meili-filter-search">

    <!-- ===========================
         选中的标签（新增）
    ============================ -->
    <div class="mfs-selected-tags" v-if="selectedTags.length">
      <div
        v-for="tag in selectedTags"
        :key="tag"
        class="tag-card"
        @click="toggleTag(tag)"
      >
        <span class="tag-box">{{ tag }}</span>
        <span class="tag-triangle">
          <span class="tag-circle"></span>
        </span>
      </div>
    </div>

    <!-- 搜索输入框 -->
    <div class="mfs-bar">
      <input
        v-model="keyword"
        class="mfs-input"
        type="search"
        placeholder="搜索角色 / 概念 / 势力 / 地理 / 历史……"
        @keyup.enter="search"
      />
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

    <!-- 标签筛选（改造后的按钮样式） -->
    <div class="mfs-tags" v-if="availableTags.length">
      <span class="mfs-tags-label">标签：</span>

      <button
        v-for="tag in availableTags"
        :key="tag"
        class="mfs-tag-btn"
        :class="{ 'is-active': selectedTags.includes(tag) }"
        @click="toggleTag(tag)"
      >
        <span class="tag-box">{{ tag }}</span>
        <span class="tag-triangle">
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
import { ref, onMounted } from "vue";
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
 * 分类筛选
 * ======================================================= */

const typeOptions = [
  { value: null, label: "全部" },
  { value: "character", label: "人物" },
  { value: "concept", label: "概念" },
  { value: "faction", label: "势力" },
  { value: "geography", label: "地理" },
  { value: "history", label: "历史" },
];

const typeLabelMap = {
  character: "人物",
  concept: "概念",
  faction: "势力",
  geography: "地理",
  history: "历史",
};

/* =========================================================
 * 标签状态
 * ======================================================= */

const availableTags = ref<string[]>([]);
const selectedTags = ref<string[]>([]);

function toggleTag(tag: string) {
  const idx = selectedTags.value.indexOf(tag);
  if (idx === -1) selectedTags.value.push(tag);
  else selectedTags.value.splice(idx, 1);
  search();
}

/* =========================================================
 * random-index
 * ======================================================= */

interface RandomIndexItem {
  title: string;
  path: string;
  excerpt: string;
}

const randomIndex = ref<RandomIndexItem[]>([]);
const randomIndexLoaded = ref(false);

/* =========================================================
 * taxonomy path → tags
 * ======================================================= */

const pageTagMap: Record<string, string[]> = {};

function normalizePath(raw: string | undefined | null): string {
  if (!raw) return "/";
  let p = raw.trim();
  p = p.replace(/^https?:\/\/[^/]+/, "");

  const h = p.indexOf("#");
  const q = p.indexOf("?");
  const c = h === -1 ? q : q === -1 ? h : Math.min(h, q);
  if (c !== -1) p = p.slice(0, c);

  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);

  return p;
}

function buildPageTagMap() {
  const cats = taxonomyData.categories || {};
  for (const key of Object.keys(cats)) {
    for (const page of cats[key].pages) {
      const norm = normalizePath(page.path);
      const tags = Array.isArray(page.tags) ? page.tags : [];
      pageTagMap[norm] = tags.map((t: any) => String(t).trim());
    }
  }
}

function getTagsFromTaxonomy(url?: string | null) {
  return pageTagMap[normalizePath(url)] || [];
}

function isNosearchUrl(url?: string) {
  const norm = normalizePath(url);
  return nosearchPaths.some((p: string) => normalizePath(p) === norm);
}

/* =========================================================
 * 搜索增强
 * ======================================================= */

async function loadRandomIndex() {
  if (randomIndexLoaded.value) return;
  try {
    const res = await fetch("/data/random-index.json");
    randomIndex.value = (await res.json()).pages || [];
  } catch {}
  randomIndexLoaded.value = true;
}

function attachSummary(hit: any) {
  const match = randomIndex.value.find(
    (it) => normalizePath(it.path) === normalizePath(hit.url || hit.path)
  );

  const summary =
    match?.excerpt?.trim() ||
    hit.summary?.trim() ||
    hit.text?.trim() ||
    "";

  const tagsFromTax = getTagsFromTaxonomy(hit.url);

  let fallbackTags: string[] = [];
  if (Array.isArray(hit.tags)) fallbackTags = hit.tags.map((t: any) => String(t));
  else if (typeof hit.tags === "string") fallbackTags = [hit.tags.trim()];

  return {
    ...hit,
    summary,
    tags: tagsFromTax.length ? tagsFromTax : fallbackTags,
  };
}

/* =========================================================
 * 类型判断
 * ======================================================= */

function inferType(hit: any): string | null {
  const url: string = hit.url || "";
  if (url.includes("/world/characters/")) return "character";
  if (url.includes("/world/concepts/")) return "concept";
  if (url.includes("/world/factions/")) return "faction";
  if (url.includes("/world/geography/")) return "geography";
  if (url.includes("/world/history/")) return "history";
  return null;
}

function setType(v: string | null) {
  activeType.value = v === activeType.value ? null : v;
  search();
}

/* =========================================================
 * 搜索主流程
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

    let hits = (await res.json()).hits || [];

    if (activeType.value)
      hits = hits.filter((h: any) => inferType(h) === activeType.value);

    hits = hits.filter((h: any) => !isNosearchUrl(h.url));

    const seen = new Set();
    const unique = hits.filter((h: any) => {
      const key = (h.url || "").split("#")[0];
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    let enriched = unique.map((h: any) => attachSummary(h));

    const tagSet = new Set<string>();
    enriched.forEach((h) => {
      if (Array.isArray(h.tags)) h.tags.forEach((t: string) => tagSet.add(t));
    });
    availableTags.value = [...tagSet].sort((a, b) =>
      a.localeCompare(b, "zh-Hans-CN")
    );

    if (selectedTags.value.length)
      enriched = enriched.filter((h) =>
        selectedTags.value.every((t) => (h.tags || []).includes(t))
      );

    results.value = enriched;
  } catch (e: any) {
    error.value = e.message;
  }

  loading.value = false;
}

buildPageTagMap();
onMounted(() => search());
</script>

<style scoped>
/* 原样保留你的所有旧样式 ===================================== */
.meili-filter-search {
  max-width: 860px;
  margin: 1.5rem auto;
  padding: 1.5rem;
  border-radius: 1rem;
  background: var(--vp-bg, #fff);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
}

.mfs-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.mfs-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-border, #d0d7de);
  font-size: 0.95rem;
}

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

/* ============================
   标签区域 + 新样式
============================ */

.mfs-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}
.mfs-tags-label {
  font-weight: 600;
}

/* 已选标签区 */
.mfs-selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.7rem;
}

/* 标签统一卡片结构 */
.tag-card,
.mfs-tag-btn {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  padding: 0;
  background: transparent;
  border: none;
}

/* 左边矩形 */
.tag-box {
  padding: 0.3rem 0.55rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-right: none;
  border-radius: 6px 0 0 6px;
  font-size: 0.78rem;
  color: #374151;
  white-space: nowrap;
}

/* 右边三角形 */
.tag-triangle {
  width: 26px;
  height: 26px;
  background: #e5e7eb;
  border: 1px solid #d1d5db;
  border-left: none;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
  position: relative;
}

/* 中间小圆圈 */
.tag-circle {
  width: 10px;
  height: 10px;
  background: white;
  border: 2px solid #9ca3af;
  border-radius: 50%;
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
}

/* 激活状态 */
.mfs-tag-btn.is-active .tag-box,
.tag-card .tag-box {
  background: var(--vp-c-accent, #6366f1);
  color: white;
  border-color: var(--vp-c-accent, #6366f1);
}

.mfs-tag-btn.is-active .tag-triangle,
.tag-card .tag-triangle {
  background: #4f46e5;
  border-color: #4f46e5;
}

.mfs-tag-btn.is-active .tag-circle,
.tag-card .tag-circle {
  background: white;
  border-color: white;
}

/* ============================ */

.mfs-status {
  font-size: 0.9rem;
  color: var(--vp-c-text-2, #6b7280);
  margin: 0.5rem 0;
}

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