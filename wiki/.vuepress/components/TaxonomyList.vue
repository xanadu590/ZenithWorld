<template>
  <div class="taxonomy-list">
    <!-- 分类部分 -->
    <section class="tax-section">
      <h2>按分类查看</h2>

      <div
        v-for="cat in orderedCategories"
        :key="cat.name"
        class="tax-block"
      >
        <h3 class="tax-title">
          {{ cat.name }}
          <span class="tax-count">（{{ cat.entry.pages.length }}）</span>
        </h3>

        <ul class="tax-pages">
          <li v-for="page in cat.entry.pages" :key="page.path">
            <RouterLink :to="page.path">
              {{ page.title }}
            </RouterLink>
          </li>
        </ul>
      </div>
    </section>

    <!-- 标签部分（可选） -->
    <section v-if="showTags" class="tax-section">
      <h2>按标签查看</h2>

      <div
        v-for="tag in orderedTags"
        :key="tag.name"
        class="tax-block"
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
// 关键点：直接从 @temp 导入，保证 SSR 阶段就有数据
// @ts-ignore
import { taxonomyData } from "@temp/wiki-taxonomy/data.js";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    showTags?: boolean;
  }>(),
  {
    showTags: true,
  },
);

// 固定的中文分类顺序
const CATEGORY_ORDER = ["人物", "组织", "地点", "概念", "事件"];

const orderedCategories = computed(() => {
  const cats = (taxonomyData as any).categories || {};

  const result: { name: string; entry: any }[] = [];

  // 先按固定顺序输出五大类
  for (const name of CATEGORY_ORDER) {
    if (cats[name]) {
      result.push({ name, entry: cats[name] });
    }
  }

  // 其它意外分类（如果有）排在后面
  for (const name of Object.keys(cats)) {
    if (!CATEGORY_ORDER.includes(name)) {
      result.push({ name, entry: cats[name] });
    }
  }

  return result;
});

const orderedTags = computed(() => {
  const tags = (taxonomyData as any).tags || {};
  const list = Object.keys(tags).map((name) => ({
    name,
    entry: tags[name],
  }));

  // 简单按名称排序；你以后可以改成按数量排序
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