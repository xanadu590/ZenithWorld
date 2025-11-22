<template>
  <!--
    RoleCard（角色卡片组件）
    · 支持两种布局：
      - 默认：左右布局（左头像，右信息）—— stacked = false
      - 三行布局：标题（第1行）/ 基本信息（第2行）/ 底部条目（第3行）—— stacked = true 且 titleOnTop 可控制第1行是否单独显示

    · 点击整卡跳转（可选）：传入 props.to 即可
      - 站内路由（以 / 开头）使用 RouterLink
      - 外链（http/https）使用 <a>
  -->
  <component
    :is="to ? (isInner(to) ? 'RouterLink' : 'a') : 'div'"
    :class="['role-card', { stacked }]"
    :to="to && isInner(to) ? to : undefined"
    :href="to && !isInner(to) ? to : undefined"
    :style="cardStyle"
    role="link"
    tabindex="0"
    ref="cardRef"
    @keydown.enter.prevent="to && go(to)"
  >
    <!-- ===================== 左右布局（保持老视觉，不用可忽略） ===================== -->
    <template v-if="!stacked">
      <div class="left">
        <img
          v-if="avatar"
          class="avatar"
          :src="imgUrl(avatar)"
          alt="角色立绘"
          loading="lazy"
        />

        <!-- 左侧下方补充信息区：你可以放入 bottomItems 的第一个分组，或直接不显示 -->
        <div class="extra" v-if="bottomItems?.length">
          <!-- 仅渲染第一个分组作为示例；如需全部可自行改为 v-for -->
          <div class="bottom-item" v-if="bottomItems[0]">
            <b>{{ bottomItems[0].label || '补充' }}：</b>
            <template v-if="Array.isArray(bottomItems[0].list)">
              <ul>
                <li v-for="(a, i) in bottomItems[0].list" :key="i">
                  <template v-if="isLinkObj(a)">
                    <a :href="a.href" @click.stop>{{ a.text }}</a >
                  </template>
                  <template v-else>{{ a }}</template>
                </li>
              </ul>
            </template>
            <p v-else-if="bottomItems[0].content">{{ bottomItems[0].content }}</p >
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

        <!-- 第 2 行信息：使用 metaFields，只有你提供的才显示 -->
        <ul class="meta">
          <li v-for="(m, idx) in metaFields" :key="idx">
            <span class="k">{{ m.label }}</span>
            <span class="v">
              <template v-if="isLinkObj(m.value)">
                <a :href="m.value.href" @click.stop>{{ m.value.text }}</a >
              </template>
              <template v-else>{{ m.value }}</template>
            </span>
          </li>
        </ul>
      </div>
    </template>

    <!-- ===================== 三行布局：标题 / 信息 / 底部条目 ===================== -->
    <template v-else>
      <!-- 第 1 行：标题整行（仅在 titleOnTop=true 时渲染） -->
      <h2 v-if="titleOnTop" class="title title-top">
        <template v-if="isLinkObj(title)">
          <a :href="title.href" @click.stop>{{ title.text }}</a >
        </template>
        <template v-else>{{ title }}</template>
      </h2>

      <!-- 第 2 行：图片 + 基本信息（根据 showTitleInsideTop 控制标题是否出现在这里） -->
      <div class="top" :class="{ 'has-title-on-top': titleOnTop }">
        <img
          v-if="avatar"
          class="avatar"
          :src="imgUrl(avatar)"
          alt="角色立绘"
          loading="lazy"
        />
        <div class="basic">
          <!-- 若标题没放在第 1 行，这里显示标题 -->
          <h2 v-if="showTitleInsideTop" class="title">
            <template v-if="isLinkObj(title)">
              <a :href="title.href" @click.stop>{{ title.text }}</a >
            </template>
            <template v-else>{{ title }}</template>
          </h2>

          <!-- 关键信息（可自由增删），只显示你传入的 metaFields -->
          <ul class="meta">
            <li v-for="(m, idx) in metaFields" :key="idx">
              <span class="k">{{ m.label }}</span>
              <span class="v">
                <template v-if="isLinkObj(m.value)">
                  <a :href="m.value.href" @click.stop>{{ m.value.text }}</a >
                </template>
                <template v-else>{{ m.value }}</template>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 第 3 行：底部分组条目（完全自定义的区块，可任意增删改名） -->
      <div class="bottom" v-if="bottomItems?.length" ref="bottomRef">
        <div class="bottom-item" v-for="(sec, i) in bottomItems" :key="i">
          <b v-if="sec.label">{{ sec.label }}：</b>

          <!-- 列表型条目（如“能力：·飞行 ·火球 ·治疗”） -->
          <template v-if="Array.isArray(sec.list)">
            <ul>
              <li v-for="(a, j) in sec.list" :key="j">
                <template v-if="isLinkObj(a)">
                  <a :href="a.href" @click.stop>{{ a.text }}</a >
                </template>
                <template v-else>{{ a }}</template>
              </li>
            </ul>
          </template>

          <!-- 文本型条目（如“简介：她是……”） -->
          <p v-else-if="sec.content">{{ sec.content }}</p >
        </div>
      </div>
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ===================== 可视参数（props）—— 只保留新功能 =====================
 *
 * 你只需要传这些字段：
 * - title:         标题（可为字符串，或 { text, href } 链接对象）
 * - avatar:        头像图片（字符串路径，/ 开头会按 base 补全）
 * - to:            整卡点击跳转（站内以 / 开头，外链 http/https）
 *
 * - stacked:       是否启用“三行布局”（默认 false 为左右布局）
 * - titleOnTop:    三行布局下，标题是否独占第 1 行（默认 false）
 *
 * - width / height:      卡片整体宽高（数值，单位 px）
 * - avatarWidth / avatarHeight: 头像盒宽高（数值，单位 px）
 *
 * - metaFields:    第 2 行信息：数组，每项 { label: string, value: string | LinkObj }
 *                  仅渲染你提供的项，可任意增删顺序
 * - bottomItems:   第 3 行分组区块：数组，每项 { label?: string, content?: string, list?: (string | LinkObj)[] }
 *                  只渲染存在的字段，可任意增删改名
 *
 * LinkObj 结构: { text: string, href: string }
 */

