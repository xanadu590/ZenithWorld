// .vuepress/components/search/useWikiSearch.ts
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
} from "vue";

// 由 VuePress 生成的临时文件：标记哪些页面不参与搜索
// @ts-ignore
import { nosearchPaths } from "@temp/nosearch/nosearchPaths.js";
// 由自定义 taxonomy 插件生成：包含每个页面的分类与标签
// @ts-ignore
import { taxonomyData } from "@temp/wiki-taxonomy/data.js";

/**
 * 把所有“百科搜索逻辑”集中在这里：
 * - Meili 查询
 * - 分类 / 标签筛选
 * - random-index 摘要
 * - recommended-pages 更新时间
 * - Twikoo 真实访问量 viewCount
 * - 实体信息（姓名 / 简称 / 别名等）
 * - ESC 快捷键
 */
export function useWikiSearch() {
  /* =========================================================
   * 一、MeiliSearch 连接配置
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

  /** 排序方式：relevance / updatedAt / viewCount（真实访问量） */
  const sortMode = ref<"relevance" | "updatedAt" | "viewCount">("relevance");

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
   * 三、标签筛选状态
   * ======================================================= */

  const availableTags = ref<string[]>([]);
  const selectedTags = ref<string[]>([]);

  /** 候选标签区域内显示的标签：从 availableTags 中扣掉已选中的 */
  const visibleTags = computed(() =>
    availableTags.value.filter((tag) => !selectedTags.value.includes(tag))
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
   * 四、random-index 摘要数据
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
   * 五、recommended-pages：用于拿“更新时间”（updatedAt）
   *    - 来源：/data/recommended-pages.json
   *    - 字段：lastUpdated（git 时间）
   * ======================================================= */

  interface MetaIndexItem {
    title: string;
    path: string;
    lastUpdated: number | null;
    hotScore: number; // 不再用于 viewCount，只保留字段
  }

  const metaIndex = ref<MetaIndexItem[]>([]);
  const metaIndexLoaded = ref(false);

  /** path → { updatedAt } 映射表 */
  const pageMetaMap: Record<string, { updatedAt: number | null }> = {};

  /** 将 URL / path 标准化，去掉域名、锚点、查询参数、末尾 / */
  function normalizePath(raw: string | undefined | null): string {
    if (!raw) return "/";
    let p = String(raw).trim();
    // 去掉协议和域名部分
    p = p.replace(/^https?:\/\/[^/]+/, "");
    const h = p.indexOf("#");
    const q = p.indexOf("?");
    const cut = h === -1 ? q : q === -1 ? h : Math.min(h, q);
    if (cut !== -1) p = p.slice(0, cut);
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p || "/";
  }

  async function loadMetaIndex() {
    if (metaIndexLoaded.value) return;
    try {
      const res = await fetch("/data/recommended-pages.json");
      if (!res.ok) {
        metaIndexLoaded.value = true;
        return;
      }
      const list = (await res.json()) as MetaIndexItem[];
      metaIndex.value = list;

      for (const item of list) {
        const norm = normalizePath(item.path);
        pageMetaMap[norm] = {
          updatedAt: item.lastUpdated ?? null,
        };
      }
    } catch {
      // 忽略
    } finally {
      metaIndexLoaded.value = true;
    }
  }

  function getMetaForUrl(url?: string | null) {
    const norm = normalizePath(url || "");
    return pageMetaMap[norm];
  }

  /* =========================================================
   * 六、Twikoo 真实访问量：用于 viewCount 排序
   *    - 来源：https://comment.zenithworld.top/api/popular
   *    - 字段：path, pv
   * ======================================================= */

  const VISIT_API_BASE = "https://comment.zenithworld.top";

  interface PopularItem {
    title: string;
    path: string;
    pv: number;
  }

  /** path → 真实访问量 pv 映射表 */
  const visitMap: Record<string, number> = {};
  const visitLoaded = ref(false);

  /**
   * 读取 Twikoo 的热门接口，构建全局访问量表：
   *   - days：统计时间范围，这里给一个比较大的数字，例如 365 天
   *   - limit：取前多少条热门页面，这里给大一些，比如 2000
   */
  async function loadVisitStats() {
    if (visitLoaded.value) return;
    try {
      const url = `${VISIT_API_BASE}/api/popular?days=365&limit=2000`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.ok || !Array.isArray(data.items)) {
        visitLoaded.value = true;
        return;
      }

      const items = data.items as PopularItem[];

      for (const it of items) {
        const norm = normalizePath(it.path || "/");
        const pv = it.pv ?? 0;
        visitMap[norm] = (visitMap[norm] ?? 0) + pv;
      }
    } catch {
      // 忽略错误，没拿到访问量就当 0 处理
    } finally {
      visitLoaded.value = true;
    }
  }

  /** 给定一个 url，从 visitMap 中取出真实 pv 作为 viewCount */
  function getVisitForUrl(url?: string | null): number {
    const norm = normalizePath(url || "");
    return visitMap[norm] ?? 0;
  }

  /* =========================================================
   * 七、taxonomy path → tags 映射
   * ======================================================= */

  const pageTagMap: Record<string, string[]> = {};

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
   * 八、实体信息 wiki-entity-meta：姓名 / 简称 / 别名 等
   *    - 来源：/data/wiki-entity-meta.json
   * ======================================================= */

  interface EntityMetaItem {
    path: string;
    name?: string;
    alias?: string;
    shortName?: string;
    enName?: string;
    title?: string;
  }

  const entityMetaLoaded = ref(false);
  const entityMetaMap: Record<string, EntityMetaItem> = {};

  async function loadEntityMeta() {
    if (entityMetaLoaded.value) return;
    try {
      const res = await fetch("/data/wiki-entity-meta.json");
      if (!res.ok) {
        entityMetaLoaded.value = true;
        return;
      }
      const json = await res.json();
      const items: EntityMetaItem[] = Array.isArray(json.items)
        ? json.items
        : [];

      for (const item of items) {
        const norm = normalizePath(item.path);
        entityMetaMap[norm] = item;
      }
    } catch {
      // 忽略错误：没有这个文件就当没有实体信息
    } finally {
      entityMetaLoaded.value = true;
    }
  }

  function getEntityMetaForUrl(url?: string | null): EntityMetaItem | undefined {
    const norm = normalizePath(url || "");
    return entityMetaMap[norm];
  }

  /* =========================================================
   * 九、搜索结果增强：summary + tags + updatedAt + viewCount(pv) + entityMeta
   * ======================================================= */

  function attachSummaryAndMeta(hit: any) {
    const hitPathNorm = normalizePath(hit.url || hit.path);

    // 1）摘要
    const match = randomIndex.value.find(
      (it) => normalizePath(it.path) === hitPathNorm
    );
    const summary =
      match?.excerpt?.trim() ||
      hit.summary?.trim() ||
      hit.text?.trim() ||
      "";

    // 2）标签
    const tagsFromTax = getTagsFromTaxonomy(hit.url || hit.path);

    let fallbackTags: string[] = [];
    if (Array.isArray(hit.tags)) {
      fallbackTags = hit.tags.map((t: any) => String(t).trim());
    } else if (typeof hit.tags === "string") {
      fallbackTags = [hit.tags.trim()];
    }

    // 3）更新时间 / 访问量
    const meta = getMetaForUrl(hit.url || hit.path);
    const updatedAt = meta?.updatedAt ?? hit.updatedAt ?? null;
    const viewCount = getVisitForUrl(hit.url || hit.path) ?? hit.viewCount ?? 0;

    // 4）实体信息（姓名/简称/别名等）
    const entityMeta = getEntityMetaForUrl(hit.url || hit.path);

    return {
      ...hit,
      summary,
      tags: tagsFromTax.length ? tagsFromTax : fallbackTags,
      updatedAt,
      viewCount,
      entityMeta,
    };
  }

  /* =========================================================
   * 十、类型推断 & 分类按钮逻辑
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

  /** 修改排序方式：relevance / updatedAt / viewCount */
  function setSort(mode: "relevance" | "updatedAt" | "viewCount") {
    if (sortMode.value === mode) return;
    sortMode.value = mode;
    search();
  }

  /* =========================================================
   * 十一、主搜索流程（Meili + 前端排序）
   * ======================================================= */

  async function search() {
    searchedOnce.value = true;
    loading.value = true;
    error.value = null;

    try {
      // 确保 random-index、recommended-pages、Twikoo 访问量、实体信息 都已加载
      await Promise.all([
        loadRandomIndex(),
        loadMetaIndex(),
        loadVisitStats(),
        loadEntityMeta(),
      ]);

      // 不传 sort，保持 Meili 默认相关度排序
      const body: any = {
        q: keyword.value,
        limit: 500,
      };

      // 调用 MeiliSearch 的 search API
      const res = await fetch(`${host}/indexes/${indexUid}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
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

      // d. 补充 summary / tags / updatedAt / viewCount(pv) / entityMeta
      let enriched = unique.map((h) => attachSummaryAndMeta(h));

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

      // g. 根据 sortMode 做前端排序
      if (sortMode.value === "updatedAt") {
        enriched.sort(
          (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
        );
      } else if (sortMode.value === "viewCount") {
        enriched.sort(
          (a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)
        );
      }
      // relevance：不动，保持 Meili 的默认相关度顺序

      // h. 最终结果赋值给列表
      results.value = enriched;
    } catch (e: any) {
      error.value = e.message || String(e);
    } finally {
      loading.value = false;
    }
  }

  /* =========================================================
   * 十二、初始化 + 全局 ESC 快捷键
   * ======================================================= */

  function handleEsc(e: KeyboardEvent) {
    if (e.key === "Escape") {
      resetFilters();
    }
  }

  // composable 内部的生命周期钩子，会在 <script setup> 中被正确触发
  onMounted(() => {
    buildPageTagMap();
    // 首次进来默认搜索一次，填充结果 + 标签候选
    search().catch(() => {});
    window.addEventListener("keydown", handleEsc);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleEsc);
  });

  /* =========================================================
   * 对外暴露给组件使用的状态 & 方法
   * ======================================================= */

  return {
    // 状态
    keyword,
    activeType,
    typeOptions,
    typeLabelMap,
    availableTags,
    selectedTags,
    visibleTags,
    hasAnyFilter,
    results,
    loading,
    error,
    searchedOnce,
    sortMode,
    // 方法
    handleUpdateKeyword,
    toggleTag,
    resetFilters,
    setType,
    setSort,
    search,
    inferType,
  };
}
