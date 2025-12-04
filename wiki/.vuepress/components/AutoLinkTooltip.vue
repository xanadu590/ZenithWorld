<template>
  <!-- 加 ref 和 is-locked class -->
  <div
    ref="root"
    class="zw-tip-card"
    :class="{ 'is-locked': locked }"
  >
    <!-- 右上角进度圈 -->
    <div class="tip-progress"></div>

    <!-- 第 1 行：标题 -->
    <div class="tip-title">
      {{ term }}
    </div>

    <!-- 第 2 行：左图右信息 -->
    <div class="tip-top">
      <!-- 左侧头像：从插件传来的 avatar（正文第一张图片） -->
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
            <!-- 简单展示路径；要做成可点击跳转可以以后再改成 RouterLink -->
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
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  term: string
  to: string
  tooltip?: string
  first?: string
  /** 自动内链插件传来的头像地址（正文第一张图片） */
  avatar?: string
}>()

// 根元素引用
const root = ref<HTMLElement | null>(null)

// 是否已经“锁定”显示
const locked = ref(false)

// 悬停计时器（3 秒）
let hoverTimer: ReturnType<typeof setTimeout> | null = null

function handleHoverStart() {
  // 已经锁定就不重复计时
  if (locked.value) return

  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }

  // 悬停 3 秒后锁定
  hoverTimer = setTimeout(() => {
    locked.value = true
    hoverTimer = null
  }, 3000)
}

function handleHoverEnd() {
  // 如果已经锁定，就不要因为移出而解锁
  if (locked.value) return

  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
}

// 点击页面其它地方时，取消锁定
function handleDocumentClick(e: MouseEvent) {
  const rootEl = root.value
  if (!rootEl) return

  // wrapper 是父节点：<span class="zw-auto-link-wrap">
  const wrap = rootEl.parentElement
  const target = e.target as Node | null

  // 点在 wrapper 里面（文字、卡片） → 不解除锁定
  if (wrap && target && wrap.contains(target)) {
    return
  }

  // 点到外面 → 解除锁定
  locked.value = false
}

onMounted(() => {
  const rootEl = root.value
  if (!rootEl) return

  // wrapper：<span class="zw-auto-link-wrap">，把 hover 事件绑在它身上
  const wrap = rootEl.parentElement
  if (!wrap) return

  wrap.addEventListener('mouseenter', handleHoverStart)
  wrap.addEventListener('mouseleave', handleHoverEnd)

  document.addEventListener('click', handleDocumentClick, true)
})

onUnmounted(() => {
  const rootEl = root.value
  if (rootEl) {
    const wrap = rootEl.parentElement
    if (wrap) {
      wrap.removeEventListener('mouseenter', handleHoverStart)
      wrap.removeEventListener('mouseleave', handleHoverEnd)
    }
  }
  document.removeEventListener('click', handleDocumentClick, true)

  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
})
</script>

<style scoped>
/* ===== 整体外框：缩小版 RoleCard 风格 ===== */
.zw-tip-card {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translate(16px, -50%);   /* 贴在链接右侧 */

  width: 260px;
  max-width: 320px;
  box-sizing: border-box;

  padding: 14px;
  border-radius: 14px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  box-shadow: 0 2px 12px rgba(0,0,0,.05);
  color: var(--c-text, #111);

  font-size: 0.8rem;
  line-height: 1.4;
  z-index: 9999;

  white-space: normal;
  word-break: break-word;

  display: none;   /* 默认隐藏，靠 .zw-auto-link-wrap:hover / .is-locked 控制显隐 */

  /* 为了给右上角进度圈留一点空间 */
  padding-top: 20px;
}

/* 右上角进度圈 */
.tip-progress {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 16px;
  height: 16px;
  border-radius: 999px;

  /* 初始是一个“圆弧”：只涂两段边框 */
  border: 2px solid transparent;
  border-top-color: var(--c-brand, #3eaf7c);
  border-right-color: var(--c-brand, #3eaf7c);

  /* 旋转动画：显示正在“读条” */
  animation: tip-spin 0.8s linear infinite;
}

/* 3 秒后 locked=true：变成完整圆圈，停止转动 */
.zw-tip-card.is-locked .tip-progress {
  border-color: var(--c-brand, #3eaf7c);
  animation: none;
}

/* 简单旋转 keyframes */
@keyframes tip-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 暗色主题下保持和 RoleCard 一致 */
html[data-theme="dark"] .zw-tip-card {
  border-color: #333;
  background: var(--vp-c-bg-soft, #0b0f19);
  color: var(--c-text, #e5e5e5);
}

/* ===== 第 1 行：标题（参考 .role-card.stacked .title-top） ===== */
.tip-title {
  margin: -2px 0 8px;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
}

/* ===== 第 2 行：图片 + 基本信息 ===== */
.tip-top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

/* 左侧头像框：尺寸参考 RoleCard 的头像，略缩小一点 */
.tip-avatar {
  flex: none;
  width: 72px;
  height: 108px;
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

.meta {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8rem;
}

.meta li {
  display: flex;
  align-items: baseline;
  gap: 4px;
  line-height: 1.2;
}

.k {
  flex: none;
  font-weight: 600;
  color: var(--c-text-light, #65758b);
}

html[data-theme="dark"] .k {
  color: var(--c-text-light, #a8b3cf);
}

.v {
  flex: 1;
  min-width: 0;
  color: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 第 3 行：底部简介块（参考 .role-card.stacked .bottom） ===== */
.tip-bottom {
  margin-top: 8px;
  background: var(--card-bottom-bg, rgba(0, 0, 0, 0.05));
  border-radius: 8px;

  padding-top:    var(--card-summary-padding-y, 6px);
  padding-bottom: var(--card-summary-padding-y, 10px);
  padding-left:   var(--card-summary-padding-x, 10px);
  padding-right:  var(--card-summary-padding-x, 10px);

  font-size: var(--card-summary-size, 0.85rem);
  color: var(--card-summary-color, inherit);
  text-align: left;
}

html[data-theme="dark"] .tip-bottom {
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