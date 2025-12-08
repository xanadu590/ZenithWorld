<!-- wiki/.vuepress/components/RandomSidebar.vue -->
<template>
  <ClientOnly>
    <!--
      视图说明
      --------------------------------------------------------------------------
      - 这是一个“右侧浮动/吸附”的随机推荐侧栏组件。
      - 当 ready 且 items 有值时渲染推荐列表；否则渲染空态（同样占位）。
      - 侧栏内部采用“可缩放网格”布局：外层容器绝对居中，标题行绝对定位在网格上方。
      - 每一项 <li> 整块可点击或按回车触发跳转（无 <a>，用 JS 导航）。
      - 包裹在 <ClientOnly> 内，避免 SSR 阶段访问 window / ResizeObserver 报错。
    -->
    <aside
      ref="dockEl"
      class="random-sidebar"
      :class="{ sticky, dock: dockRight }"
      v-if="ready && items.length"
      role="complementary"
      aria-label="随机文章推荐"
    >
      <div class="sb-scale-wrap">
        <!-- 标题 + 换一批 按钮（用于重新抽样） -->
        <div class="sb-header" ref="titleEl">
          <div class="sb-title">也许你爱看：</div>
          <button
            class="sb-refresh sb-refresh--inline"
            @click="refresh"
            aria-label="换一批"
            title="换一批"
          >
            换一批
          </button>
        </div>

        <ul class="sb-list" ref="listEl">
          <li
            v-for="it in itemsShown"
            :key="it.href"
            class="sb-item"
            @click="go(it)"
            @keydown.enter.prevent="go(it)"
            role="link"
            tabindex="0"
            :title="it.title || it.href"
          >
            <div class="sb-item-title">
              {{ it.title || nameFromPath(it.href) }}
            </div>
            <!-- 外层做“垂直居中 + 左对齐”，内层做“多行省略” -->
            <div class="sb-item-excerpt">
              <div class="sb-excerpt-inner">
                {{ it.excerpt || brief(it) }}
              </div>
            </div>
          </li>
        </ul>
      </div>
    </aside>

    <!-- 空态：未能准备就绪时的占位渲染 -->
    <aside
      ref="dockEl"
      v-else
      class="random-sidebar empty"
      :class="{ sticky, dock: dockRight }"
    >
      <div class="sb-title">随机推荐</div>
      <div class="sb-empty">
        暂无推荐
        <button class="sb-refresh" @click="refresh">重试</button>
      </div>
    </aside>
  </ClientOnly>
</template>

<script setup lang="ts">
/*
  组件名称：RandomSidebar
  核心作用
  ----------------------------------------------------------------------------
  - 在正文右侧（大屏）展示一组“随机文章推荐”卡片，并根据容器可用空间智能计算
    “列数/行数/卡片尺寸/可展示条数”等，使内容尽可能充实又不溢出。

  关键点
  ----------------------------------------------------------------------------
  - 链接跳转：通过 useRandomPool.resolveLink() 统一加上 base 前缀，兼容子路径部署。
  - 自适应布局：窗口尺寸变化时、主题容器变化时，用 requestAnimationFrame + ResizeObserver
    触发重算，保证网格始终居中并充满侧栏。
  - 吸附/固定：通过 props.sticky 与 props.dockRight 决定是否吸附滚动与是否固定在右侧。

  可调参数（通过 CSS 自定义属性）
  ----------------------------------------------------------------------------
  - --dock-gap            // 正文与侧栏之间的水平间距
  - --dock-right-safe     // 右侧安全边距
  - --dock-top            // 顶部安全边距（与导航高度相关）
  - --dock-bottom-safe    // 底部安全边距
  - --grid-soft-margin-x  // 侧栏内部“软”左右留白
  - --grid-soft-margin-y  // 侧栏内部“软”上下留白
  - --card-ratio          // 单卡片的宽高比（宽→高）
*/

import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRandomPool, type RandomItem } from '../composables/useRandomPool.js'

/* 公开属性：可控制条数 / 是否吸顶 / 是否靠右固定 */
const props = withDefaults(
  defineProps<{
    count?: number
    sticky?: boolean
    dockRight?: boolean
  }>(),
  {
    count: 6,
    sticky: true,
    dockRight: true,
  },
)

/* 运行时状态 */
const ready = ref(false)                  // 是否已加载随机池
const items = ref<RandomItem[]>([])       // 抽样得到的原始候选
const itemsShown = ref<RandomItem[]>([])  // 根据可用空间最终展示的子集

/* 随机池工具：load 载入；sample 抽样；resolveLink 统一补 base 前缀 */
const { load, sample, resolveLink } = useRandomPool()

/* 跳转：整项点击或回车触发 */
const go = (it: RandomItem) => window.location.assign(resolveLink(it.href))

