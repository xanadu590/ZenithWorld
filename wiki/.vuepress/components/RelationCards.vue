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
  功能综述：
    - 渲染一组“关系卡片”（头像、名称、角色等），支持点击跳转（站内用 RouterLink，站外用 <a>）。
    - 数据来源支持二选一：
        1) 通过 props.items 直接传入（优先级更高）
        2) 从当前页面 Frontmatter 的 relations 字段读取
    - 图片地址支持自动补站点 base 前缀（withBase），保证在 GitHub Pages 等子路径部署时图片可用。

  关键点与可调选项：
    - 判断站内链接：isInner(link) 仅判断“以 / 开头”，满足即走 <RouterLink>。
      // 如需更严格规则，可在 isInner 内扩展正则匹配。
    - 图片地址补 base：srcUrl('/path') 会自动变成 withBase('/path')。
      // 若传入的是相对路径或完整外链，则保持原样。
    - 栅格列数随断点变化：在样式中用媒体查询控制列数（手机 4、≥640px 5、≥960px 6 —— 详见 CSS）。
*/

import { computed } from 'vue'              // // 计算属性，用于从 props/FM 组合出最终数据
import { usePageFrontmatter, withBase } from 'vuepress/client'  // // Frontmatter 读取与 base 前缀工具

// // 卡片条目类型定义：用于 props/items 与 FM/relations 的静态类型提示
type RelationItem = {
  name: string
  role?: string
  avatar: string
  link?: string
  note?: string
}

// // Props：可选择直接传 items（优先）
const props = defineProps<{
  // 可选：直接通过 props 传数据
  items?: RelationItem[]
}>()

// // 从 Frontmatter 读取（当 props 未提供时作为后备数据源）
const fm = usePageFrontmatter<{ relations?: RelationItem[] }>()
const data = computed<RelationItem[]>(() => {
  // // 若 props.items 存在且非空，优先使用
  if (props.items?.length) return props.items
  // // 否则尝试从 Frontmatter 读取 relations，若无则使用空数组
  return (fm.value?.relations || []) as RelationItem[]
})

// // 判断是否为站内路由（以 / 开头）—— 满足则使用 <RouterLink> 实现 SPA 内导航
const isInner = (link?: string) => !!link && link.startsWith('/')

// // 图片 src 统一补 base（/ 开头时），外链/相对路径保持原样
// // 例如：子路径部署 site.com/zenithworld/ 时，/image/a.png 会自动变成 /zenithworld/image/a.png
const srcUrl = (u?: string) => (!u ? '' : u.startsWith('/') ? withBase(u) : u)
</script>

<style scoped>
/*
  布局与外观总览：
    - .relation-cards 使用 CSS Grid 作为外层瀑布流网格，断点控制列数。
    - .card 为单元卡片，统一的边框/圆角/阴影/悬停反馈。
    - .card-link 作为卡片内部的点击区域（RouterLink 或 a 或 div），继承文本色、去除下划线。
    - .avatar 头像固定尺寸 + cover 裁剪，避免比例不一导致布局抖动。
*/

/* 网格布局：手机 4 列，平板 5 列，桌面 6 列（可按需微调 repeat 数量） */
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