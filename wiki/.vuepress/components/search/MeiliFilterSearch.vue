<template>
  <div class="meili-filter-search">
    <!--
      顶部控制区：
      - 包含“搜索输入框 + 已选标签 + 分类按钮 + 标签按钮”
      - 具体 UI 和交互都放在子组件 MeiliFilterControls 中
      - 这里只负责把各种状态传下去，并监听子组件抛出的事件
    -->
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

    <!-- 搜索状态提示 -->
    <div class="mfs-status" v-if="loading">正在搜索……</div>
    <div class="mfs-status" v-else-if="error">出错了：{{ error }}</div>
    <div class="mfs-status" v-else-if="!results.length && searchedOnce">
      没有搜索结果
    </div>

    <!-- 搜索结果列表 -->
    <ul class="mfs-results" v-if="results.length">
      <li
        v-for="hit in results"
        :key="hit.id || hit.objectID || hit.url"
        class="mfs-result-item"
      >
        <a :href="hit.url" class="mfs-result-link">
          <div class="mfs-result-title">
            <!-- 根据 URL 推断类型，在标题前加上 [人物]/[势力] 这样的标记 -->
            <span v-if="inferType(hit)" class="mfs-tag">
              [{{ typeLabelMap[inferType(hit)!] || inferType(hit) }}]
            </span>
            {{ hit.title || hit.hierarchy_lvl1 || hit.hierarchy_lvl0 || "(无标题)" }}
          </div>

          <!-- 结果的补充信息：区域 + 标签 -->
          <div class="mfs-result-meta">
            <span v-if="hit.region">区域：{{ hit.region }}</span>
            <span v-if="hit.tags?.length">
              · 标签：{{ hit.tags.join(" / ") }}
            </span>
          </div>

          <!-- 结果摘要：由 random-index / Meili 字段拼出来 -->
          <div class="mfs-result-summary">
            {{ hit.summary || hit.text || "（暂无摘要）" }}
          </div>

          <!-- 显示原始 URL，方便确认跳转位置 -->
          <div class="mfs-result-url">{{ hit.url }}</div>
        </a >
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
// 由 VuePress 生成的临时文件：标记哪些页面不参与搜索
// @ts-ignore
import { nosearchPaths } from "@temp/nosearch/nosearchPaths.js";
// 由自定义 taxonomy 插件生成：包含每个页面的分类与标签
// @ts-ignore
import { taxonomyData } from "@temp/wiki-taxonomy/data.js";

/* =========================================================
 * 一、MeiliSearch 连接配置
 *    - host    ：搜索服务地址
 *    - indexUid：使用的索引名称
 *    - apiKey  ：前端使用的只读密钥
 * ======================================================= */

const host = "https://search.zenithworld.top";
const indexUid = "wiki";
const apiKey =
  "e12946c7f8693e562f078360da358419a57197338607669795398c2ee3fddf59";

/** 搜索关键字 */
const keyword = ref("");
/** 当前选中的“分类”类型（人物/概念/势力等），null 表示不过滤 */
const activeType = ref<string | null>(null);
/** 实际展示在页面上的搜索结果 */
const results = ref<any[]>([]);
/** 加载状态 / 错误信息 / 是否搜索过一次 */
const loading = ref(false);
const error = ref<string | null>(null);
const searchedOnce = ref(false);

/* =========================================================
 * 二、分类筛选配置
 *    - typeOptions  ：分类按钮列表
 *    - typeLabelMap ：类型英文 key → 中文名称
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
 * 三、标签筛选状态
 *    - availableTags：当前结果中出现过的所有标签（候选）
 *    - selectedTags ：用户已经选中的标签
 *    - visibleTags  ：“候选区域”中显示哪些标签（= 总标签 - 已选中）
 *    - hasAnyFilter ：是否有任何筛选条件，控制“重置”按钮显隐
 * ======================================================= */

const availableTags = ref<string[]>([]);
const selectedTags = ref<string[]>([]);