/* 兜底：当没有标题/摘要时，从 href 中提取文件名作为显示文本 */
function nameFromPath(p: string) {
  const m = p.match(/\/([^/]+)\.html$/)
  return m ? decodeURIComponent(m[1]) : p
}
function brief(i: RandomItem) {
  if (i.excerpt?.trim()) return i.excerpt.trim()
  if (i.title?.trim()) return i.title.trim()
  return nameFromPath(i.href)
}

/* DOM 引用：侧栏宿主、标题（测量高度）、网格列表（写入轨道/尺寸） */
const dockEl = ref<HTMLElement | null>(null)
// titleEl 指向 .sb-header，用于测量 header 自身高度并传回给 CSS 变量
const titleEl = ref<HTMLElement | null>(null)
const listEl = ref<HTMLElement | null>(null)

/* 观察器/调度器：ResizeObserver + rAF 节流 */
let ro: ResizeObserver | null = null
let rafId: number | null = null

onMounted(async () => {
  await refresh()
  setupAutoDock()
})
onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  window.removeEventListener('resize', scheduleRecalc as any)
  ro?.disconnect()
})

/* 刷新推荐：首次需先加载随机池，随后按 props.count 抽样 */
const refresh = async () => {
  if (!ready.value) {
    await load()        // 只在首次时加载随机池
    ready.value = true
  }
  items.value = sample(Math.max(1, Math.min(6, props.count || 6)))
  scheduleRecalc()       // 刷新后重算布局
}

/* 初始化“靠右固定/响应式”逻辑（仅在 dockRight 为真时启用） */
function setupAutoDock() {
  if (!props.dockRight || !dockEl.value) return
  window.addEventListener('resize', scheduleRecalc, { passive: true })
  ro = new ResizeObserver(scheduleRecalc)
  ro.observe(document.documentElement)
  scheduleRecalc()
}

/* rAF 调度：把多次触发的计算合并为一次 */
function scheduleRecalc() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    applyDockLayout()   // 计算外层容器的几何（位置/宽高）
    applyGridLayout()   // 计算内部网格的列数/行高/可展示数等
  })
}

/* 外层尺寸：正文右缘→屏幕右缘，写入 CSS 变量用于 fixed 定位 */
function applyDockLayout() {
  const host = dockEl.value!
  const vw = window.innerWidth
  const vh = window.innerHeight

  const rootStyle = getComputedStyle(document.documentElement)
  const contentW =
    parseFloat((rootStyle.getPropertyValue('--content-width') || '').replace('px', '')) || 780

  const hostStyle = getComputedStyle(host)
  const GAP = parseFloat(hostStyle.getPropertyValue('--dock-gap') || '24')
  const RIGHT_SAFE = parseFloat(hostStyle.getPropertyValue('--dock-right-safe') || '16')
  const TOP = parseFloat(hostStyle.getPropertyValue('--dock-top') || '84')
  const BOTTOM_SAFE = parseFloat(hostStyle.getPropertyValue('--dock-bottom-safe') || '16')

  const left = Math.round((vw - contentW) / 2 + contentW + GAP)
  const minWidth = 260
  const width = Math.max(minWidth, vw - left - RIGHT_SAFE)
  const height = Math.max(0, vh - TOP - BOTTOM_SAFE)

  host.style.setProperty('--dock-left', left + 'px')
  host.style.setProperty('--dock-width', width + 'px')
  host.style.setProperty('--dock-height', height + 'px')
}

