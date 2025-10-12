<!-- wiki/.vuepress/components/RelationCards.vue -->
<template>
  <div class="relation-cards">
    <div
      v-for="(p, i) in data"
      :key="i"
      class="card"
      :title="p.note || `${p.role || ''} ${p.name}`.trim()"
    >
      <!-- ✅ 整卡可点：与 RandomSidebar 一样用 resolveLink + window.location.assign -->
      <div
        class="card-link"
        :class="{ clickable: !!p.link }"
        role="link"
        tabindex="0"
        @click="go(p)"
        @keydown.enter.prevent="go(p)"
      >
        <!-- 第1行：标题（跨两列） -->
        <div class="name">{{ p.name }}</div>

        <!-- 第2行：左图 -->
        < img class="avatar" :src="srcUrl(p.avatar)" :alt="p.name" loading="lazy" />

        <!-- 第2行：右侧信息 -->
        <div class="info">
          <div class="kv" v-if="p.role"><span class="k">别名</span><span class="v">{{ p.role }}</span></div>
          <div class="kv" v-if="p.note"><span class="k">状态</span><span class="v">{{ p.note }}</span></div>
          <div class="kv" v-if="p.extra"><span class="k">备注</span><span class="v">{{ p.extra }}</span></div>
        </div>

        <!-- 第3行：附加文本（跨两列） -->
        <div class="extra" v-if="p.desc">
          {{ p.desc }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePageFrontmatter, withBase } from '@vuepress/client'
import { useRandomPool } from '../composables/useRandomPool'  // ✅ 用它的 resolveLink，和 RandomSidebar 保持一致

type RelationItem = {
  name: string
  role?: string
  avatar: string
  link?: string
  note?: string
  extra?: string
  desc?: string
}

const props = defineProps<{ items?: RelationItem[] }>()

function useFM<T extends Record<string, unknown> = Record<string, unknown>>() {
  try { return usePageFrontmatter<T>() } catch { return ref({} as T) }
}

const fm = useFM<{ relations?: RelationItem[] }>()
const data = computed<RelationItem[]>(() => {
  if (props.items?.length) return props.items
  return (fm.value?.relations || []) as RelationItem[]
})

/** 与 RandomSidebar 一致：内部链接统一用 resolveLink 补 base；外链直接跳转 */
const { resolveLink } = useRandomPool()
const isExternal = (u?: string) => !!u && /^https?:\/\//i.test(u)

function go(p: RelationItem) {
  if (!p.link) return
  const href = isExternal(p.link) ? p.link : resolveLink(p.link) // ★ 关键：统一走 resolveLink
  window.location.assign(href)
}

/** 图片静态资源补 base（以 / 开头时） */
const srcUrl = (u?: string) => (!u ? '' : u.startsWith('/') ? withBase(u) : u)
</script>

<style scoped>
/* ================================================================
   外层网格布局（整页多卡片）
================================================================ */
.relation-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
@media (min-width: 640px) { .relation-cards { grid-template-columns: repeat(5, minmax(0, 1fr)); } }
@media (min-width: 960px) { .relation-cards { grid-template-columns: repeat(6, minmax(0, 1fr)); } }

/* ================================================================
   单张卡片外观
================================================================ */
.card {
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  color: var(--c-text, #111);
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 12px;
  padding: 12px 10px;
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
}
html[data-theme="dark"] .card {
  background: var(--c-bg, #111);
  color: var(--c-text, #e5e5e5);
  border-color: var(--c-border, #333);
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,.06);
  border-color: var(--c-brand, #3eaf7c);
}
html[data-theme="dark"] .card:hover { box-shadow: 0 6px 16px rgba(0,0,0,.35); }

/* ================================================================
   内部三行两列布局（支持参数调节）
================================================================ */
:root {
  --card-title-size: 16px;   /* 标题字号 */
  --card-info-size: 14px;    /* 第二行信息字号 */
  --card-extra-size: 13px;   /* 第三行文字字号 */
  --card-row-gap: 8px;       /* 行间距 */
  --card-col-gap: 12px;      /* 列间距 */
  --card-info-gap: 6px;      /* 第二行行距 */
  --card-extra-gap: 6px;     /* 第三行与上方间距 */
}

.card-link {
  display: grid;
  grid-template-columns: 96px 1fr;
  grid-auto-rows: auto;
  column-gap: var(--card-col-gap);
  row-gap: var(--card-row-gap);
  align-items: start;
  text-decoration: none;
  color: inherit;
}
.card-link.clickable { cursor: pointer; }

/* 第1行：标题（跨两列，单行省略） */
.card-link .name {
  grid-column: 1 / -1;
  grid-row: 1;
  font-weight: 700;
  font-size: var(--card-title-size);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

/* 第2行：左图 */
.card-link .avatar {
  grid-column: 1;
  grid-row: 2;
  width: 96px;
  height: 96px;
  border-radius: 8px;
  object-fit: cover;
  object-position: center;
  margin: 0;
  background: #f2f3f5;
}

/* 第2行：右侧信息 */
.card-link .info {
  grid-column: 2;
  grid-row: 2;
  display: grid;
  grid-auto-rows: min-content;
  row-gap: var(--card-info-gap);
  font-size: var(--card-info-size);
  line-height: 1.6;
}
.card-link .kv { display: grid; grid-template-columns: 48px 1fr; column-gap: 8px; }
.card-link .k { color: var(--c-text, #111); font-weight: 600; }
.card-link .v { color: var(--c-text-light, #65758b); }

/* 第3行：附加文本（跨两列） */
.card-link .extra {
  grid-column: 1 / -1;
  grid-row: 3;
  margin-top: var(--card-extra-gap);
  font-size: var(--card-extra-size);
  line-height: 1.6;
  color: var(--c-text-light, #65758b);
  overflow: hidden;
  text-overflow: ellipsis;
}
html[data-theme="dark"] .card-link .extra { color: #b4bdc6; }
</style>