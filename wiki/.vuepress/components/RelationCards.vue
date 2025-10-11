<template>
  <div class="relation-cards">
    <div
      v-for="(p, i) in data"
      :key="i"
      class="card card-grid"
      :title="p.note || `${p.role || ''} ${p.name}`.trim()"
    >
      <!-- 第 1 行：标题 -->
      <div class="card-title">{{ p.name }}</div>

      <!-- 第 2 行：左图 -->
      <img class="avatar" :src="srcUrl(p.avatar)" :alt="p.name" loading="lazy" />

      <!-- 第 2 行：右侧信息 -->
      <div class="card-info">
        <div class="kv" v-if="p.role"><span class="k">别名</span><span class="v">{{ p.role }}</span></div>
        <div class="kv" v-if="p.note"><span class="k">状态</span><span class="v">{{ p.note }}</span></div>
        <div class="kv" v-if="p.extra"><span class="k">备注</span><span class="v">{{ p.extra }}</span></div>
      </div>

      <!-- 第 3 行：附加文本 -->
      <div class="card-extra" v-if="p.desc">
        {{ p.desc }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePageFrontmatter, withBase } from '@vuepress/client'

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

/** 安全获取 frontmatter：防止 useClientData() without provider */
function useFM<T extends Record<string, unknown> = Record<string, unknown>>() {
  try {
    return usePageFrontmatter<T>()
  } catch {
    return ref({} as T)
  }
}

const fm = useFM<{ relations?: RelationItem[] }>()
const data = computed<RelationItem[]>(() => {
  if (props.items?.length) return props.items
  return (fm.value?.relations || []) as RelationItem[]
})

/** 图片与链接统一加 base 前缀 */
const srcUrl = (u?: string) => (!u ? '' : u.startsWith('/') ? withBase(u) : u)
</script>

<style scoped>
/* =================== 外层网格 =================== */
.relation-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

@media (min-width: 640px) {
  .relation-cards { grid-template-columns: repeat(5, minmax(0, 1fr)); }
}
@media (min-width: 960px) {
  .relation-cards { grid-template-columns: repeat(6, minmax(0, 1fr)); }
}

/* =================== 卡片容器 =================== */
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
  box-shadow: 0 6px 16px rgba(0, 0, 0, .06);
  border-color: var(--c-brand, #3eaf7c);
}

html[data-theme="dark"] .card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, .35);
}

/* =================== 三行两列布局 =================== */
.card-grid {
  display: grid;
  grid-template-columns: 96px 1fr;
  grid-auto-rows: auto;
  row-gap: var(--card-row-gap, 8px);
  column-gap: var(--card-col-gap, 12px);
  align-items: start;
}

/* =================== 第 1 行：标题 =================== */
.card-title {
  grid-column: 1 / -1;
  grid-row: 1;
  font-weight: 700;
  font-size: var(--card-title-size, 16px);
  line-height: 1.3;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* =================== 第 2 行：左图 =================== */
.avatar {
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

/* =================== 第 2 行：右侧信息 =================== */
.card-info {
  grid-column: 2;
  grid-row: 2;
  display: grid;
  grid-auto-rows: min-content;
  row-gap: var(--card-info-gap, 6px);
  font-size: var(--card-info-size, 14px);
  line-height: 1.6;
}

.card-info .kv {
  display: grid;
  grid-template-columns: 48px 1fr;
  column-gap: 8px;
}
.card-info .k {
  color: var(--c-text, #111);
  font-weight: 600;
}
.card-info .v {
  color: var(--c-text-light, #65758b);
}

/* =================== 第 3 行：附加文本 =================== */
.card-extra {
  grid-column: 1 / -1;
  grid-row: 3;
  margin-top: var(--card-extra-gap, 4px);
  font-size: var(--card-extra-size, 13px);
  line-height: 1.6;
  color: var(--c-text-light, #65758b);
  /* 若要多行省略可取消注释以下：
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  */
}
</style>