<template>
  <div class="meili-filter-search">
    <!-- 搜索输入框 -->
    <div class="mfs-bar">
      <input
        v-model="keyword"
        class="mfs-input"
        type="search"
        placeholder="搜索角色 / 概念 / 势力 / 地理 / 历史 / 力量体系……"
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

/* =========================================================
 * 一、MeiliSearch 基本配置
 * ======================================================= */

const host = "http://47.99.85.126:7700"; // 以后你有 https 域名再改
const indexUid = "wiki";
const apiKey =
  "77530e145cb0aad96892ce647ec783fe835f24233e8dbcb653ac175b041e31cf"; // 千万不要填 Master Key

const keyword = ref("");
const activeType = ref<string | null>(null);
const results = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchedOnce = ref(false);

/* =========================================================
 * 二、分类按钮配置
 * ======================================================= */

const typeOptions: { value: string | null; label: string }[] = [
  { value: null, label: "全部" },
  { value: "character", label: "人物" },
  { value: "concept", label: "概念" },
  { value: "faction", label: "势力" },
  { value: "geography", label: "地理" },
  { value: "history", label: "历史" },
  { value: "power", label: "力量体系" },
];

const typeLabelMap: Record<string, string> = {
  character: "人物",
  concept: "概念",
  faction: "势力",
  geography: "地理",
  history: "历史",
  power: "力量体系",
};

/* =========================================================
 * 三、random-index 简介数据：接入 /data/random-index.json
 * ======================================================= */

interface RandomIndexItem {
  title: string;
  path: string;
  excerpt: string;
}

const randomIndex = ref<RandomIndexItem[]>([]);
const randomIndexLoaded = ref(false);

/**
 * 统一规范路径格式：
 *  - 去掉协议和域名
 *  - 去掉 query (?...) 和 hash (#...)
 *  - 去掉末尾的 / （根路径 / 除外）
 *
 * 目的：
 *   让这些地址视为同一页：
 *   - /docs/foo/bar.html
 *   - https://zenithworld.top/docs/foo/bar.html
 *   - /docs/foo/bar.html#背景故事
 *   - /docs/foo/bar.html?q=xx#标题
 */
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

/**
 * 加载 /data/random-index.json
 * - 只加载一次，多次调用会直接 return
 */
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
 * 给 Meili 的 hit 补充 summary 字段：
 *  - 优先：random-index 中匹配 path 的 excerpt
 *  - 其次：hit.summary（如果 Meili 自己已经有）
 *  - 最后：hit.text（高亮片段）
 */
function attachSummary<
  T extends { url?: string; path?: string; summary?: string; text?: string }
>(hit: T) {
  const hitPathNorm = normalizePath(hit.url || hit.path);

  const match = randomIndex.value.find(
    (it) => normalizePath(it.path) === hitPathNorm
  );

  const summaryFromIndex = match?.excerpt?.trim() || "";
  const fallback = (hit.summary ?? "").trim() || (hit.text ?? "").trim();
  const finalSummary = summaryFromIndex || fallback;

  // 调试日志：可以在控制台看到每条命中的情况
  console.log("[Search] attachSummary", {
    url: hit.url,
    norm: hitPathNorm,
    hasIndex: !!summaryFromIndex,
    summaryFromIndex,
    fallback,
  });

  return {
    ...hit,
    summary: finalSummary,
  };
}

/* =========================================================
 * 四、类型推断 & 分类按钮逻辑
 * ======================================================= */

function inferType(hit: any): string | null {
  if (hit.type) return hit.type as string;

  const url: string = hit.url || "";

  if (url.includes("/world/characters/")) return "character";
  if (url.includes("/world/concepts/")) return "concept";
  if (url.includes("/world/factions/")) return "faction";
  if (url.includes("/world/geography/")) return "geography";
  if (url.includes("/world/history/")) return "history";
  if (url.includes("/world/power/")) return "power";

  return null;
}

function setType(val: string | null) {
  // 再点一下同一个按钮可以“取消筛选”
  activeType.value = val === activeType.value ? null : val;
  search();
}

/* =========================================================
 * 五、搜索主流程：对接 Meili + 去重 + 补充简介
 * ======================================================= */

async function search() {
  searchedOnce.value = true;
  loading.value = true;
  error.value = null;

  try {
    // 确保 random-index 已经加载（失败也没关系，只是少了一层简介来源）
    await loadRandomIndex();

    const body: any = {
      q: keyword.value,
      limit: 50, // 不在后端 filter，多拿一点结果，前端自己筛
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

    // 1）前端按类型筛选
    if (activeType.value) {
      hits = hits.filter((hit) => inferType(hit) === activeType.value);
    }

    // 2）按“页面”去重：去掉同一文档的 #基本信息 / #背景故事 / #xxx
    const seenPages = new Set<string>();
    hits = hits.filter((hit) => {
      const rawUrl: string = hit.url || "";
      const baseUrl = rawUrl.split("#")[0]; // 去掉 hash，只看页面本身
      if (seenPages.has(baseUrl)) return false;
      seenPages.add(baseUrl);
      return true;
    });

    // 3）给每条结果补 summary（random-index 的 excerpt 优先）
    results.value = hits.map((hit) => attachSummary(hit));
  } catch (e: any) {
    console.error(e);
    error.value = e.message || String(e);
  } finally {
    loading.value = false;
  }
}

/* 组件挂载时预加载 random-index，让第一次搜索更顺滑 */
onMounted(() => {
  loadRandomIndex().catch(() => {});
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
  margin-bottom: 0.75rem;
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