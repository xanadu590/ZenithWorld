<template>
  <div class="relation-cards">
    <div
      v-for="(p, i) in data"
      :key="i"
      class="card"
      :title="p.note || `${p.role || ''} ${p.name}`.trim()"
    >
      <!-- 内部路由优先 -->
      <RouterLink v-if="isInner(p.link)" :to="p.link" class="card-link">
        <img class="avatar" :src="p.avatar" :alt="p.name" loading="lazy" />
        <div class="name">{{ p.name }}</div>
        <div class="role" v-if="p.role">{{ p.role }}</div>
      </RouterLink>

      <!-- 外部链接 -->
      <a v-else-if="p.link" :href="p.link" class="card-link" target="_blank" rel="noopener">
        <img class="avatar" :src="p.avatar" :alt="p.name" loading="lazy" />
        <div class="name">{{ p.name }}</div>
        <div class="role" v-if="p.role">{{ p.role }}</div>
      </a >

      <!-- 无链接 -->
      <div v-else class="card-link">
        <img class="avatar" :src="p.avatar" :alt="p.name" loading="lazy" />
        <div class="name">{{ p.name }}</div>
        <div class="role" v-if="p.role">{{ p.role }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// [CHANGE] 新增：支持 props + Frontmatter 双来源
import { computed } from 'vue'
import { usePageFrontmatter } from 'vuepress/client'

type RelationItem = {
  name: string
  role?: string
  avatar: string
  link?: string
  note?: string
}

const props = defineProps<{
  // 可选：直接通过 props 传数据
  items?: RelationItem[]
}>()

// 从 Frontmatter 读取（当 props 未提供时）
const fm = usePageFrontmatter<{ relations?: RelationItem[] }>()
const data = computed<RelationItem[]>(() => {
  if (props.items?.length) return props.items
  return (fm.value?.relations || []) as RelationItem[]
})

// 判断是否为站内路由（以 / 开头）
const isInner = (link?: string) => !!link && link.startsWith('/')
</script>

<style scoped>
/* 网格布局：手机 3 列，平板 4 列，桌面 5 列 */
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

.card{
  /* 颜色全部走变量；使用更柔和的“软底色”变量，找不到再回退到 --c-bg */
  background: var(--vp-c-bg-soft, var(--c-bg, #111));
  color: var(--c-text, #111);
  border: 1px solid var(--c-border, #2a2a2a);
  border-radius: 12px;
  text-align: center;
  padding: 12px 10px;
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
}

/* 暗色下再给一道稳妥兜底，避免出现白色 */
html[data-theme="dark"] .card{
  background: var(--c-bg, #111);
  color: var(--c-text, #e5e5e5);
  border-color: var(--c-border, #333);
}

.card:hover{
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,.06);
  border-color: var(--c-brand, #3eaf7c);
}

/* 暗色下调轻阴影，避免糊 */
html[data-theme="dark"] .card:hover{
  box-shadow: 0 6px 16px rgba(0,0,0,.35);
}

.card-link { display: block; text-decoration: none; color: inherit; }

.avatar {
  width: 96px;
  height: 96px;
  border-radius: 9999px;
  object-fit: cover;         /* [裁剪] 保持比例，超出部分裁掉 */
  object-position: center;   /* [裁剪] 中心裁剪 */
  display: block;
  margin: 4px auto 8px;
  background: #f2f3f5;
}

.name { font-weight: 600; font-size: 14px; line-height: 1.2; }
.role { font-size: 12px; color: #666; margin-top: 4px; }
</style>