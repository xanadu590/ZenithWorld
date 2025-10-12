<template>
  <component
    :is="to ? (isInner(to) ? 'RouterLink' : 'a') : 'div'"
    :class="['role-card', { stacked }]"
    :to="to && isInner(to) ? to : undefined"
    :href="to && !isInner(to) ? to : undefined"
    :style="cardStyle"
    role="link"
    tabindex="0"
    @keydown.enter.prevent="to && go(to)"
  >
    <template v-if="!stacked">
      <div class="left">
        <img
          v-if="avatar"
          class="avatar"
          :src="imgUrl(avatar)"
          alt="角色立绘"
          loading="lazy"
        />
        <div class="extra">
          <div v-if="abilities?.length" class="abilities">
            <b>能力：</b>
            <ul>
              <li v-for="(a, i) in abilities" :key="i">
                <template v-if="isLinkObj(a)">
                  <a :href="a.href" @click.stop>{{ a.text }}</a >
                </template>
                <template v-else>{{ a }}</template>
              </li>
            </ul>
          </div>

          <div v-if="summary" class="summary">
            <b>简介：</b>
            <p>{{ summary }}</p >
          </div>
        </div>
      </div>

      <div class="right">
        <h2 class="title">
          <template v-if="isLinkObj(title)">
            <a :href="title.href" @click.stop>{{ title.text }}</a >
          </template>
          <template v-else>{{ title }}</template>
        </h2>

        <ul class="meta">
          <li v-if="alias">
            <span class="k">别名</span>
            <span class="v">
              <template v-if="isLinkObj(alias)">
                <a :href="alias.href" @click.stop>{{ alias.text }}</a >
              </template>
              <template v-else>{{ alias }}</template>
            </span>
          </li>

          <li v-if="faction">
            <span class="k">阵营</span>
            <span class="v">
              <template v-if="isLinkObj(faction)">
                <a :href="faction.href" @click.stop>{{ faction.text }}</a >
              </template>
              <template v-else>{{ faction }}</template>
            </span>
          </li>

          <li v-if="status">
            <span class="k">状态</span>
            <span class="v">
              <template v-if="isLinkObj(status)">
                <a :href="status.href" @click.stop>{{ status.text }}</a >
              </template>
              <template v-else>{{ status }}</template>
            </span>
          </li>

          <li v-if="firstAppearance">
            <span class="k">出场</span>
            <span class="v">
              <template v-if="isLinkObj(firstAppearance)">
                <a :href="firstAppearance.href" @click.stop>{{ firstAppearance.text }}</a >
              </template>
              <template v-else>{{ firstAppearance }}</template>
            </span>
          </li>
        </ul>
      </div>
    </template>

    <template v-else>
      <!-- 第 1 行：标题整行（仅在 titleOnTop=true 时渲染） -->
      <h2 v-if="titleOnTop" class="title title-top">
        <template v-if="isLinkObj(title)">
          <a :href="title.href" @click.stop>{{ title.text }}</a >
        </template>
        <template v-else>{{ title }}</template>
      </h2>

      <!-- 第 2 行：图片 + 基本信息 -->
      <div class="top" :class="{ 'has-title-on-top': titleOnTop }">
        <img
          v-if="avatar"
          class="avatar"
          :src="imgUrl(avatar)"
          alt="角色立绘"
          loading="lazy"
        />
        <div class="basic">
          <!-- 若标题已在第一行，则此处不再显示 -->
          <h2 v-if="showTitleInsideTop" class="title">
            <template v-if="isLinkObj(title)">
              <a :href="title.href" @click.stop>{{ title.text }}</a >
            </template>
            <template v-else>{{ title }}</template>
          </h2>

          <ul class="meta">
            <li v-if="alias">
              <span class="k">别名</span>
              <span class="v">
                <template v-if="isLinkObj(alias)">
                  <a :href="alias.href" @click.stop>{{ alias.text }}</a >
                </template>
                <template v-else>{{ alias }}</template>
              </span>
            </li>

            <li v-if="faction">
              <span class="k">阵营</span>
              <span class="v">
                <template v-if="isLinkObj(faction)">
                  <a :href="faction.href" @click.stop>{{ faction.text }}</a >
                </template>
                <template v-else>{{ faction }}</template>
              </span>
            </li>

            <li v-if="status">
              <span class="k">状态</span>
              <span class="v">
                <template v-if="isLinkObj(status)">
                  <a :href="status.href" @click.stop>{{ status.text }}</a >
                </template>
                <template v-else>{{ status }}</template>
              </span>
            </li>

            <li v-if="firstAppearance">
              <span class="k">出场</span>
              <span class="v">
                <template v-if="isLinkObj(firstAppearance)">
                  <a :href="firstAppearance.href" @click.stop>{{ firstAppearance.text }}</a >
                </template>
                <template v-else>{{ firstAppearance }}</template>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 第 3 行：能力 + 简介 -->
      <div class="bottom">
        <div v-if="abilities?.length" class="abilities">
          <b>能力：</b>
          <ul>
            <li v-for="(a, i) in abilities" :key="i">
              <template v-if="isLinkObj(a)">
                <a :href="a.href" @click.stop>{{ a.text }}</a >
              </template>
              <template v-else>{{ a }}</template>
            </li>
          </ul>
        </div>

        <div v-if="summary" class="summary">
          <b>简介：</b>
          <p>{{ summary }}</p >
        </div>
      </div>
    </template>
  </component>
</template>

<script setup lang="ts">
/*
  组件名：RoleCard
  功能概述：
    - 渲染一个角色信息卡片，可选择左右布局或上下分段布局。
    - 若传入 props.to，则整卡可点击跳转；站内路径使用 RouterLink，外链使用 <a>。
    - 头像图片自动适配部署 base（含 GitHub Pages 子路径）。
*/
type MaybeLink = string | { text: string; href: string }