/* 内部网格：依据可用空间挑选最佳 c×r，并写入轨道尺寸与展示条数 */
function applyGridLayout() {
  const host = dockEl.value!
  const list = listEl.value!

  const hostStyle = getComputedStyle(host)
  const outerW = parseFloat(hostStyle.getPropertyValue('--dock-width') || '0')
  const outerH = parseFloat(hostStyle.getPropertyValue('--dock-height') || '0')

  const PAD = 12 * 2
  const listStyle = getComputedStyle(list)

  const gapX =
    parseFloat(listStyle.getPropertyValue('column-gap') || '') ||
    parseFloat(listStyle.getPropertyValue('gap') || '') ||
    20
  const gapY =
    parseFloat(listStyle.getPropertyValue('row-gap') || '') ||
    parseFloat(listStyle.getPropertyValue('gap') || '') ||
    20

  const SOFT_X = parseFloat(hostStyle.getPropertyValue('--grid-soft-margin-x') || '12')
  const SOFT_Y = parseFloat(hostStyle.getPropertyValue('--grid-soft-margin-y') || '12')

  const availW = Math.max(0, outerW - PAD - SOFT_X * 2)
  // 不扣标题高度；让 sb-scale-wrap 使用完整可用高
  const availH = Math.max(0, outerH - PAD - SOFT_Y * 2)

  // 预设候选网格（优先展示更多条）
  const candidates = [
    { c: 2, r: 3 },
    { c: 1, r: 3 },
    { c: 2, r: 2 },
    { c: 1, r: 2 },
    { c: 1, r: 1 },
  ]

  const ratio = parseFloat(hostStyle.getPropertyValue('--card-ratio') || '') || 1.25

  let best = { c: 1, r: 1, w: 0, h: 0, n: 1, gridW: 0, gridH: 0 }
  for (const { c, r } of candidates) {
    if (c > r) continue
    const wByW = (availW - gapX * (c - 1)) / c
    const hByH = (availH - gapY * (r - 1)) / r
    const wByH = hByH / ratio
    const cardW = Math.floor(Math.max(0, Math.min(wByW, wByH)))
    const cardH = Math.floor(cardW * ratio)
    if (cardW <= 0 || cardH <= 0) continue

    const gridW = c * cardW + (c - 1) * gapX
    const gridH = r * cardH + (r - 1) * gapY
    const n = c * r
    const area = cardW * cardH
    const bestArea = best.w * best.h
    const better = n > best.n || (n === best.n && area > bestArea)
    if (better) best = { c, r, w: cardW, h: cardH, n, gridW, gridH }
  }

  const showN = Math.max(0, Math.min(best.n, items.value.length, 6))
  itemsShown.value = items.value.slice(0, showN)

  // 写回 gap / 宽高 / 轨道
  list.style.columnGap = `${gapX}px`
  list.style.rowGap = `${gapY}px`
  list.style.width = `${best.gridW}px`
  list.style.marginLeft = 'auto'
  list.style.marginRight = 'auto'
  list.style.gridTemplateColumns = `repeat(${best.c}, ${best.w}px)`
  list.style.gridAutoRows = `${best.h}px`

  // 写入总高度 & 单卡尺寸（用于上下居中与字体联动）
  list.style.height = `${best.gridH}px`
  host.style.setProperty('--card-w', `${best.w}px`)
  host.style.setProperty('--card-h', `${best.h}px`)

  // 告诉样式：可用高/网格总高/总宽/纵向行距
  host.style.setProperty('--viewport-h', `${availH}px`)
  host.style.setProperty('--grid-h', `${best.gridH}px`)
  host.style.setProperty('--grid-w', `${best.gridW}px`)
  host.style.setProperty('--grid-gap-y', `${gapY}px`)

  // 动态估算可展示摘要行数，并回写给 CSS 变量
  const cardPadding = 20
  const baseFont = Math.max(10, Math.min(16, best.w * 0.08))
  const titleFont = baseFont * 1.1
  const titleLineHeight = 1.2
  const titleBlock = titleFont * titleLineHeight + 4
  const availTextH = Math.max(0, best.h - cardPadding - titleBlock)
  const bodyLineH = baseFont * 1.6
  const lines = Math.max(1, Math.floor(availTextH / bodyLineH))
  host.style.setProperty('--f-base', `${baseFont}px`)
  host.style.setProperty('--excerpt-lines', String(lines))

  // 测量 header 自身高度，写入 --header-h，防止与网格重叠
  const headerH = (titleEl.value?.getBoundingClientRect().height || 0)
  host.style.setProperty('--header-h', `${headerH}px`)
}

/* 仅用于模板 class 绑定，便于少写 props.dockRight */
const dockRight = props.dockRight
</script>

<style scoped>
.random-sidebar {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;

  /* 外框完全透明 */
  border: none;
  background: transparent;
  box-shadow: none;

  /* 整块（标题+列表）在侧栏高度内上下居中（基础居中，sb-list 再做精确居中） */
  display: flex;
  flex-direction: column;
  justify-content: center;

  --dock-gap: 80px;
  --dock-right-safe: 50px;
  --dock-top: 84px;
  --dock-bottom-safe: 16px;
  --grid-soft-margin-x: 12px;
  --grid-soft-margin-y: 12px;
  --card-ratio: 1.25;

  /* header 与网格顶边的间距（默认取行距，JS 会把行距写入 --grid-gap-y） */
  --header-gap: var(--grid-gap-y, 20px);

  /* 由 JS 写入：用于绝对定位 */
  --grid-w: auto;
  --grid-h: 0px;
  --viewport-h: 100%;
  --header-h: 0px;
}

.random-sidebar.sticky {
  position: sticky;
  top: var(--dock-top, 84px);
}

