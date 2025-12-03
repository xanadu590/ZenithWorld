<template>
  <div class="taxonomy-list">
    <!-- 分类大框区 -->
    <section class="tax-section">
      <h2>按分类查看</h2>

      <div class="tax-card-grid">
        <article
          v-for="cat in groupedCategories"
          :key="cat.name"
          class="tax-card"
        >
          <header class="tax-card-header">
            <h3 class="tax-card-title">{{ cat.name }}</h3>
            <span class="tax-card-count">共 {{ cat.total }} 条</span>
          </header>

          <div class="tax-card-body">
            <div
              v-for="group in cat.groups"
              :key="group.label"
              class="tax-group"
            >
              <h4 class="tax-group-title">
                {{ group.label }}
                <span class="tax-group-count">({{ group.pages.length }})</span>
              </h4>

              <div class="tax-group-links">
                <RouterLink
                  v-for="page in group.pages"
                  :key="page.path"
                  :to="page.path"
                  class="tax-link"
                >
                  {{ page.title }}
                </RouterLink>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- 原来的“按标签查看”区 -->
    <section v-if="showTags" class="tax-section">
      <h2>按标签查看</h2>

      <div
        v-for="tag in orderedTags"
        :key="tag.name"
        class="tax-tag-block"
      >
        <h3 class="tax-title">
          {{ tag.name }}
          <span class="tax-count">（{{ tag.entry.pages.length }}）</span>
        </h3>

        <ul class="tax-pages">
          <li v-for="page in tag.entry.pages" :key="page.path">
            <RouterLink :to="page.path">
              {{ page.title }}
              <span class="tax-label">[{{ page.category }}]</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// SSR 阶段直接从 temp 导入数据和布局
// @ts-ignore
import { taxonomyData } from "@temp/wiki-taxonomy/data.js";
// @ts-ignore
import { taxonomyLayout } from "@temp/wiki-taxonomy/layout.js";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    showTags?: boolean;
  }>(),
  {
    showTags: true,
  },
);

// 五大分类的固定顺序（中文）
const CATEGORY_ORDER = ["人物", "组织", "地点", "概念", "事件"];

type AnyTaxData = any;

// 根据配置生成“按分类 → 小组”的结构
const groupedCategories = computed(() => {
  const cats = (taxonomyData as AnyTaxData).categories || {};
  const layout = (taxonomyLayout as AnyTaxData) || {};

  const result: {
    name: string;
    total: number;
    groups: { label: string; pages: AnyTaxData[] }[];
  }[] = [];

  for (const name of CATEGORY_ORDER) {
    const entry = cats[name];
    if (!entry) continue;

    const layoutConf = layout[name] || {};
    const groupsConf = Array.isArray(layoutConf.groups)
      ? layoutConf.groups
      : [];

    let remaining = [...entry.pages] as AnyTaxData[];

    const groups: { label: string; pages: AnyTaxData[] }[] = [];

    // 先按配置分组
    for (const g of groupsConf) {
      const label = g.label as string;
      const tagList: string[] = Array.isArray(g.tags) ? g.tags : [];

      if (!label || tagList.length === 0) continue;

      const tagSet = new Set(tagList);

      const match: AnyTaxData[] = [];
      const rest: AnyTaxData[] = [];

      for (const page of remaining) {
        const pageTags: string[] = Array.isArray(page.tags) ? page.tags : [];
        const hit = pageTags.some((t) => tagSet.has(t));
        if (hit) match.push(page);
        else rest.push(page);
      }

      if (match.length > 0) {
        groups.push({ label, pages: match });
      }

      remaining = rest;
    }

    // 剩余条目归入“其他XX”组
    if (remaining.length > 0) {
      const othersLabel =
        layoutConf.othersLabel || `其他${name}`;
      groups.push({
        label: othersLabel,
        pages: remaining,
      });
    }

    const total = entry.pages.length;

    result.push({
      name,
      total,
      groups,
    });
  }

  return result;
});

// “按标签查看”区沿用原来的逻辑
const orderedTags = computed(() => {
  const tags = (taxonomyData as AnyTaxData).tags || {};
  const list = Object.keys(tags).map((name) => ({
    name,
    entry: tags[name],
  }));

  list.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  return list;
});
</script>

<style scoped>
.taxonomy-list {
  margin: 1.5rem 0;
}

.tax-section + .tax-section {
  margin-top: 2rem;
}

/* 分类大框网格 */
.tax-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.tax-card {
  border: 1px solid var(--c-border, #ddd);
  border-radius: 8px;
  padding: 0.75rem 0.9rem;
  background: var(--c-bg-light, #fafafa);
}

.tax-card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.4rem;
}

.tax-card-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}

.tax-card-count {
  font-size: 0.85rem;
  color: var(--text-color-secondary, #888);
}

.tax-group + .tax-group {
  margin-top: 0.4rem;
}

.tax-group-title {
  margin: 0 0 0.1rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.tax-group-count {
  font-size: 0.8rem;
  color: var(--text-color-secondary, #aaa);
}

.tax-group-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.5rem;
  font-size: 0.9rem;
}

.tax-link {
  text-decoration: underline;
  text-decoration-thickness: 1px;
}

/* “按标签查看”区 */
.tax-tag-block + .tax-tag-block {
  margin-top: 1rem;
}

.tax-title {
  margin: 0.75rem 0 0.25rem;
  font-size: 1.05rem;
  font-weight: 600;
}

.tax-count {
  font-size: 0.9rem;
  color: var(--text-color-secondary, #888);
}

.tax-pages {
  margin: 0 0 0.5rem 1.25rem;
  padding: 0;
  list-style: disc;
  font-size: 0.95rem;
}

.tax-pages li + li {
  margin-top: 0.15rem;
}

.tax-label {
  margin-left: 0.25rem;
  font-size: 0.85em;
  color: var(--text-color-secondary, #888);
}
</style>