const props = withDefaults(defineProps<{
  title: MaybeLink
  avatar?: string
  alias?: MaybeLink
  faction?: MaybeLink
  status?: MaybeLink
  firstAppearance?: MaybeLink
  abilities?: MaybeLink[]
  summary?: string
  to?: string
  width?: number
  height?: number
  avatarWidth?: number
  avatarHeight?: number
  stacked?: boolean
  /** ★ 新增：标题是否单独占据第 1 行（仅 stacked 模式生效） */
  titleOnTop?: boolean
}>(), {
  width: 220,
  height: 330,
  avatarWidth: 100,
  avatarHeight: 150,
  stacked: false,
  titleOnTop: false,
})

const isLinkObj = (v: unknown): v is { text: string; href: string } =>
  !!v && typeof v === 'object' && 'text' in (v as any) && 'href' in (v as any)

const isInner = (link?: string) => !!link && link.startsWith('/')

import { withBase } from '@vuepress/client'
const go = (href: string) => {
  const url = isInner(href) ? withBase(href) : href
  window.location.assign(url)
}

function imgUrl(u?: string) {
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  return u.startsWith('/') ? withBase(u) : u
}

const cardStyle = {
  width: `${props.width}px`,
  height: `${props.height}px`,
  '--avatar-w': `${props.avatarWidth}px`,
  '--avatar-h': `${props.avatarHeight}px`,
  '--avatar-pos': '50% 50%',
} as Record<string, string>

const { stacked, titleOnTop } = props

/** ★ 计算：是否在「图+基本信息」区域里显示标题 */
const showTitleInsideTop = !(stacked && titleOnTop)
</script>

<style scoped>
/* ===========================
   1) 卡片整体容器（固定宽高）
   =========================== */
.role-card{
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto;
  gap: 12px 16px;
  padding: 14px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,.05);
  text-decoration: none;
  color: var(--c-text, #111);
  overflow: hidden;
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
}
.role-card:hover{
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0,0,0,.08);
  border-color: var(--c-border, #d6dee6);
}

/* 暗色主题适配 */
html[data-theme="dark"] .role-card{
  border-color: #333;
  background: var(--vp-c-bg-soft, #0b0f19);
  color: var(--c-text, #e5e5e5);
}

/* ===========================
   2) 左列：图片 + 额外信息（能力/简介）
   =========================== */
.left{
  display: flex;
  flex-direction: column;
  align-items: center;
  width: max-content;
}

.avatar{
  width: 100px;
  height: 150px;
  object-fit: cover;
  object-position: var(--avatar-pos, 50% 50%);
  background: #f2f3f5;
  border-radius: 10px;
  border: 1px solid var(--c-border, #e5e7eb);
}

.extra{
  margin-top: 10px;
  width: 100%;
  max-width: 220px;
}

.abilities ul{
  margin: 6px 0 0 16px;
}
.summary{
  margin-top: 6px;
}
.summary p{
  margin: 2px 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 3;
}

/* ===========================
   3) 右列：关键信息（单项纵排）
   =========================== */
.right{
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.title{
  font-size: 20px;
  line-height: 1.2;
  margin: 2px 0 10px;
  font-weight: 700;
}
.title a{
  color: inherit;
  text-decoration: none;
}
.title a:hover{
  text-decoration: none;
}

.meta{
  display: flex;
  flex-direction: column;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.meta li{
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1.5;
}
.meta .k{
  flex: none;
  font-weight: 600;
  color: var(--c-text-light, #65758b);
}
.meta .v{
  flex: 1;
  min-width: 0;
}
.meta .v a{
  color: var(--c-brand, #3eaf7c);
  text-decoration: none;
}
.meta .v a:hover{
  text-decoration: none;
}

/* ===========================
   4) 上下分段布局覆盖（stacked）
   =========================== */
.role-card.stacked{
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.role-card.stacked .top{
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.role-card.stacked .basic{
  flex: 1;
  min-width: 0;
}
.role-card.stacked .bottom{
  display: block;
}

/* ★ 新增：三行模式时，顶行标题样式与间距 */
.role-card.stacked .title-top{
  margin: 2px 0 8px;
  line-height: 1.2;
  font-weight: 700;
}
.role-card.stacked .top.has-title-on-top{
  margin-top: 2px;
}

/* ===========================
   5) 交互细节与字号缩放
   =========================== */
.role-card a{
  cursor: pointer;
}

/* ============================================================
   🎨 三行模式（stacked + titleOnTop）字体样式个性化控制
   ============================================================ */

/* 第1行：标题 */
.role-card.stacked .title-top {
  font-size: var(--card-title-size, 1.2rem);    /* 字体大小 */
  color: var(--card-title-color, #111);       /* 字体颜色 */
  text-align: var(--card-title-align, center);  /* 对齐方式：left / center / right */
  margin: 0px 0px 0px;
  margin-bottom: var(--card-title-gap, -6px); /* 默认10px，可自由改 */
}

/* 第2行：关键信息（meta） */
.role-card.stacked .basic {
  font-size: var(--card-meta-size, 0.8rem);
  color: var(--card-meta-color, #333);
  text-align: var(--card-meta-align, left);
}

/* 第3行：能力 & 简介 */
.role-card.stacked .bottom {
  font-size: var(--card-summary-size, 0.8rem);
  color: var(--card-summary-color, #444);
  text-align: var(--card-summary-align, left);
}

.role-card { font-size: 0.7rem; }
.title { font-size: 13px; }
.meta { gap: 8px; }
</style>