type LinkObj = { text: string; href: string }
type MaybeLink = string | LinkObj

type MetaField = { label: string; value: MaybeLink }
type BottomItem = {
  label?: string
  content?: string
  list?: MaybeLink[]
}

const props = withDefaults(defineProps<{
  title: MaybeLink
  avatar?: string
  to?: string

  /* —— 布局控制 —— */
  stacked?: boolean
  titleOnTop?: boolean

  /* —— 尺寸（px）—— */
  width?: number
  height?: number
  avatarWidth?: number
  avatarHeight?: number

  /* —— 数据 —— */
  metaFields?: MetaField[]     // ← 第 2 行关键信息（只渲染你提供的项）
  bottomItems?: BottomItem[]   // ← 第 3 行分组条目（可自由增删改名）
}>(), {
  width: 220,
  height: 330,
  avatarWidth: 90,
  avatarHeight: 135,
  stacked: false,
  titleOnTop: false,
  metaFields: () => [],       // 默认空
  bottomItems: () => [],      // 默认空
})

/* =============== 工具函数（无需改动） =============== */
const isLinkObj = (v: unknown): v is LinkObj =>
  !!v && typeof v === 'object' && 'text' in (v as any) && 'href' in (v as any)

const isInner = (link?: string) => !!link && link.startsWith('/')

import { withBase } from '@vuepress/client'
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'

const go = (href: string) => {
  const url = isInner(href) ? withBase(href) : href
  window.location.assign(url)
}

function imgUrl(u?: string) {
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  return u.startsWith('/') ? withBase(u) : u
}

/**
 * =============== 外观可调（CSS 变量） ===============
 * · 你可以在使用组件时通过内联 style 或外层选择器覆写以下变量：
 *   --avatar-w / --avatar-h / --avatar-pos
 *   --card-title-size / --card-title-color / --card-title-align / --card-title-gap
 *   --card-meta-size / --card-meta-color / --card-meta-align / --card-meta-line-height / --card-meta-gap
 *   --card-summary-size / --card-summary-color / --card-summary-align / --card-summary-gap
 *   --card-bottom-bg / --card-bottom-bg-dark
 */
const cardStyle = {
  width: `${props.width}px`,
  height: `${props.height}px`,
  '--avatar-w': `${props.avatarWidth}px`,
  '--avatar-h': `${props.avatarHeight}px`,
  '--avatar-pos': '50% 50%',
} as Record<string, string>

