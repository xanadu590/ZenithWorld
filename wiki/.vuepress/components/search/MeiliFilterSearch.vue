<template>
  <div class="meili-filter-search">
    <!-- 顶部控制区：搜索框 / 分类 / 标签  -->
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
import MeiliFilterControls from "./MeiliFilterControls.vue";
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
const hasAnyFilter = computed(
  () =>
    keyword.value.trim() !== "" ||
    activeType.value !== null ||
    selectedTags.value.length > 0
);

/** 处理子组件发出的 keyword 更新事件 */
function handleUpdateKeyword(val: string) {
  keyword.value = val;
}

/** 切换某个标签选中状态（用于按钮和顶部卡片） */
function toggleTag(tag: string) {
  const idx = selectedTags.value.indexOf(tag);
  if (idx === -1) {
    selectedTags.value.push(tag);
  } else {
    selectedTags.value.splice(idx, 1);
  }
  search();
}

/** 一键重置所有条件 */
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
    // 失败就静默
  } finally {
    randomIndexLoaded.value = true;
  }
}

/* =========================================================
 * 五、taxonomy path → tags 映射
 * ======================================================= */

const pageTagMap: Record<string, string[]> = {};

function normalizePath(raw: string | undefined | null): string {
  if (!raw) return "/";
  let p = raw.trim();
  p = p.replace(/^https?:\/\/[^/]+/, "");
  const h = p.indexOf("#");
  const q = p.indexOf("?");
  const cut = h === -1 ? q : q === -1 ? h : Math.min(h, q);
  if (cut !== -1) p = p.slice(0, cut);
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

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

function getTagsFromTaxonomy(url?: string | null) {
  const norm = normalizePath(url);
  return pageTagMap[norm] || [];
}

function isNosearchUrl(url?: string) {
  const norm = normalizePath(url);
  return (nosearchPaths as string[]).some(
    (p) => normalizePath(p) === norm
  );
}

/* =========================================================
 * 六、搜索增强：加载 random-index + 合成 summary / tags
 * ======================================================= */

function attachSummary(hit: any) {
  const hitPathNorm = normalizePath(hit.url || hit.path);

  const match = randomIndex.value.find(
    (it) => normalizePath(it.path) === hitPathNorm
  );
  const summary =
    match?.excerpt?.trim() ||
    hit.summary?.trim() ||
    hit.text?.trim() ||
    "";

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

    if (activeType.value) {
      hits = hits.filter((h) => inferType(h) === activeType.value);
    }

    hits = hits.filter((h) => !isNosearchUrl(h.url || h.path));

    const seen = new Set<string>();
    const unique = hits.filter((h) => {
      const base = (h.url || "").split("#")[0];
      if (seen.has(base)) return false;
      seen.add(base);
      return true;
    });

    let enriched = unique.map((h) => attachSummary(h));

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
 * 九、初始化
 * ======================================================= */

buildPageTagMap();
onMounted(() => {
  search().catch(() => {});
});
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

/* 状态提示 */
.mfs-status {
  font-size: 0.9rem;
  color: var(--vp-c-text-2, #6b7280);
  margin: 0.5rem 0;
}

/* 搜索结果列表 */
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
```0