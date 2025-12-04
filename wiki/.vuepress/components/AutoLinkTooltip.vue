<template>
  <!-- 只由 hovering / locked / isActive 控制显示 -->
  <div
    class="zw-tip-card"
    ref="tooltipRef"
    v-show="(hovering || locked) && isActive"
  >
    <!-- 右上角进度圆圈 -->
    <div
      class="tip-progress"
      :class="{ 'is-done': locked }"
      :style="{ '--progress': displayProgress + '%' }"
    ></div>

    <!-- 第 1 行：标题 -->
    <div class="tip-title">
      {{ term }}
    </div>

    <!-- 第 2 行：左图右信息 -->
    <div class="tip-top">
      <div v-if="avatar" class="tip-avatar">
        < img :src="avatar" alt="avatar" loading="lazy" />
      </div>

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

    <!-- 第 3 行：灰底简介块 -->
    <div v-if="tooltip" class="tip-bottom">
      <b class="tip-label">简介：</b>
      <p class="tip-summary">
        {{ tooltip }}
      </p >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'

/**
 * 0. 全局共享状态（解决多卡片同时显示）
 * - 通过 globalThis.__ZW_TIP_STORE__ 挂一个全局 store
 * - 即使这个组件被打包成多个副本模块，也会共用同一份状态
 */
type TipStore = {
  activeId: ReturnType<typeof ref<number | null>>
  nextId: number
}

const g = globalThis as any
if (!g.__ZW_TIP_STORE__) {
  g.__ZW_TIP_STORE__ = {
    activeId: ref<number | null>(null),
    nextId: 1,
  } as TipStore
}
const tipStore = g.__ZW_TIP_STORE__ as TipStore
const activeId = tipStore.activeId

/**
 * 一、输入参数
 */
const props = defineProps<{
  term: string
  to: string
  tooltip?: string
  first?: string
  avatar?: string
}>()

/**
 * 二、每个实例自己的 id & 是否当前激活
 */
const myId = tipStore.nextId++ // 全局自增，确保跨副本也是唯一
const isActive = computed(() => activeId.value === myId)

/**
 * 三、实例级状态
 * hovering：鼠标是否在“触发区域”（链接 + 卡片附近）
 * locked：  进度圈转满后是否已经锁定（长显）
 */
const tooltipRef = ref<HTMLElement | null>(null)
const hovering = ref(false)
const locked = ref(false)

/**
 * 四、进度圈计时器
 */
const progress = ref(0)
const DURATION = 2000 // 2 秒
let frameId: number | null = null

/** 展示用进度：锁定时固定为 100%，避免视觉上“又转一圈” */
const displayProgress = computed(() =>
  locked.value ? 100 : progress.value
)

const clearTimer = () => {
  if (frameId !== null) {
    cancelAnimationFrame(frameId)
    frameId = null
  }
}

/**
 * 启动 2 秒倒计时：
 * - 每帧更新 progress
 * - 未锁定时鼠标离开：中途取消
 * - 满 100%：锁定（locked = true），进度圈变实心
 */
