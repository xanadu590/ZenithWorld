<template>
  <!--
    AutoLinkTooltip · 自动内链的悬停卡片
    显示规则：
    - hovering === true 或 locked === true 时显示
    - 悬停 2 秒后 locked = true，卡片进入“长显”状态
    - 点击页面其它任意位置（卡片外）时，如已 locked，则关闭并重置
  -->
  <div
    class="zw-tip-card"
    ref="tooltipRef"
    v-show="hovering || locked"
  >
    <!-- 右上角进度圆圈：显示 0% ~ 100% 的倒计时进度 -->
    <div
      class="tip-progress"
      :class="{ 'is-done': locked }"
      :style="{ '--progress': progress + '%' }"
    ></div>

    <!-- 第 1 行：标题（使用 term 文本） -->
    <div class="tip-title">
      {{ term }}
    </div>

    <!-- 第 2 行：左侧头像 + 右侧基本信息 -->
    <div class="tip-top">
      <!-- 左侧头像（可选） -->
      <div v-if="avatar" class="tip-avatar">
        < img :src="avatar" alt="avatar" loading="lazy" />
      </div>

      <!-- 右侧信息列表：名称 / 链接 等 -->
      <div class="tip-basic">
        <ul class="meta">
          <li>
            <span class="k">名称</span>
            <span class="v">{{ term }}</span>
          </li>
          <li>
            <span class="k">链接</span>
            <span class="v">{{ to }}</span>
          </li>

          <!-- 下面这些是你测试用的多行，我原样保留 -->
          <li>
            <span class="k">链接</span>
            <span class="v">{{ to }}</span>
          </li>
          <li>
            <span class="k">链接</span>
            <span class="v">{{ to }}</span>
          </li>
          <li>
            <span class="k">链接</span>
            <span class="v">{{ to }}</span>
          </li>
          <li>
            <span class="k">链接</span>
            <span class="v">{{ to }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 第 3 行：灰底简介块（可选，tooltip 有内容时显示） -->
    <div v-if="tooltip" class="tip-bottom">
      <b class="tip-label">简介：</b>
      <p class="tip-summary">
        {{ tooltip }}
      </p >
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ==========================
 * 1. Props 定义
 * ==========================
 *
 * term    ：术语 / 名称（卡片标题 + “名称”字段）
 * to      ：目标链接地址（用于显示在“链接”字段）
 * tooltip ：简介文本（存在时显示第 3 行灰底块）
 * first   ：预留字段（当前逻辑未使用）
 * avatar  ：头像图片地址（有值时显示左侧图片区）
 */
const props = defineProps<{
  term: string
  to: string
  tooltip?: string
  first?: string
  avatar?: string
}>()

import { ref, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * ==========================
 * 2. 状态：显示 / 悬停 / 锁定
 * ==========================
 *
 * tooltipRef：卡片 DOM 引用，用于判断点击是否发生在卡片外
 * hovering  ：当前鼠标是否处于“激活区域”（链接 + 卡片）
 * locked    ：是否已“锁定显示”
 *             - false：需 hover 才显示
 *             - true ：即使离开 hover，只要没点击页面其它位置，就一直显示
 */
const tooltipRef = ref<HTMLElement | null>(null)
const hovering = ref(false)
const locked = ref(false)

/**
 * ==========================
 * 3. 倒计时进度（用于右上角进度圆圈）
 * ==========================
 *
 * progress：0 ~ 100，表示 0% ~ 100% 的耗时
 * DURATION：倒计时时长（毫秒），这里是 2000ms = 2 秒
 */
const progress = ref(0)
const DURATION = 2000 // 2 秒

let frameId: number | null = null

/** 清除 requestAnimationFrame 计时器 */
const clearTimer = () => {
  if (frameId !== null) {
    cancelAnimationFrame(frameId)
    frameId = null
  }
}

/**
 * 开始 2 秒倒计时：
 * - 每帧更新 progress（驱动进度圆圈）
 * - 若在倒计时过程中鼠标离开激活区域，则中途取消并重置
 * - 进度到达 100% 时，将 locked 置为 true，卡片进入“长显”状态
 */
const startTimer = () => {
  clearTimer()
  progress.value = 0

  // 已经锁定的卡片不再重复计时
  if (locked.value) return

  const start = performance.now()

  const step = (now: number) => {
    // 未锁定且已离开 hover 区域：中途取消进度
    if (!hovering.value && !locked.value) {
      clearTimer()
      progress.value = 0
      return
    }

    const elapsed = now - start
    const pct = Math.min(100, (elapsed / DURATION) * 100)
    progress.value = pct

    // 进度走完：锁定卡片
    if (pct >= 100) {
      locked.value = true
      progress.value = 100
      clearTimer()
      return
    }

    frameId = requestAnimationFrame(step)
  }

  frameId = requestAnimationFrame(step)
}

/**
 * ==========================
 * 4. 点击页面其它部分时的处理
 * ==========================
 *
 * 仅在 locked === true 时生效：
 * - 如果点击位置不在当前 tooltip 内部：
 *   - 解除 locked
 *   - hovering = false
 *   - 重置 progress，清除计时器
 */
const handleDocumentClick = (e: MouseEvent) => {
  if (!locked.value) return

  const el = tooltipRef.value
  if (el && !el.contains(e.target as Node)) {
    locked.value = false
    hovering.value = false
    progress.value = 0
    clearTimer()
  }
}

/**
 * ==========================
 * 5. 绑定 hover 源（触发区域）
 * ==========================
 *
 * 逻辑：
 * - 找到离 tooltip 最近的 .zw-auto-link-wrap（自动内链外层容器）
 * - 在该容器上监听 mouseenter / mouseleave
 *
 * 行为：
 * - mouseenter：
 *     hovering = true
 *     如果还没锁定，开始 2 秒倒计时
 * - mouseleave：
 *     hovering = false
 *     若未锁定，则立即隐藏并清零进度
 *     若已锁定，则保持显示（直到点击页面其它位置）
 */
const setupHoverSource = async () => {
  await nextTick()

  const el = tooltipRef.value
  if (!el) return

  const wrapper = el.closest('.zw-auto-link-wrap') as HTMLElement | null
  if (!wrapper) return

  const onEnter = () => {
    hovering.value = true
    // 再次进入，如果尚未锁定，则重新计时
    if (!locked.value) {
      startTimer()
    }
  }

  const onLeave = () => {
    hovering.value = false
    // 未锁定时离开：立刻隐藏 + 清零进度
    if (!locked.value) {
      clearTimer()
      progress.value = 0
    }
    // 已锁定：继续保持显示，由点击页面其它区域来关闭
  }

  wrapper.addEventListener('mouseenter', onEnter)
  wrapper.addEventListener('mouseleave', onLeave)

  onUnmounted(() => {
    wrapper.removeEventListener('mouseenter', onEnter)
    wrapper.removeEventListener('mouseleave', onLeave)
  })
}

/**
 * ==========================
 * 6. 生命周期：挂载 / 卸载
 * ==========================
 *
 * onMounted：
 *  - 建立与 hover 源的绑定（setupHoverSource）
 *  - 监听整个文档的 click，用于“点击空白关闭锁定卡片”
 *
 * onUnmounted：
 *  - 清理计时器
 *  - 移除 click 监听（hover 源的监听在 setupHoverSource 内部清理）
 */
onMounted(() => {
  setupHoverSource()
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  clearTimer()
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
/**
 * ==========================
 * 1) 卡片整体容器样式
 * ==========================
 *
 * - 固定宽高：220 × 330（与 RoleCard 保持 2:3 比例）
 * - 通过 absolute + transform 贴在链接右侧中部
 * - 带圆角、边框、阴影，外观统一
 */
.zw-tip-card {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translate(16px, -50%);

  /* 固定卡片尺寸：宽 220，高 330 */
  width: 220px;
  height: 330px;

  box-sizing: border-box;
  padding: 14px;

  border-radius: 14px;
  border: 2px solid var(--c-border, #6e9fff); /* 外轮廓框线：略带蓝色 */

  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  color: var(--c-text, #111);

  font-size: 0.8rem;                    /* 与 RoleCard 统一的基础字号 */
  line-height: var(--card-line-height, 1); /* 行高变量，默认 1 */

  z-index: 9999;

  white-space: normal;
  word-break: break-word;

  overflow: hidden; /* 不允许内部内容撑破卡片 */
}

/* 暗色主题下的外观保持与 RoleCard 一致 */
html[data-theme='dark'] .zw-tip-card {
  border-color: #333;
  background: var(--vp-c-bg-soft, #0b0f19);
  color: var(--c-text, #e5e5e5);
}

/**
 * ==========================
 * 2) 上半部分背景色（天蓝）
 * ==========================
 *
 * - 使用 ::before 在卡片内绘制一块天蓝色背景
 * - 通过 height 控制占比（目前是 10%，可调）
 */
.zw-tip-card::before {
  content: '';
  position: absolute;
  inset: 0;                 /* 覆盖卡片区域 */
  height: 10%;              /* 上方高度占比（此处为整体高度的 10%） */
  background: #c4e5ff;      /* 天蓝色 */
  border-radius: 14px 14px 0 0;
  z-index: -1;              /* 让内容显示在上面 */
}

/**
 * ==========================
 * 3) 右上角进度圆圈
 * ==========================
 *
 * - 使用 conic-gradient 画扇形进度
 * - 通过自定义属性 --progress（0%~100%）控制
 */
.tip-progress {
  position: absolute;
  right: 6px;
  top: 6px;
  width: 20px;
  height: 20px;
  border-radius: 999px;

  background:
    conic-gradient(
      var(--vp-c-brand, #3b82f6) var(--progress, 0%),
      transparent 0
    );
}

/* 内圈遮挡，形成环形效果 */
.tip-progress::before {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: inherit;
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
}

/* 锁定后：用实心圆表示“已完成” */
.tip-progress.is-done {
  background: var(--vp-c-brand, #3b82f6);
}

/**
 * ==========================
 * 4) 第 1 行：标题
 * ==========================
 *
 * - 文本来自 {{ term }}
 * - 通过 margin 控制与卡片顶部 / 第二行的距离
 * - 通过 CSS 变量可全局调节字号 / 对齐方式
 */
.tip-title {
  margin: -4px 0 8px;
  margin-bottom: var(--card-title-gap, 6px);

  font-size: var(--card-title-size, 1rem);
  font-weight: 700;
  line-height: 1.2;
  text-align: var(--card-title-align, center);
  color: #003a70;

  /* 使标题整体居中（避免 inline-block 偏移） */
  margin-left: 50%;
  transform: translateX(-50%);
}

/**
 * ==========================
 * 5) 第 2 行：图片 + 基本信息
 * ==========================
 *
 * .tip-top   ：水平布局容器，左图右文
 * .tip-avatar：头像盒子
 * .tip-basic ：右侧信息区域
 */
.tip-top {
  display: flex;
  align-items: flex-start;
  gap: 6px; /* 图片与文字区域的水平间距 */
}

/* 左侧头像框 */
.tip-avatar {
  flex: none;
  width: 80px;
  height: 120px;
  border-radius: 10px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: #f2f3f5;
  overflow: hidden;
}

.tip-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 50%;
}

/* 右侧基本信息区域 */
.tip-basic {
  flex: 1;
  min-width: 0;
}

/**
 * ==========================
 * 6) 基本信息列表（名称 / 链接等）
 * ==========================
 *
 * .meta     ：整个列表的容器
 * .meta li  ：每一行 key-value
 * .k        ：左侧“键”（如“名称”“链接”）
 * .v        ：右侧“值”（会根据宽度自动省略号）
 */
.meta {
  list-style: none;
  padding: 0;
  margin: 0;

  display: flex;
  flex-direction: column;
  gap: var(--card-meta-gap, 6px); /* 每两条信息之间的垂直间距 */

  font-size: var(--card-meta-size, 0.8rem);
  color: var(--card-meta-color, inherit);
}

/* 单行信息：行高 + 省略号效果 */
.meta li {
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: var(--card-meta-line-height, 1.15);

  /* 为了右侧 .v 的 ellipsis，整行不换行 + 超出隐藏 */
  overflow: hidden;
  white-space: nowrap;
}

/* 左侧“键” */
.k {
  flex: none;
  font-weight: 600;
  color: var(--c-text-light, #65758b);
}

html[data-theme='dark'] .k {
  color: var(--c-text-light, #a8b3cf);
}

/* 右侧“值”，超出部分以 ... 结尾 */
.v {
  flex: 1;
  min-width: 0;
  color: inherit;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/**
 * ==========================
 * 7) 第 3 行：灰底简介块（tooltip）
 * ==========================
 *
 * - 仅在 props.tooltip 有内容时显示
 * - 使用若干 CSS 变量控制
 *   - --card-section-gap          ：与上方第二行之间的外边距
 *   - --card-summary-gap / padding：内部上下左右内边距
 *   - --card-summary-size / color / align：字体大小 / 颜色 / 对齐
 */
.tip-bottom {
  margin-top: var(--card-section-gap, 8px); /* 与第二行之间的距离 */

  background: var(
    --card-bottom-bg,
    rgba(0, 0, 0, 0.05)
  );
  border-radius: 8px;

  padding-top: var(--card-summary-padding-y, var(--card-summary-gap, 8px));
  padding-bottom: var(--card-summary-padding-y, var(--card-summary-gap, 70px));
  padding-left: var(--card-summary-padding-x, var(--card-summary-gap, 10px));
  padding-right: var(--card-summary-padding-x, var(--card-summary-gap, 10px));

  font-size: var(--card-summary-size, 0.85rem);
  color: var(--card-summary-color, inherit);
  text-align: var(--card-summary-align, left);
}

/* 暗色模式下简介块的背景色 */
html[data-theme='dark'] .tip-bottom {
  background: var(--card-bottom-bg-dark, rgba(255, 255, 255, 0.08));
}

.tip-label {
  margin-right: 4px;
}

.tip-summary {
  display: inline;
  margin: 0;
}
</style>