/** 三行模式下，是否在第 2 行中显示标题（当 titleOnTop=false 时为 true） */
const { stacked, titleOnTop, metaFields, bottomItems } = props
const showTitleInsideTop = !(stacked && titleOnTop)

/* ==================== 触底检测 + 自动省略号 ==================== */

/** 整卡引用 & 底部区引用 */
const cardRef = ref<any | null>(null)
const bottomRef = ref<HTMLElement | null>(null)

/** 记录最后一个段落的完整文本，只截断显示，不改数据源 */
const fullBottomText = ref<string | null>(null)

/** 希望与卡片底部至少保留的安全距离（px） */
const SAFE_BOTTOM_GAP = 12

/** 兼容 <component> / RouterLink 拿到真实 DOM 元素 */
const getCardElement = (): HTMLElement | null => {
  const raw = cardRef.value
  if (!raw) return null
  // 直接就是 DOM
  if (raw instanceof HTMLElement) return raw
  // 组件实例（如 RouterLink），取 $el
  if ((raw as any).$el instanceof HTMLElement) return (raw as any).$el
  return null
}

const adjustBottomText = async () => {
  await nextTick()

  // 只在三行布局时处理
  if (!props.stacked) return

  const cardEl = getCardElement()
  const bottomEl = bottomRef.value
  if (!cardEl || !bottomEl) return

  // 查找 bottom 内最后一个 <p>，一般就是“简介：xxx”
  const lastP = bottomEl.querySelector('p:last-of-type') as HTMLElement | null
  if (!lastP) return

  // 首次记录原始文本
  if (fullBottomText.value === null) {
    fullBottomText.value = lastP.textContent || ''
  }

  // 每次计算前先还原
  lastP.textContent = fullBottomText.value || ''
  await nextTick()

  const cardRect = cardEl.getBoundingClientRect()
  let bottomRect = bottomEl.getBoundingClientRect()

  // 如果距离底部本来就够远，不用截断
  if (cardRect.bottom - bottomRect.bottom >= SAFE_BOTTOM_GAP) {
    return
  }

  const text = fullBottomText.value || ''
  let left = 0
  let right = text.length

  // 二分查找合适长度，确保不贴底
  while (left < right) {
    const mid = Math.floor((left + right) / 2)

    const truncated =
      text
        .slice(0, mid)
        .replace(/[，。！？,.!?\s]*$/, '') + '...'

    lastP.textContent = truncated
    await nextTick()

    bottomRect = bottomEl.getBoundingClientRect()
    const gap = cardRect.bottom - bottomRect.bottom

    if (gap >= SAFE_BOTTOM_GAP) {
      // 已经离底部够远，可以尝试多显示一点字
      left = mid + 1
    } else {
      // 还是太靠近底部，继续缩短
      right = mid
    }
  }
}

onMounted(() => {
  adjustBottomText()
  // 图片加载完成后高度会变，再跑一次
  window.addEventListener('load', adjustBottomText)
  window.addEventListener('resize', adjustBottomText)
})

onUnmounted(() => {
  window.removeEventListener('load', adjustBottomText)
  window.removeEventListener('resize', adjustBottomText)
})

/** 当底部内容变化（例如路由切换到另一张卡）时，重置并重新计算 */
watch(
  () => props.bottomItems,
  () => {
    fullBottomText.value = null
    adjustBottomText()
  },
  { deep: true }
)
</script>

<style scoped>
/* ===========================
   1) 卡片容器（可改圆角/阴影/边框/背景）
   =========================== */
.role-card{
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto;
  gap: 12px 16px;
  padding: 14px;
  line-height: var(--card-line-height, 1);

  /* 🟡 外框风格（亮色）*/
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,.05);

  color: var(--c-text, #111);
  text-decoration: none;
  overflow: hidden;
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
}
.role-card:hover{
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0,0,0,.08);
  border-color: var(--c-border, #d6dee6);
}