@media (min-width: 1200px) {
  .random-sidebar.dock {
    position: fixed;
    top: var(--dock-top, 84px);
    left: var(
      --dock-left,
      calc((100vw - var(--content-width, 780px)) / 2 + var(--content-width, 780px) + var(--dock-gap, 24px))
    );
    width: var(--dock-width, 300px);
    height: var(--dock-height, calc(100vh - var(--dock-top, 84px) - var(--dock-bottom-safe, 16px)));
    right: var(--dock-right-safe, 16px);
    overflow: hidden;
  }
  :global(.theme-container),
  :global(.page) {
    overflow: visible;
  }
}

/* 列表容器：高度使用 JS 写入的可用高，并作为绝对居中的定位容器 */
.random-sidebar .sb-scale-wrap {
  width: 100%;
  height: var(--viewport-h, 100%);
  position: relative;   /* 让 sb-list / sb-header 使用绝对定位参照它 */
}

/* 标题行：放在“网格顶边的上方”，预留自身高度 + 行距，且与网格左右对齐 */
.sb-header {
  position: absolute;
  /* 网格上沿 = 50% - grid-h/2；header 顶边 = 上沿 - header-h - header-gap */
  top: calc(50% - var(--grid-h, 0px) / 2 - var(--header-h, 0px) - var(--header-gap, 20px));
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;

  width: var(--grid-w, auto);               /* 与网格同宽 */
  display: flex;
  align-items: center;
  justify-content: space-between;           /* 标题贴左、按钮贴右 */
  gap: 8px;
  margin: 0;
}

.sb-title {
  font-weight: 800;
  font-size: 18px;
  line-height: 1.2;
  margin: 0;
}

/* 间距明确：列距/行距 + 绝对几何居中（以可用高度的中心线为轴扩散） */
.sb-list {
  list-style: none;
  padding: 0;
  margin: 0;

  display: grid;
  --grid-gap-x: 20px;
  --grid-gap-y: 20px;
  column-gap: var(--grid-gap-x);
  row-gap: var(--grid-gap-y);
  gap: var(--grid-gap-y) var(--grid-gap-x);
  grid-auto-flow: row;

  /* 精确居中：把网格中心放在容器中心 */
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  /* 宽高、列数、行高由 JS 写入 */
  min-height: 0;
  overflow: hidden;
}

/* 卡片（字体跟随卡片宽度联动） */
.sb-item {
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;

  /* 基准字号：JS 写回 --f-base；无则按卡片宽度估算并限幅 */
  font-size: var(--f-base, clamp(10px, calc(var(--card-w, 180px) * 0.08), 16px));
}
.sb-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  border-color: var(--c-border, #cbd5e1);
}

/* 标题：单行省略 */
.sb-item-title {
  font-weight: 600;
  font-size: 1.1em;
  color: var(--c-text, #111);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  margin-bottom: 4px;
}

/* 摘要（外层）：上下居中 + 左对齐；不做省略，避免布局冲突 */
.sb-item-excerpt {
  font-size: 0.95em;
  line-height: 1.6;
  color: var(--c-text-light, #65758b);

  /* 关键：用列方向的 Flex，纵向居中 + 水平靠左 */
  display: flex;
  flex-direction: column;
  justify-content: center;      /* 垂直居中 */
  align-items: flex-start;       /* 水平靠左 */

  flex: 1 1 auto;
  margin: 0;
  padding: 0 4px;
  overflow: hidden;              /* 防溢出 */
  text-align: left;
  white-space: normal;
  word-break: break-word;
}

/* 摘要（内层）：负责多行省略，保持左对齐 */
.sb-excerpt-inner {
  text-align: left;
  word-break: break-word;
  overflow: hidden;

  /* 多行省略 */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--excerpt-lines, 3);
  line-clamp: var(--excerpt-lines, 3);
}

/* 按钮（通用 & 内联修饰） */
.sb-refresh {
  width: auto;               /* 标题行里使用，不需要占满 */
  margin-top: 0;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  color: var(--c-text, #111);
  padding: 6px 10px;
  border-radius: 10px;
  cursor: pointer;
  flex-shrink: 0;
}

/* 修饰符：行内刷新按钮（暂无样式，占位备用） */
.sb-refresh--inline {
  --_noop: 1;
}

html[data-theme='dark'] .random-sidebar,
html[data-theme='dark'] .sb-item,
html[data-theme='dark'] .sb-refresh {
  border-color: #333;
  background: transparent;
  color: #e5e5e5;
}
html[data-theme='dark'] .sb-item { background: rgba(255,255,255,0.02); }
html[data-theme='dark'] .sb-item-excerpt { color: #b4bdc6; }

/* 小屏隐藏 */
@media (max-width: 1024px) {
  .random-sidebar { display: none; }
}

/* 空态 */
.random-sidebar.empty .sb-empty {
  font-size: 13px;
  color: var(--c-text-light, #65758b);
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
