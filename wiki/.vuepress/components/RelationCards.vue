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
        <img class="avatar" :src="srcUrl(p.avatar)" :alt="p.name" loading="lazy" />
        <div class="name">{{ p.name }}</div>
        <div class="role" v-if="p.role">{{ p.role }}</div>
      </RouterLink>

      <!-- 外部链接 -->
      <a v-else-if="p.link" :href="p.link" class="card-link" target="_blank" rel="noopener">
        <img class="avatar" :src="srcUrl(p.avatar)" :alt="p.name" loading="lazy" />
        <div class="name">{{ p.name }}</div>
        <div class="role" v-if="p.role">{{ p.role }}</div>
      </a >

      <!-- 无链接 -->
      <div v-else class="card-link">
        <img class="avatar" :src="srcUrl(p.avatar)" :alt="p.name" loading="lazy" />
        <div class="name">{{ p.name }}</div>
        <div class="role" v-if="p.role">{{ p.role }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/*
  组件名称：RelationCards

  功能：
    - 渲染一组“关系卡片”（头像 + 名称 + 角色）。
    - 支持三种状态：
        · 站内链接：使用 <RouterLink>，走 SPA 跳转；
        · 站外链接：使用 <a target="_blank">；
        · 无链接：纯展示卡片。
    - 数据来源优先级：
        1) props.items 显式传入；
        2) 当前页面 frontmatter.relations 字段。

  细节：
    - isInner(link)：仅判断是否以 “/” 开头，用来区分站内路由。
    - srcUrl(avatar)：若以 “/” 开头，则自动补站点 base（适配子路径部署），
                      其余情况原样返回（相对路径或完整外链）。
*/

import { computed } from 'vue'
import { usePageFrontmatter, withBase } from 'vuepress/client'

type RelationItem = {
  name: string
  role?: string
  avatar: string
  link?: string
  note?: string
}

const props = defineProps<{
  items?: RelationItem[]
}>()

// frontmatter 中的备用数据源
const fm = usePageFrontmatter<{ relations?: RelationItem[] }>()

// 最终用于渲染的列表数据
const data = computed<RelationItem[]>(() => {
  if (props.items?.length) return props.items
  return (fm.value?.relations || []) as RelationItem[]
})

// 站内路由判定：以 “/” 开头
const isInner = (link?: string) => !!link && link.startsWith('/')

// 头像地址补 base：/xxx.png → withBase('/xxx.png')
const srcUrl = (u?: string) => (!u ? '' : u.startsWith('/') ? withBase(u) : u)
</script>

<style scoped>
/*
  布局与外观总览：

    - .relation-cards：单行横向滚动的卡片列表，超出容器宽度时可以左右滑动。
    - .card：单个关系卡片，统一的边框 / 圆角 / 阴影 / 悬停反馈。
    - .card-link：卡片内部的可点击区域（RouterLink / a / div），统一处理文字样式。
    - .avatar：头像始终保持正方形并裁剪为圆形，避免变形。
*/

/* 容器：横向滚动列表 */
.relation-cards {
  display: flex;
  gap: 14px;
  overflow-x: auto;               /* 超出时允许左右滑动 */
  padding: 4px 2px 8px;
  -webkit-overflow-scrolling: touch; /* 移动端滚动更顺滑 */
}

/* 单个卡片 */
.card{
  flex: 0 0 120px;                /* 固定卡片宽度，不随容器被拉伸或压缩 */
  background: var(--vp-c-bg-soft, var(--c-bg, #111));
  color: var(--c-text, #111);
  border: 1px solid var(--c-border, #2a2a2a);
  border-radius: 12px;
  text-align: center;
  padding: 12px 10px;
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
}

/* 暗色主题下的兜底样式 */
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

/* 暗色下稍微加重阴影，避免太平 */
html[data-theme="dark"] .card:hover{
  box-shadow: 0 6px 16px rgba(0,0,0,.35);
}

/* 统一的点击区域样式 */
.card-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

/* 头像：自适应宽度 + 正方形裁剪 + 圆形外观 */
.avatar {
  width: 100%;
  max-width: 96px;
  aspect-ratio: 1 / 1;
  height: auto;

  object-fit: cover;
  object-position: center;
  border-radius: 9999px;
  display: block;
  margin: 4px auto 8px;
  background: #f2f3f5;
}

/* 名称与角色文案 */
.name {
  font-weight: 600;
  font-size: 14px;
  line-height: 1.2;
}

.role {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}
</style>