/* 🌚 暗色主题 */
html[data-theme="dark"] .role-card{
  border-color: #333;
  background: var(--vp-c-bg-soft, #0b0f19);
  color: var(--c-text, #e5e5e5);
}

/* ===========================
   2) 左列（头像 + 可放少量补充）
   - 可调头像尺寸：--avatar-w / --avatar-h
   - 可调头像裁剪重心：--avatar-pos (如 '50% 35%')
   =========================== */
.left{
  display: flex;
  flex-direction: column;
  align-items: center;
  width: max-content;
}

.avatar{
  width: var(--avatar-w, 90px);
  height: var(--avatar-h, 135px);
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

.bottom-item { margin-top: 4px; }
.bottom-item b { display: inline-block; margin-right: 4px; }
.bottom-item ul { margin: 4px 0 0 16px; }
.bottom-item p { display: inline; }

/* ===========================
   3) 右列：标题 + 关键信息（meta）
   - 调整标题大小：.title { font-size }
   - 调整标题上下间距：margin
   - 调整信息行距：--card-meta-line-height（或 .meta li 的 line-height）
   =========================== */
.right{
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.title{
  font-size: 20px;     /* ← 调标题字号 */
  line-height: 1;    /* ← 调标题行高 */
  margin: 0px 0 0px;  /* ← 调标题与下方间距 */
  font-weight: 700;
}
.title a{
  color: inherit;
  text-decoration: none;
}
.title a:hover{
  text-decoration: none;
}

/* 关键信息（第 2 行） */
.meta{
  display: flex;
  flex-direction: column;
  gap: var(--card-meta-gap, 8px);         /* ← 调整每两条信息之间的间距 */
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: var(--card-meta-size, 0.85rem); /* ← 调整体字号 */
  color: var(--card-meta-color, inherit);    /* ← 调整颜色（默认继承主题色） */
}
.meta li{
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: var(--card-meta-line-height, 1.2); /* ← 调每一行的行高 */
}
.meta .k{
  flex: none;
  font-weight: 600;
  color: var(--c-text-light, #65758b); /* 键名颜色 */
}
html[data-theme="dark"] .role-card .meta .k{
  color: var(--c-text-light, #a8b3cf); /* 暗色下键名颜色 */
}
.meta .v{
  flex: 1;
  min-width: 0;
  color: inherit;
}
.meta .v a{
  color: var(--c-brand, #3eaf7c);
  text-decoration: none;
}
.meta .v a:hover{
  text-decoration: none;
}

/* ===========================
   4) 三行布局（stacked 模式）
   - 第 1 行标题样式：.title-top
   - 第 2 行信息容器：.top / .basic
   - 第 3 行分组条目：.bottom / .bottom-item
   =========================== */
.role-card.stacked{
  display: flex;
  flex-direction: column;
  gap: 12px; /* ← 第 1/2/3 行之间的整体垂直间距 */
}
.role-card.stacked .title-top{
  margin: -2px 0 8px;                      /* ← 标题与第2行间距 */
  margin-bottom: var(--card-title-gap, -5px);
  line-height: 1.2;
  font-weight: 700;

  /* 也支持 CSS 变量重写以下属性 */
  font-size: var(--card-title-size, 1rem);
  color: var(--card-title-color, inherit);
  text-align: var(--card-title-align, center);
}
.role-card.stacked .top{
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.role-card.stacked .basic{
  flex: 1;
  min-width: 0;
  font-size: var(--card-meta-size, 0.85rem);
  color: var(--card-meta-color, inherit);
  text-align: var(--card-meta-align, left);
}
.role-card.stacked .bottom{
  /* 第 3 行整体背景色 —— 你可以改成品牌色块 */
  background: var(--card-bottom-bg, rgba(0, 0, 0, 0.05));
  border-radius: 8px;
  padding-top:    var(--card-summary-padding-y, var(--card-summary-gap, 0px));
  padding-bottom: var(--card-summary-padding-y, var(--card-summary-gap, 20px));
  padding-left:   var(--card-summary-padding-x, var(--card-summary-gap, 10px));
  padding-right:  var(--card-summary-padding-x, var(--card-summary-gap, 10px));    /* ← 调整第 3 行内边距 */
  font-size: var(--card-summary-size, 0.85rem);
  color: var(--card-summary-color, inherit);
  text-align: var(--card-summary-align, left);
  margin-top: var(--card-section-gap, -5px); 
}
html[data-theme="dark"] .role-card.stacked .bottom {
  background: var(--card-bottom-bg-dark, rgba(255, 255, 255, 0.08));
}

/* ===========================
   5) 交互
   =========================== */
.role-card a{ cursor: pointer; }

/* （可选）统一缩放整卡内默认字体，不影响自定义变量 */
.role-card { font-size: 0.8rem; }
</style>
