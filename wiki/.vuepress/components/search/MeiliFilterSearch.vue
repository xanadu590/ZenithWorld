<template>
  <div class="meili-filter-search">
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

    <!-- 标签筛选：打开页面就会列出（基于当前分类的所有结果） -->
    <div class="mfs-tags" v-if="availableTags.length">
      <span class="mfs-tags-label">标签：</span>
      <button
        v-for="tag in availableTags"
        :key="tag"
        class="mfs-tag-btn"
        :class="{ 'is-active': selectedTags.includes(tag) }"
        @click="toggleTag(tag)"
      >
        {{ tag }}
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
            <!-- 根据 url / type 推断类型，显示中文标签 -->
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

          <!-- 摘要：优先用 random-index 的 excerpt，attachSummary 已经填到 hit.summary 里 -->
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
// 前端 nosearch 列表
// @ts-ignore
import { nosearchPaths } from "@temp/nosearch/nosearchPaths.js";
// 从 taxonomy 插件里拿到每个页面的 tags
// @ts-ignore
import { taxonomyData } from "@temp/wiki-taxonomy/data.js";

/* =========================================================
 * 一、MeiliSearch 基本配置
 * ======================================================= */

const host = "https://search.zenithworld.top";
const indexUid = "wiki";
const apiKey =
  "e12946c7f8693e562f078360da358419a57197338607669795398c2ee3fddf59"; // 千万不要填 Master Key

const keyword = ref("");
const activeType = ref<string | null>(null);
const results = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchedOnce = ref(false);

/* =========================================================
 * 二、分类按钮配置（已去掉“力量体系”）
 * ======================================================= */

const typeOptions: { value: string | null; label: string }[] = [
  { value: null, label: "全部" },
  { value: "character", label: "人物" },
  { value: "concept", label: "概念" },
  { value: "faction", label: "势力" },
  { value: "geography", label: "地理" },
  { value: "history", label: "历史" },
];

const typeLabelMap: Record<string, string> = {
  character: "人物",
  concept: "概念",
  faction: "势力",
  geography: "地理",
  history: "历史",
};

/* =========================================================
 * 三、标签筛选状态
 * ======================================================= */

const availableTags = ref<string[]>([]);
const selectedTags = ref<string[]>([]);

/** 切换某个标签的选中状态，再跑一次 search（不需要手动输入关键字） */
function toggleTag(tag: string) {
  const idx = selectedTags.value.indexOf(tag);
  if (idx === -1) {
    selectedTags.value.push(tag);
  } else {
    selectedTags.value.splice(idx, 1);
  }
  search();
}

/* =========================================================
 * 四、random-index 简介数据：接入 /data/random-index.json
 * ======================================================= */

interface RandomIndexItem {
  title: string;
  path: string;
  excerpt: string;
}

const randomIndex = ref<RandomIndexItem[]>([]);
const randomIndexLoaded = ref(false);

/* =========================================================
 * 五、路径规范化 & tag 映射（从 taxonomyData 里构建）
 * ======================================================= */

type AnyTax = any;

// path -> tags[]（来自 taxonomyData）
const pageTagMap: Record<string, string[]> = {};

function normalizePath(raw: string | undefined | null): string {
  if (!raw) return "/";

  let p = raw.trim();

  // 1）去掉协议和域名
  p = p.replace(/^https?:\/\/[^/]+/, "");

  // 2）截掉 ? 和 #
  const hashIndex = p.indexOf("#");
  const queryIndex = p.indexOf("?");
  let cutIndex = -1;

  if (hashIndex !== -1 && queryIndex !== -1) {
    cutIndex = Math.min(hashIndex, queryIndex);
  } else if (hashIndex !== -1) {
    cutIndex = hashIndex;
  } else if (queryIndex !== -1) {
    cutIndex = queryIndex;
  }

  if (cutIndex !== -1) {
    p = p.slice(0, cutIndex);
  }

  // 3）去掉末尾 /
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);

  return p || "/";
}

/** 初始化：从 taxonomyData.categories[*].pages 里抽取 path & tags 填到 pageTagMap */
function buildPageTagMap() {
  const cats = (taxonomyData as AnyTax).categories || {};
  for (const key of Object.keys(cats)) {
    const entry = cats[key];
    if (!entry || !Array.isArray(entry.pages)) continue;

    for (const page of entry.pages as AnyTax[]) {
      const norm = normalizePath(page.path);
      const rawTags: string[] = Array.isArray(page.tags) ? page.tags : [];
      if (!pageTagMap[norm]) pageTagMap[norm] = [];
      for (const t of rawTags) {
        const s = String(t || "").trim();
        if (s && !pageTagMap[norm].includes(s)) {
          pageTagMap[norm].push(s);
        }
      }
    }
  }
}

/** 根据 url/path 从 taxonomy 中取 tags 数组 */
function getTagsFromTaxonomy(urlOrPath?: string | null): string[] {
  const norm = normalizePath(urlOrPath || "/");
  return pageTagMap[norm] || [];
}

/** 是否 frontmatter:nosearch */
function isNosearchUrl(url: string | undefined | null): boolean {
  const norm = normalizePath(url || "/");
  return (nosearchPaths as string[]).some(
    (p) => normalizePath(p) === norm
  );
}