const startTimer = () => {
  clearTimer()
  progress.value = 0

  // 已经锁定就不再计时（保险）
  if (locked.value) return

  const start = performance.now()

  const step = (now: number) => {
    // 如果已经锁定，强制停表 & 进度=100
    if (locked.value) {
      progress.value = 100
      clearTimer()
      return
    }

    // 未锁定 & 不在 hover 区域：中途中止
    if (!hovering.value) {
      clearTimer()
      progress.value = 0
      return
    }

    const elapsed = now - start
    const pct = Math.min(100, (elapsed / DURATION) * 100)
    progress.value = pct

    if (pct >= 100) {
      // 计时结束：锁定卡片，进入长显状态
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
 * 点击页面其它地方：
 * - 如果当前处于锁定状态，则关闭卡片并重置
 */
const handleDocumentClick = (e: MouseEvent) => {
  if (!locked.value) return

  const el = tooltipRef.value
  if (el && !el.contains(e.target as Node)) {
    locked.value = false
    hovering.value = false
    progress.value = 0
    clearTimer()

    // 如果当前关闭的是激活卡片，则把 activeId 也清掉
    if (activeId.value === myId) {
      activeId.value = null
    }
  }
}

/**
 * 绑定 hover 源：
 * - 找到最近的 .zw-auto-link-wrap（自动内链外层容器）
 * - 在它上面监听 mouseenter / mouseleave
 *
 * 注意：解绑逻辑在外层 onUnmounted 注册，避免 Vue 对 async setup + 生命周期的警告
 */
let wrapperEl: HTMLElement | null = null
let onEnter: ((e: MouseEvent) => void) | null = null
let onLeave: ((e: MouseEvent) => void) | null = null

const setupHoverSource = async () => {
  await nextTick()
  const el = tooltipRef.value
  if (!el) return

  wrapperEl = el.closest('.zw-auto-link-wrap') as HTMLElement | null
  if (!wrapperEl) return

  onEnter = () => {
    // ⭐ 情况 1：当前激活的不是我（说明是换到“另一个链接”）
    if (activeId.value !== myId) {
      activeId.value = myId
      hovering.value = true
      locked.value = false      // 换链接时重新计时
      progress.value = 0
      startTimer()
      return
    }

    // ⭐ 情况 2：当前激活的就是我自己
    hovering.value = true

    if (locked.value) {
      // 已经锁定的自己：保持锁定，不重置、不重新计时
      return
    }

    // ⭐ 情况 3：自己但未锁定（比如之前计时中断）
    locked.value = false
    progress.value = 0
    startTimer()
  }

  onLeave = () => {
    hovering.value = false
    // 未锁定时离开：立即停表 & 清零进度
    if (!locked.value) {
      clearTimer()
      progress.value = 0
    }
    // 已锁定：保持显示，等点击页面其它区域再关闭
  }

  wrapperEl.addEventListener('mouseenter', onEnter)
  wrapperEl.addEventListener('mouseleave', onLeave)
}

/**
 * 生命周期挂载 / 卸载
 */
onMounted(() => {
  setupHoverSource()
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  clearTimer()
  document.removeEventListener('click', handleDocumentClick)

  // 解绑 hover 源事件（同步注册，避免 Vue 警告）
  if (wrapperEl && onEnter) {
    wrapperEl.removeEventListener('mouseenter', onEnter)
  }
  if (wrapperEl && onLeave) {
    wrapperEl.removeEventListener('mouseleave', onLeave)
  }

  // 如果卸载的是当前激活卡片，顺便把 activeId 清掉
  if (activeId.value === myId) {
    activeId.value = null
  }
})
</script>

<style scoped>
/* ===== 1) 卡片容器：对齐 RoleCard 的 2:3 尺寸 & 风格 ===== */
.zw-tip-card {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translate(16px, -50%);

  /* ⭐ 尺寸与 RoleCard 默认一致：220 × 330，比例 2:3 */
  width: 220px;
  height: 330px;

  box-sizing: border-box;
  padding: 14px; /* 与 RoleCard padding 一致 */

  border-radius: 14px;
  border: 2px solid var(--c-border, #6e9fff);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  color: var(--c-text, #111);

  font-size: 0.8rem; /* 与 RoleCard 统一的基础字号 */
  line-height: var(--card-line-height, 1); /* 与 RoleCard 一致 */

  z-index: 9999;

  white-space: normal;
  word-break: break-word;

  overflow: hidden; /* ⭐ 内容不允许撑大卡片 */
}

/* 暗色主题下保持和 RoleCard 一致 */
html[data-theme='dark'] .zw-tip-card {
  border-color: #333;
  background: var(--vp-c-bg-soft, #0b0f19);
  color: var(--c-text, #e5e5e5);
}

/* ===== 2) 右上角进度圆圈（不动，只是视觉） ===== */
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

.tip-progress::before {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: inherit;
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
}

/* 锁定后：实心圆 */
.tip-progress.is-done {
  background: var(--vp-c-brand, #3b82f6);
}

/* ===== 3) 第 1 行：标题 —— 对齐 RoleCard.stacked .title-top ===== */
.tip-title {
  margin: -4px 0 8px;
  margin-bottom: var(--card-title-gap, 6px); /* 与 RoleCard 同名变量 */
  font-size: var(--card-title-size, 1rem); /* 默认 1rem，可用变量全局调 */
  font-weight: 700;
  line-height: 1.2;
  text-align: var(--card-title-align, center);
  color: #003a70; /* 深蓝色字体，可调 */

  /* ⭐ 居中（因为用 inline-block 会偏左） */
  margin-left: 50%;
  transform: translateX(-50%);
}

/* 上半部分天蓝色背景 */
.zw-tip-card::before {
  content: '';
  position: absolute;
  inset: 0; /* 覆盖整个卡片 */
  height: 10%; /* 上方带色区域高度，这里保持你原来的 10% */
  background: #c4e5ff; /* 你设定的天蓝色 */
  border-radius: 14px 14px 0 0; /* 与卡片圆角融合 */
  z-index: -1; /* 让内容在上面 */
}

/* ===== 4) 第 2 行：图片 + 基本信息 ===== */
.tip-top {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

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

/* ===== 5) 基本信息 meta —— 完全对齐 RoleCard 的变量名 + 再加省略号 ===== */
.meta {
  list-style: none;
  padding: 0;
  margin: 0;

  display: flex;
  flex-direction: column;
  gap: var(--card-meta-gap, 6px); /* 每两条信息之间的间距，与 RoleCard 同名变量 */

  font-size: var(--card-meta-size, 0.8rem); /* 默认 0.85rem，与 RoleCard 一致 */
  color: var(--card-meta-color, inherit);
}

/* 每一行信息：同时支持行高变量 + 省略号效果 */
.meta li {
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: var(--card-meta-line-height, 1.15);

  /* 为了右侧 .v 的省略号，整行不换行 + 超出隐藏 */
  overflow: hidden;
  white-space: nowrap;
}

.k {
  flex: none;
  font-weight: 600;
  color: var(--c-text-light, #65758b);
}

html[data-theme='dark'] .k {
  color: var(--c-text-light, #a8b3cf);
}

/* 右侧值：超出部分 ... */
.v {
  flex: 1;
  min-width: 0;
  color: inherit;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 6) 第 3 行：底部简介块 —— 对齐 RoleCard.stacked .bottom ===== */
.tip-bottom {
  margin-top: var(--card-section-gap, 8px); /* 第二行与第三行间距（与 RoleCard 同名） */

  background: var(--card-bottom-bg, rgba(0, 0, 0, 0.05));
  border-radius: 8px;

  padding-top: var(
    --card-summary-padding-y,
    var(--card-summary-gap, 8px)
  );
  padding-bottom: var(
    --card-summary-padding-y,
    var(--card-summary-gap, 70px)
  );
  padding-left: var(
    --card-summary-padding-x,
    var(--card-summary-gap, 10px)
  );
  padding-right: var(
    --card-summary-padding-x,
    var(--card-summary-gap, 10px)
  );

  font-size: var(--card-summary-size, 0.85rem);
  color: var(--card-summary-color, inherit);
  text-align: var(--card-summary-align, left);
}

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