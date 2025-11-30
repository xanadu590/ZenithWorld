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

          <!-- ⭐ 摘要：优先用 random-index 的 excerpt，组件内部已经填到 hit.summary 里 -->
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
 * 一、MeiliSearch 基本配置（保持你原来的）
 * ======================================================= */

// ！！！这里替换成你自己的配置 ！！！
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
 * 二、分类按钮配置（与你原来完全一致）
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

// type -> 中文显示名
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
 *    作用：给搜索结果补充更好看的“简介”
 * ======================================================= */

interface RandomIndexItem {
  title: string;
  path: string;
  excerpt: string;
}

// 整个 random-index 的数据（来自脚本 gen-random-index.mjs）
const randomIndex = ref<RandomIndexItem[]>([]);
const randomIndexLoaded = ref(false);

/**
 * 统一规范路径格式：
 * - 去掉域名（http://localhost:8080、https://zenithworld.top）
 * - 去掉问号参数 (?q=xxx)
 * - 保留 hash（#主标题），因为你的随机/热门里用到
 * - 去掉末尾的 / （根路径 / 除外）
 */
function normalizePath(raw: string | undefined | null): string {
  if (!raw) return "/";

  let p = raw.trim();

  // 1）去掉协议和域名
  p = p.replace(/^https?:\/\/[^/]+/, "");

  // 2）去掉 query，只保留 hash
  const hashIndex = p.indexOf("#");
  const queryIndex = p.indexOf("?");
  if (queryIndex !== -1 && (hashIndex === -1 || queryIndex < hashIndex)) {
    p = p.slice(0, queryIndex) + (hashIndex !== -1 ? p.slice(hashIndex) : "");
  }

  // 3）去掉末尾 /
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);

  return p || "/";
}

/**
 * 加载 /data/random-index.json
 * - 只加载一次，多次调用会直接 return
 * - 成功时把 data.pages 存入 randomIndex
 */
async function loadRandomIndex() {
  if (randomIndexLoaded.value) return;

  try {
    const res = await fetch("/data/random-index.json");
    const data = await res.json();
    randomIndex.value = Array.isArray(data.pages) ? data.pages : [];
    console.log("[Search] random-index loaded:", randomIndex.value.length);
  } catch (e) {
    console.error("[Search] load random-index failed:", e);
  } finally {
    randomIndexLoaded.value = true;
  }
}

/**
 * 给 Meili 的 hit 补充 summary 字段：
 * - 优先用 random-index 中匹配 path 的 excerpt
 * - 若找不到，就保持原来的 hit.summary / hit.text
 */
function attachSummary<T extends { url?: string; path?: string; summary?: string; text?: string }>(
  hit: T
) {
  const hitPathNorm = normalizePath(hit.url || hit.path);

  const match = randomIndex.value.find(
    (it) => normalizePath(it.path) === hitPathNorm
  );

  const summaryFromIndex = match?.excerpt?.trim() || "";
  const fallback = (hit.summary ?? "").trim() || (hit.text ?? "").trim();

  return {
    ...hit,
    summary: summaryFromIndex || fallback,
  };
}

/* =========================================================
 * 四、类型推断 & 分类按钮逻辑
 * ======================================================= */

// 根据文档的字段 / url 推断类型
function inferType(hit: any): string | null {
  // 如果以后你把 frontmatter 里的 type 抓进索引，这一句会优先使用真正的 type
  if (hit.type) return hit.type as string;

  const url: string = hit.url || "";

  // 根据 url 路径推断
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
 * 五、搜索主流程：对接 Meili + 补充简介
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
      // 不在后端 filter，只是多要一点结果，前端自己筛
      limit: 50,
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

    // 按类型筛选：通过 inferType 判断
    if (activeType.value) {
      hits = hits.filter((hit) => inferType(hit) === activeType.value);
    }

    // ⭐ 给每条结果补 summary（random-index 的 excerpt 优先）
    results.value = hits.map((hit) => attachSummary(hit));
  } catch (e: any) {
    console.error(e);
    error.value = e.message || String(e);
  } finally {
    loading.value = false;
  }
}

/* 可选：组件挂载时先悄悄预加载 random-index，首搜会快一点 */
onMounted(() => {
  loadRandomIndex().catch(() => {
    // 失败就算了，真正搜索时还会再尝试一次
  });
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