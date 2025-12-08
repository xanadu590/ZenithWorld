<!-- docs/.vuepress/components/search/SearchResultsList.vue -->
<template>
  <ul class="mfs-results" v-if="results.length">
    <li
      v-for="hit in results"
      :key="hitKey(hit)"
      class="mfs-result-item"
      :class="{ 'is-open': isExpanded(hit) }"
    >
      <a :href="hit.url" class="mfs-result-link">
        <!-- 头部：标题 + 展开按钮 -->
        <div class="mfs-result-head">
          <div class="mfs-result-title">
            <!-- 类型标签 -->
            <span v-if="inferType(hit)" class="mfs-tag">
              [{{ typeLabelMap[inferType(hit)!] || inferType(hit) }}]
            </span>
            <!-- ✅ 标题高亮 -->
            <span
              class="mfs-result-title-text"
              v-html="highlight(hit.title || hit.hierarchy_lvl1 || hit.hierarchy_lvl0 || '(无标题)')"
            ></span>
          </div>

          <button
            type="button"
            class="mfs-toggle-btn"
            @click.stop.prevent="toggleHit(hit)"
          >
            {{ isExpanded(hit) ? "收起详情" : "展开详情" }}
          </button>
        </div>

        <!-- 折叠态：一行摘要，高亮 + 截断 -->
        <div
          v-if="!isExpanded(hit)"
          class="mfs-result-summary mfs-result-summary--collapsed"
          v-html="highlight(shortSummary(hit.summary || hit.text || '（暂无摘要）'))"
        ></div>

        <!-- 展开态：完整摘要 + meta -->
        <div v-else class="mfs-result-detail">
          <div
            class="mfs-result-summary-full"
            v-html="highlight(hit.summary || hit.text || '（暂无摘要）')"
          ></div>

          <div class="mfs-result-meta-line">
            <span v-if="inferType(hit)">
              类型：{{ typeLabelMap[inferType(hit)!] || inferType(hit) }}
            </span>
            <span v-if="hit.region">
              · 区域：{{ hit.region }}
            </span>
            <span v-if="hit.tags?.length">
              · 标签：{{ hit.tags.join(" / ") }}
            </span>
            <span v-if="hit.updatedAt">
              · 更新：{{ new Date(hit.updatedAt).toLocaleDateString() }}
            </span>
            <span v-if="hit.viewCount">
              · 访问：{{ hit.viewCount }} 次
            </span>

            <!-- ✅ 新增：实体信息（从 wiki-entity-meta.json 来） -->
            <span v-if="hit.entityMeta?.name">
              · 姓名：{{ hit.entityMeta.name }}
            </span>
            <span v-if="hit.entityMeta?.shortName">
              · 简称：{{ hit.entityMeta.shortName }}
            </span>
            <span v-if="hit.entityMeta?.alias">
              · 别名：{{ hit.entityMeta.alias }}
            </span>
            <span v-if="hit.entityMeta?.enName">
              · 英文名：{{ hit.entityMeta.enName }}
            </span>
            <span v-if="hit.entityMeta?.title">
              · 称号：{{ hit.entityMeta.title }}
            </span>
          </div>

          <div class="mfs-result-url">
            {{ hit.url }}
          </div>
        </div>
      </a>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  results: any[];
  typeLabelMap: Record<string, string>;
  inferType: (hit: any) => string | null;
  keyword: string; // ✅ 用于高亮的关键字
}>();

const expandedKeys = ref<string[]>([]);

function hitKey(hit: any): string {
  return hit.id || hit.objectID || hit.url || JSON.stringify(hit);
}

function isExpanded(hit: any): boolean {
  const key = hitKey(hit);
  return expandedKeys.value.includes(key);
}

function toggleHit(hit: any) {
  const key = hitKey(hit);
  const list = expandedKeys.value;
  const idx = list.indexOf(key);
  expandedKeys.value =
    idx === -1 ? [...list, key] : list.filter((k) => k !== key);
}

function shortSummary(text: string, maxLen = 60): string {
  const t = (text || "").trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen) + "…";
}

/* ========= 关键字高亮 ========= */

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 用 <mark> 包住匹配到的关键字：
 * - 忽略大小写
 * - keyword 为空时直接返回原文
 */
function highlight(text: string): string {
  const kw = (props.keyword || "").trim();
  if (!kw) return text || "";

  try {
    const pattern = escapeRegExp(kw);
    const re = new RegExp(pattern, "gi");
    return (text || "").replace(
      re,
      (match) => `<mark class="mfs-hl">${match}</mark>`
    );
  } catch {
    // 正则构造失败就直接返回原文
    return text || "";
  }
}
</script>

<style scoped>
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

/* 结果卡片头部：标题 + 展开按钮一行 */
.mfs-result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

/* 结果标题行本体 */
.mfs-result-title {
  font-weight: 600;
}

/* 展开按钮 */
.mfs-toggle-btn {
  border: 1px solid var(--vp-c-border, #d0d7de);
  background: #f9fafb;
  border-radius: 999px;
  font-size: 0.8rem;
  padding: 0.2rem 0.7rem;
  cursor: pointer;
  white-space: nowrap;
}

.mfs-toggle-btn:hover {
  background: #e5e7eb;
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

/* 折叠态摘要：单行 + 省略号 */
.mfs-result-summary--collapsed {
  max-height: 1.4em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 展开态整体块 */
.mfs-result-detail {
  margin-top: 0.25rem;
}

/* 展开态 meta 信息一行 */
.mfs-result-meta-line {
  margin-top: 0.2rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-2, #9ca3af);
}

/* 展开态全文摘要 */
.mfs-result-summary-full {
  font-size: 0.85rem;
  color: var(--vp-c-text-1, #4b5563);
  margin-top: 0.2rem;
}

/* 公共 URL 行样式 */
.mfs-result-url {
  font-size: 0.75rem;
  color: var(--vp-c-text-3, #9ca3af);
  margin-top: 0.25rem;
}

/* ✅ 高亮 mark 样式（用 v-html 渲染，所以用 v-deep） */
::v-deep(.mfs-hl) {
  background: rgba(250, 204, 21, 0.4); /* 柔一点的黄底 */
  padding: 0 2px;
  border-radius: 2px;
}
</style>
