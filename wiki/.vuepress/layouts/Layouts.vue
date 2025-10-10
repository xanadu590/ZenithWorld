<!-- wiki/.vuepress/layouts/Layout.vue -->
<script setup lang="ts">
/**
 * 自定义 Layout：只覆盖 #toc 区域（全站生效）
 * - 使用 theme-hope 原始 Layout 外壳
 * - 自己渲染目录（可控制宽度、省略、缩进）
 */
import { Layout } from "vuepress-theme-hope/client";
import { usePageData } from "@vuepress/client";
import { computed } from "vue";

/* ===== 定义 Heading 类型，用于类型安全 ===== */
type Heading = {
  level: number;
  title: string;
  text?: string;
  slug: string;
  link: string;
};

/* ===== 获取当前页的 headers 并标准化 ===== */
const page = usePageData();

const headings = computed<Heading[]>(() => {
  const raw = (page.value.headers ?? []) as any[];
  return raw.map((h) => ({
    level: Number(h?.level ?? 2),
    title: String(h?.title ?? h?.text ?? ""),
    text: String(h?.text ?? h?.title ?? ""),
    slug: String(h?.slug ?? ""),
    link: String(h?.link ?? (h?.slug ? `#${h.slug}` : "#")),
  }));
});
</script>

<template>
  <Layout>
    <!-- 覆盖默认 TOC 区域 -->
    <template #toc>
      <aside class="zen-toc" aria-label="此页内容">
        <div class="zen-toc__title">此页内容</div>
        <nav class="zen-toc__body">
          <ol class="zen-toc__list">
            <li
              v-for="h in headings"
              :key="h.slug || h.link"
              :class="'lv-' + (h.level || 2)"
            >
              <a :href="h.link">{{ h.title || h.text }}</a >
            </li>
          </ol>
        </nav>
      </aside>
    </template>
  </Layout>
</template>

<style scoped>
/* ===== 目录外观与宽度控制 ===== */

/* 整个目录容器 */
.zen-toc {
  width: var(--zen-toc-w, 180px);     /* ← 改这里控制宽度 (160~220px) */
  max-width: var(--zen-toc-w, 180px);
  position: sticky;
  top: var(--zen-toc-top, 84px);      /* ← 改这里控制吸顶距离 */
  padding: 12px;
  border: 1px solid var(--vp-c-border, #e5e7eb);
  border-radius: 12px;
  background: var(--vp-c-bg-elv, #fff);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* 标题 */
.zen-toc__title {
  font-weight: 700;
  margin-bottom: 8px;
  font-size: 15px;
  color: var(--c-text, #111);
}

/* 列表整体 */
.zen-toc__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* 每一项 */
.zen-toc__list li {
  margin: 6px 0;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; /* ← 想换行就改 normal，并加 word-break: break-word; */
  transition: color 0.15s ease;
}
.zen-toc__list li:hover {
  color: var(--c-text-accent, #0078e7);
}

/* 层级缩进 */
.zen-toc__list li.lv-3 { padding-left: 12px; }
.zen-toc__list li.lv-4 { padding-left: 22px; }
.zen-toc__list li.lv-5 { padding-left: 30px; }
.zen-toc__list li.lv-6 { padding-left: 38px; }

/* 链接样式 */
.zen-toc__list a {
  text-decoration: none;
  color: inherit;
}

/* 仅桌面端显示 */
@media (max-width: 1024px) {
  .zen-toc {
    display: none;
  }
}
</style>