/** 候选标签区域内显示的标签：从 availableTags 中扣掉已选中的 */
const visibleTags = computed(() =>
  availableTags.value.filter(tag => !selectedTags.value.includes(tag))
);

/** 是否存在任何筛选条件（关键字 / 分类 / 标签） */
const hasAnyFilter = computed(
  () =>
    keyword.value.trim() !== "" ||
    activeType.value !== null ||
    selectedTags.value.length > 0
);

/** 处理子组件发出的 keyword 更新事件（v-model:keyword 的实现） */
function handleUpdateKeyword(val: string) {
  keyword.value = val;
}

/** 点击标签时切换选中 / 取消，并立即触发一次搜索 */
function toggleTag(tag: string) {
  const idx = selectedTags.value.indexOf(tag);
  if (idx === -1) {
    selectedTags.value.push(tag);
  } else {
    selectedTags.value.splice(idx, 1);
  }
  search();
}

/** 一键清空：关键词、分类、已选标签，并重新搜索 */
function resetFilters() {
  keyword.value = "";
  activeType.value = null;
  selectedTags.value = [];
  search();
}

/* =========================================================
 * 四、random-index 简介数据
 *    - 用你已有的 /data/random-index.json 来补充摘要信息
 * ======================================================= */

interface RandomIndexItem {
  title: string;
  path: string;
  excerpt: string;
}

const randomIndex = ref<RandomIndexItem[]>([]);
const randomIndexLoaded = ref(false);

/** 只在第一次搜索时加载 random-index.json，之后复用缓存 */
async function loadRandomIndex() {
  if (randomIndexLoaded.value) return;
  try {
    const res = await fetch("/data/random-index.json");
    const json = await res.json();
    randomIndex.value = Array.isArray(json.pages) ? json.pages : [];
  } catch {
    // 失败就静默：如果加载不到这个文件，就退化为只用 Meili 自己的字段
  } finally {
    randomIndexLoaded.value = true;
  }
}

/* =========================================================
 * 五、taxonomy path → tags 映射
 *    - 把 taxonomyData 中的每个页面 path 映射到它的 tags
 *    - 之后通过 URL 就能反查到标签列表
 * ======================================================= */

const pageTagMap: Record<string, string[]> = {};

