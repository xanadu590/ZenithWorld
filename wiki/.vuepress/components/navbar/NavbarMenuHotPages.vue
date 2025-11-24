<template>
  <!-- 下拉菜单中的一项 -->
  <button class="menu-item" @click.stop="open = true">
    🔥 热门文章
  </button>

  <!-- 弹窗，用 teleport 挂到 body 下，避免被导航栏布局影响 -->
  <teleport to="body">
    <div
      v-if="open"
      class="hot-modal-mask"
      @click.self="close"
    >
      <div class="hot-modal">
        <header class="hot-modal-header">
          <span class="hot-modal-title">🔥 热门文章</span>
          <button class="hot-modal-close" @click="close">✕</button>
        </header>

        <div class="hot-modal-body">
          <!-- 直接复用现有 HotPages 组件 -->
          <HotPages :title="undefined" :limit="10" />
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HotPages from '../../plugins/recommended-articles/HotPages.vue'

const open = ref(false)

const close = () => {
  open.value = false
}
</script>

<style scoped>
/* 遮罩层 */
.hot-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 弹窗主体 */
.hot-modal {
  width: min(640px, 100% - 32px);
  max-height: min(520px, 100% - 64px);
  background: var(--vp-c-bg, #fff);
  border-radius: 12px;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.25);
  border: 1px solid var(--c-border, #e5e7eb);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 头部 */
.hot-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--c-border, #e5e7eb);
}

.hot-modal-title {
  font-weight: 600;
  font-size: 14px;
}

.hot-modal-close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 4px;
}

/* 内容区域 */
.hot-modal-body {
  padding: 8px 14px 12px;
  overflow: auto;
}

/* 暗色模式适配 */
html[data-theme='dark'] .hot-modal {
  background: #1f1f1f;
  border-color: #333;
}
</style>