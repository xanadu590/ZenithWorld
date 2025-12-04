<template>
  <!-- 只由 hovering / locked 控制显示 -->
  <div
    class="zw-tip-card"
    ref="tooltipRef"
    v-show="hovering || locked"
  >
    <!-- 右上角进度圆圈 -->
    <div
      class="tip-progress"
      :class="{ 'is-done': locked }"
      :style="{ '--progress': progress + '%' }"
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
        <ul class="meta limited-lines">
          <li>
            <span class="k">名称</span>
            <span class="v">{{ term }}</span>
          </li>
          <li>
            <span class="k">链接</span>
            <span class="v">{{ to }}</span>
          </li>

          <!-- 追加示例字段，确保有 6 行可显示，你可自行更改 -->
          <li><span class="k">类别</span><span class="v">—</span></li>
          <li><span class="k">地区</span><span class="v">—</span></li>
          <li><span class="k">别名</span><span class="v">—</span></li>
          <li><span class="k">标签</span><span class="v">—</span></li>
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
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps<{
  term: string
  to: string
  tooltip?: string
  first?: string
  avatar?: string
}>()

/** 状态：当前是否在“激活区域”（链接+卡片附近） / 是否已锁定 */
const tooltipRef = ref<HTMLElement | null>(null)
const hovering = ref(false)
const locked = ref(false)

/** 进度（0~100），驱动圆弧显示 */
const progress = ref(0)
const DURATION = 3000 // 原逻辑保持

let frameId: number | null = null

const clearTimer = () => {
  if (frameId !== null) {
    cancelAnimationFrame(frameId)
    frameId = null
  }
}

const startTimer = () => {
  clearTimer()
  progress.value = 0

  if (locked.value) return

  const start = performance.now()

  const step = (now: number) => {
    if (!hovering.value && !locked.value) {
      clearTimer()
      progress.value = 0
      return
    }

    const elapsed = now - start
    const pct = Math.min(100, (elapsed / DURATION) * 100)
    progress.value = pct

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

const setupHoverSource = async () => {
  await nextTick()
  const el = tooltipRef.value
  if (!el) return

  const wrapper = el.closest('.zw-auto-link-wrap') as HTMLElement | null
  if (!wrapper) return

  const onEnter = () => {
    hovering.value = true
    if (!locked.value) startTimer()
  }

  const onLeave = () => {
    hovering.value = false
    if (!locked.value) {
      clearTimer()
      progress.value = 0
    }
  }

  wrapper.addEventListener('mouseenter', onEnter)
  wrapper.addEventListener('mouseleave', onLeave)

  onUnmounted(() => {
    wrapper.removeEventListener('mouseenter', onEnter)
    wrapper.removeEventListener('mouseleave', onLeave)
  })
}

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
/* ===== ★ 固定卡片大小：宽 2，高 3 ★ ===== */
.zw-tip-card {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translate(16px, -50%);

  width: 200px;   /* 宽 2 */
  height: 300px;  /* 高 3 */
  aspect-ratio: 2 / 3; /* 保持 2:3 比例 */

  overflow: hidden; /* 内容超出隐藏 */

  padding: 14px;
  border-radius: 14px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  box-shadow: 0 2px 12px rgba(0,0,0,.05);
  color: var(--c-text, #111);

  font-size: 0.8rem;
  line-height: 1.3;
  z-index: 9999;

  white-space: normal;
  word-break: break-word;
}

/* ===== 暗黑模式 ===== */
html[data-theme="dark"] .zw-tip-card {
  border-color: #333;
  background: var(--vp-c-bg-soft, #0b0f19);
  color: var(--c-text, #e5e5e5);
}

/* ===== 右上角进度圆圈 ===== */
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
  content: "";
  position: absolute;
  inset: 3px;
  border-radius: inherit;
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
}

.tip-progress.is-done {
  background: var(--vp-c-brand, #3b82f6);
}

/* ===== 标题 ===== */
.tip-title {
  margin-bottom: 8px;
  font-size: 1rem;
  font-weight: 700;
  text-align: center;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 第二行：图 + 信息 ===== */
.tip-top {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

/* 左图 */
.tip-avatar {
  flex: none;
  width: 72px;
  height: 108px;
  border-radius: 10px;
  border: 1px solid var(--c-border, #e5e7eb);
  overflow: hidden;
  background: #ccc;
}

.tip-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ===== ★ 右侧信息块：固定 6 行 + 省略号 ★ ===== */
.limited-lines {
  display: -webkit-box;
  -webkit-line-clamp: 6;  /* 固定 6 行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta {
  list-style: none;
  padding: 0;
  margin: 0;
}

.meta li {
  display: flex;
  gap: 4px;
  line-height: 1.2;
  overflow: hidden;
}

.k {
  flex: none;
  font-weight: 600;
}

.v {
  flex: 1;
  min-width: 0;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 第三行简介 ===== */
.tip-bottom {
  margin-top: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(0,0,0,0.05);

  height: 60px; /* 固定高度，让卡片整体更像 2:3 */
  overflow: hidden;
}

html[data-theme="dark"] .tip-bottom {
  background: rgba(255, 255, 255, 0.08);
}

.tip-summary {
  margin: 0;
  line-height: 1.3;

  /* 简介三行省略 */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>