/** 将 URL / path 标准化，去掉域名、锚点、查询参数、末尾 / */
function normalizePath(raw: string | undefined | null): string {
  if (!raw) return "/";
  let p = raw.trim();
  // 去掉协议和域名部分
  p = p.replace(/^https?:\/\/[^/]+/, "");
  const h = p.indexOf("#");
  const q = p.indexOf("?");
  const cut = h === -1 ? q : q === -1 ? h : Math.min(h, q);
  if (cut !== -1) p = p.slice(0, cut);
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

/** 从 taxonomyData 中预先构建 path → tags 的映射表 */
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

/** 给定一个 url/path，从映射表中取出对应的 tags 数组 */
function getTagsFromTaxonomy(url?: string | null) {
  const norm = normalizePath(url);
  return pageTagMap[norm] || [];
}

/** 判断某个 url 是否被标记为 nosearch（不参与搜索结果） */
function isNosearchUrl(url?: string) {
  const norm = normalizePath(url);
  return (nosearchPaths as string[]).some(
    (p) => normalizePath(p) === norm
  );
}

/* =========================================================
 * 六、搜索结果增强：拼接 summary 与 tags
 * ======================================================= */

function attachSummary(hit: any) {
  const hitPathNorm = normalizePath(hit.url || hit.path);

  // 1）优先使用 random-index 中的 excerpt 作为摘要
  const match = randomIndex.value.find(
    (it) => normalizePath(it.path) === hitPathNorm
  );
  const summary =
    match?.excerpt?.trim() ||
    hit.summary?.trim() ||
    hit.text?.trim() ||
    "";

  // 2）标签优先使用 taxonomyData 中的 tags，其次用索引里的 tags 字段
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

/** 根据 URL 简单判断这是“人物/概念/势力/地理/历史”哪一类 */
function inferType(hit: any): string | null {
  const url: string = hit.url || "";
  if (url.includes("/world/characters/")) return "character";
  if (url.includes("/world/concepts/"))   return "concept";
  if (url.includes("/world/factions/"))   return "faction";
  if (url.includes("/world/geography/"))  return "geography";
  if (url.includes("/world/history/"))    return "history";
  return null;
}

/** 点击分类按钮：再次点击同一个就取消筛选 */
function setType(v: string | null) {
  activeType.value = v === activeType.value ? null : v;
  search();
}

/* =========================================================
 * 八、主搜索流程
 *    - 调用 MeiliSearch
 *    - 按分类 / nosearch / 页面去重 / 标签筛选做后处理
 * ======================================================= */

async function search() {
  searchedOnce.value = true;
  loading.value = true;
  error.value = null;

  try {
    // 确保 random-index 已经加载
    await loadRandomIndex();

    // 调用 MeiliSearch 的 search API
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

    // a. 按分类过滤（人物/概念/势力等）
    if (activeType.value) {
      hits = hits.filter((h) => inferType(h) === activeType.value);
    }

    // b. 去除 frontmatter:nosearch 的页面
    hits = hits.filter((h) => !isNosearchUrl(h.url || h.path));

    // c. 按页面去重（同一页面不同锚点只保留一条）
    const seen = new Set<string>();
    const unique = hits.filter((h) => {
      const base = (h.url || "").split("#")[0];
      if (seen.has(base)) return false;
      seen.add(base);
      return true;
    });

    // d. 补充 summary / tags
    let enriched = unique.map((h) => attachSummary(h));

    // e. 从当前所有结果中统计出“候选标签列表”
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

    // f. 如果用户选中了标签，则做“标签 AND 过滤”
    if (selectedTags.value.length) {
      enriched = enriched.filter((h) => {
        const tagArr: string[] = Array.isArray(h.tags) ? h.tags : [];
        return selectedTags.value.every((t) => tagArr.includes(t));
      });
    }

    // g. 最终结果赋值给列表
    results.value = enriched;
  } catch (e: any) {
    error.value = e.message || String(e);
  } finally {
    loading.value = false;
  }
}

/* =========================================================
 * 九、初始化：构建标签映射 + 默认执行一次搜索
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

/* 搜索状态提示文字 */
.mfs-status {
  font-size: 0.9rem;
  color: var(--vp-c-text-2, #6b7280);
  margin: 0.5rem 0;
}

/* 搜索结果整体列表 */
.mfs-results {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* 每条结果之间的间距 */
.mfs-result-item + .mfs-result-item {
  margin-top: 0.75rem;
}

/* 单条结果外层链接块 */
.mfs-result-link {
  display: block;
  padding: 0.7rem 0.9rem;
  border-radius: 0.75rem;
  border: 1px solid var(--vp-c-border, #e5e7eb);
  text-decoration: none;
  color: inherit;
}

/* hover 时轻微高亮 */
.mfs-result-link:hover {
  border-color: var(--vp-c-accent, #6366f1);
  background: rgba(99, 102, 241, 0.02);
}

/* 结果标题行 */
.mfs-result-title {
  font-weight: 600;
  margin-bottom: 0.2rem;
}

/* 标题前面的类型标签 [人物]/[概念] */
.mfs-tag {
  display: inline-block;
  margin-right: 0.35rem;
  padding: 0 0.35rem;
  border-radius: 0.5rem;
  background: rgba(99, 102, 241, 0.12);
  color: #4f46e5;
  font-size: 0.75rem;
}

/* 区域 + 标签等元信息 */
.mfs-result-meta {
  font-size: 0.8rem;
  color: var(--vp-c-text-2, #9ca3af);
  margin-bottom: 0.25rem;
}

/* 摘要文本 */
.mfs-result-summary {
  font-size: 0.85rem;
  color: var(--vp-c-text-1, #4b5563);
  margin-bottom: 0.3rem;
}

/* URL 展示行 */
.mfs-result-url {
  font-size: 0.75rem;
  color: var(--vp-c-text-3, #9ca3af);
}
</style>