async function loadRandomIndex() {
  if (randomIndexLoaded.value) return;
  try {
    const res = await fetch("/data/random-index.json");
    const data = await res.json();
    randomIndex.value = Array.isArray(data.pages) ? data.pages : [];
    console.log(
      "[Search] random-index loaded:",
      randomIndex.value.length,
      "items"
    );
  } catch (e) {
    console.error("[Search] load random-index failed:", e);
  } finally {
    randomIndexLoaded.value = true;
  }
}

/**
 * 给 Meili 的 hit 补充：
 *  - summary：优先 random-index.excerpt
 *  - tags：  优先 taxonomyData 里的 tags
 */
function attachSummary<
  T extends {
    url?: string;
    path?: string;
    summary?: string;
    text?: string;
    tags?: string[] | string;
    tag?: string[] | string;
    region?: string;
    type?: string;
  }
>(hit: T) {
  const hitPathNorm = normalizePath(hit.url || hit.path);

  const match = randomIndex.value.find(
    (it) => normalizePath(it.path) === hitPathNorm
  );

  /* 1. summary */
  const summaryFromIndex = match?.excerpt?.trim() || "";
  const fallback = (hit.summary ?? "").trim() || (hit.text ?? "").trim();
  const finalSummary = summaryFromIndex || fallback;

  /* 2. 标签：taxonomyData 优先，其次用 Meili 上自带的 tag/tags（如果有） */
  const tagsFromTaxonomy = getTagsFromTaxonomy(hit.url || hit.path);

  const rawTags = (hit.tags ?? hit.tag ?? []) as string[] | string;
  let fallbackTags: string[] = [];
  if (Array.isArray(rawTags)) {
    fallbackTags = rawTags.map((t) => String(t).trim());
  } else if (typeof rawTags === "string") {
    fallbackTags = [rawTags.trim()];
  }

  const finalTags =
    tagsFromTaxonomy.length > 0 ? tagsFromTaxonomy : fallbackTags;

  return {
    ...hit,
    summary: finalSummary,
    tags: finalTags,
  };
}

/* =========================================================
 * 六、类型推断 & 分类按钮逻辑
 * ======================================================= */

function inferType(hit: any): string | null {
  if (hit.type) return hit.type as string;

  const url: string = hit.url || "";

  if (url.includes("/world/characters/")) return "character";
  if (url.includes("/world/concepts/")) return "concept";
  if (url.includes("/world/factions/")) return "faction";
  if (url.includes("/world/geography/")) return "geography";
  if (url.includes("/world/history/")) return "history";

  return null;
}

function setType(val: string | null) {
  // 切换分类时不清空已选标签，形成“分类 AND 标签”的组合
  activeType.value = val === activeType.value ? null : val;
  search();
}

/* =========================================================
 * 七、搜索主流程
 * ======================================================= */

async function search() {
  searchedOnce.value = true;
  loading.value = true;
  error.value = null;

  try {
    await loadRandomIndex();

    const body: any = {
      q: keyword.value, // 可以是空字符串
      limit: 500,
    };

    const res = await fetch(`${host}/indexes/${indexUid}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    let hits: any[] = data.hits || [];

    // 1）按分类筛选
    if (activeType.value) {
      hits = hits.filter((hit) => inferType(hit) === activeType.value);
    }

    // 2）过滤 nosearch 页面
    hits = hits.filter((hit) => !isNosearchUrl(hit.url || hit.path));

    // 3）按“页面”去重
    const seenPages = new Set<string>();
    const uniqueHits: any[] = [];
    for (const hit of hits) {
      const rawUrl: string = hit.url || "";
      const baseUrl = rawUrl.split("#")[0];
      if (seenPages.has(baseUrl)) continue;
      seenPages.add(baseUrl);
      uniqueHits.push(hit);
    }

    // 4）补充 summary/tags
    const enrichedHits = uniqueHits.map((hit) => attachSummary(hit));

    // 5）统计当前条件下所有 tag，填充标签面板
    const tagSet = new Set<string>();
    for (const hit of enrichedHits) {
      if (Array.isArray(hit.tags)) {
        for (const t of hit.tags) {
          const s = String(t || "").trim();
          if (s) tagSet.add(s);
        }
      }
    }
    availableTags.value = Array.from(tagSet).sort((a, b) =>
      a.localeCompare(b, "zh-Hans-CN")
    );

    // 6）如果用户选中了标签，则做 AND 过滤
    let filteredHits = enrichedHits;
    if (selectedTags.value.length) {
      filteredHits = enrichedHits.filter((hit) => {
        const tagArr: string[] = Array.isArray(hit.tags)
          ? hit.tags.map((t: any) => String(t))
          : [];
        return selectedTags.value.every((t) => tagArr.includes(t));
      });
    }

    results.value = filteredHits;
  } catch (e: any) {
    console.error(e);
    error.value = e.message || String(e);
  } finally {
    loading.value = false;
  }
}

/* =========================================================
 * 初始化：构建 tag 映射 + 首次搜索
 * ======================================================= */

// 构建一次 path -> tags 的映射
buildPageTagMap();

onMounted(() => {
  // 一进高级搜索页面，就自动跑一次空搜索，列出所有 tag + 初始结果
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

/* 标签区域样式 */
.mfs-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
}

.mfs-tags-label {
  font-weight: 600;
  margin-right: 0.2rem;
}

.mfs-tag-btn {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-border, #d0d7de);
  background: #f9fafb;
  cursor: pointer;
  font-size: 0.8rem;
}

.mfs-tag-btn.is-active {
  background: var(--vp-c-accent, #6366f1);
  color: #fff;
  border-color: transparent;
}

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