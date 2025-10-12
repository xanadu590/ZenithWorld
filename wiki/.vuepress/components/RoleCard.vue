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
      <div class="top">
        <img
          v-if="avatar"
          class="avatar"
          :src="imgUrl(avatar)"
          alt="角色立绘"
          loading="lazy"
        />
        <div class="basic">
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
      </div>

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

  模板行为说明（对应 <template>）：
    - :is：根据 to 与 isInner 动态选择 'RouterLink' | 'a' | 'div'。
    - :to / :href：仅在对应场景下赋值，避免多余属性。
    - 键盘可达：在卡片上按 Enter 会触发 go(to) 导航。
    - v-if="!stacked" / v-else：左右布局与上下分段布局二选一。
    - abilities 支持字符串或 {text, href}；link 对象点击时 .stop 阻止冒泡，避免触发整卡跳转。

  可调参数（通过 props）：
    - width/height：卡片固定尺寸（数值，px）。
    - avatarWidth/avatarHeight：头像盒尺寸（通过 CSS 变量传入 .avatar）。
    - stacked：是否使用上下分段布局（默认 false）。
    - to：整卡跳转链接（站内以 / 开头，外链为 http(s)）。
    - 其余字段：title/alias/faction/status/firstAppearance/abilities/summary/avatar。

  数据类型约定：
    - MaybeLink = string | { text: string; href: string }
      // string：直接渲染文本
      // 对象：渲染为可点击链接
*/

// 定义「字符串或链接对象」的联合类型
type MaybeLink = string | { text: string; href: string }

// 组件 props（含默认值）
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
}>(), {
  width: 220,
  height: 330,
  avatarWidth: 100,
  avatarHeight: 150,
  stacked: false,
})

// 工具：判断值是否为 { text, href } 结构
const isLinkObj = (v: unknown): v is { text: string; href: string } =>
  !!v && typeof v === 'object' && 'text' in (v as any) && 'href' in (v as any)

// 工具：判断是否站内路由（以 / 开头）
const isInner = (link?: string) => !!link && link.startsWith('/')

// 导航：用于键盘回车触发，站内补 base，外链原样
import { withBase } from '@vuepress/client'
const go = (href: string) => {
  // 站内路径：使用 withBase 补上部署前缀（如 /zenithworld/）
  // 外链（http/https）：保持原样
  const url = isInner(href) ? withBase(href) : href
  window.location.assign(url)
}

// 统一处理图片地址：/ 开头补 base，其它（相对路径或外链）保持原样
function imgUrl(u?: string) {
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  return u.startsWith('/') ? withBase(u) : u
}

// 计算卡片内联样式与头像变量尺寸
const cardStyle = {
  width: `${props.width}px`,
  height: `${props.height}px`,
  '--avatar-w': `${props.avatarWidth}px`,
  '--avatar-h': `${props.avatarHeight}px`,
  '--avatar-pos': '50% 50%', // 可改为 '50% 35%' 以上移聚焦
} as Record<string, string>

const { stacked } = props
</script>

<style scoped>
/* ===========================
   1) 卡片整体容器（固定宽高）
   =========================== */
.role-card{
  display: grid;
  grid-template-columns: /* 左列固定，右列自适应 */ auto 1fr;
  grid-template-rows: auto;        /* 一行布局（下面的 extra 在左列内部） */
  gap: 12px 16px;
  padding: 14px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,.05);
  text-decoration: none;            /* 当 <a> 使用时，去掉默认下划线 */
  color: var(--c-text, #111);
  overflow: hidden;                 /* 固定尺寸时避免内容溢出 */
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
  flex-direction: column;   /* 图片在上，extra 在下 */
  align-items: center;
  width: max-content;       /* 由头像尺寸决定宽度 */
}

/* 固定头像盒子，任何大图都会“等比缩放 + 居中裁剪”填满 */
.avatar{
  width: 100px;
  height: 150px;
  object-fit: cover;             /* 由 contain 改为 cover（先缩放后裁剪） */
  object-position: var(--avatar-pos, 50% 50%); /* 裁剪重心，可全局/局部覆盖 */
  background: #f2f3f5;           /* 占位底色 */
  border-radius: 10px;
  border: 1px solid var(--c-border, #e5e7eb);
}

/* 图片下方的额外信息区域：给定最大宽度，避免左列过宽 */
.extra{
  margin-top: 10px;
  width: 100%;
  max-width: 220px;               /* 可按需调整 */
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
  -webkit-line-clamp: 3;          /* 最多显示三行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 3;
}

/* ===========================
   3) 右列：关键信息（单项纵排）
   =========================== */
.right{
  min-width: 0;                   /* 让内容在固定宽度下可收缩 */
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

/* 关键信息：一行一行纵向排列 */
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
  display: flex;              /* 覆盖 grid → flex 列方向 */
  flex-direction: column;
  gap: 12px;                  /* 上下两段间距 */
}
.role-card.stacked .top{
  display: flex;              /* 顶部：图片 + 基本信息横排 */
  align-items: flex-start;
  gap: 10px;
}
.role-card.stacked .basic{
  flex: 1;
  min-width: 0;
}
.role-card.stacked .bottom{
  display: block;             /* 底部整行展示能力/简介 */
}

/* ===========================
   5) 交互细节与字号缩放
   =========================== */
.role-card a{
  cursor: pointer;
}

/* 缩小这张卡片内的字体（不影响别的组件） */
.role-card {
  font-size: 0.7rem;   /* 可按需调整为 0.9、0.875 等 */
}
.title { font-size: 13px; }   /* 保持与整体缩放一致 */
.meta { gap: 8px; }           /* 行距微调 */
</style>