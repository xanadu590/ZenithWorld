<!-- wiki/.vuepress/layouts/Layout.vue -->
<script setup lang="ts">
/**
 * 自定义 Layout：覆盖默认目录栏 (TOC)
 * - 让长标题缩略为前 5 个字
 * - 鼠标悬停显示完整标题
 * - 可自定义目录宽度
 */
import { Layout } from "vuepress-theme-hope/client";
import { usePageData } from "@vuepress/client";
import { computed } from "vue";

/* ===== 类型定义 ===== */
type Heading = {
  level: number;
  title: string;
  fullTitle?: string; // 原始标题，用于 tooltip
  text?: string;
  slug: string;
  link: string;
};

/* ===== 获取页面目录 headers ===== */
const page = usePageData();

/** ★ 限制标题长度函数：保留前 n 个字，超出加省略号 */
function truncateTitle(str: string, max = 5) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

/** ★ 提取 headers 并处理显示文本 */
const headings = computed<Heading[]>(() => {
  const raw = (page.value.headers ?? []) as any[];
  return raw.map((h) => {
    const text = String(h?.title ?? h?.text ?? "");
    return {
      level: Number(h?.level ?? 2),
      title: truncateTitle(text, 5), // ← 控制显示字数
      fullTitle: text,               // ← 悬停显示完整标题
      text,
      slug: String(h?.slug ?? ""),
      link: String(h?.link ?? (h?.slug ? `#${h.slug}` : "#")),
    };
  });
});
</script>

<template>
  <Layout>
    <template #toc>
      <aside class="zen-toc" aria-label="此页内容">
        <div class="zen-toc__title">此页内容</div>
        <nav class="zen-toc__body">
          <ol class="zen-toc__list">
            <li
              v-for="h in headings"
              :key="h.slug || h.link"
              :class="'lv-' + (h.level || 2)"
              :title="h.fullTitle" 
            >
              <a :href="h.link">{{ h.title }}</a >
            </li>
          </ol>
        </nav>
      </aside>
    </template>
  </Layout>
</template>

<style scoped>
/* ===== 右侧目录栏整体样式 ===== */
.zen-toc {
  /* ★ 改这里控制宽度（默认 180px）*/
  width: var(--zen-toc-w, 180px);
  max-width: var(--zen-toc-w, 180px);
  position: sticky;
  top: var(--zen-toc-top, 84px);
  padding: 12px;
  border: 1px solid var(--vp-c-border, #e5e7eb);
  border-radius: 12px;
  background: var(--vp-c-bg-elv, #fff);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* ===== 标题文字 ===== */
.zen-toc__title {
  font-weight: 700;
  margin-bottom: 8px;
  font-size: 15px;
  color: var(--c-text, #111);
}

/* ===== 列表整体 ===== */
.zen-toc__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* ===== 每一项 ===== */
.zen-toc__list li {
  margin: 6px 0;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; /* ← 保持单行 */
  transition: color 0.15s ease;
}
.zen-toc__list li:hover {
  color: var(--c-text-accent, #0078e7);
}

/* ===== 层级缩进 ===== */
.zen-toc__list li.lv-3 { padding-left: 12px; }
.zen-toc__list li.lv-4 { padding-left: 22px; }
.zen-toc__list li.lv-5 { padding-left: 30px; }
.zen-toc__list li.lv-6 { padding-left: 38px; }

/* ===== 链接样式 ===== */
.zen-toc__list a {
  text-decoration: none;
  color: inherit;
}

/* ===== 暗色模式 ===== */
html[data-theme='dark'] .zen-toc {
  border-color: #333;
  background: var(--vp-c-bg-soft, #0b0f19);
  color: var(--c-text, #e5e5e5);
}
html[data-theme='dark'] .zen-toc__list li:hover {
  color: #60a5fa;
}

/* ===== 小屏隐藏 ===== */
@media (max-width: 1024px) {
  .zen-toc {
    display: none;
  }
}
</style>