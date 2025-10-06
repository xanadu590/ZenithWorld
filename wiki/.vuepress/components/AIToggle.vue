<!-- .vuepress/components/AIToggle.vue -->
<template>
  <ClientOnly>
    <button class="ai-toggle" @click="toggle" :title="ai.show ? '点击隐藏 AI 图片' : '点击显示 AI 图片'">
      <span v-if="ai.show">🔓 显示 AI 图</span>
      <span v-else>🔒 隐藏 AI 图</span>
    </button>
  </ClientOnly>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { AI_INJECT_KEY } from '../client'
const ai = inject(AI_INJECT_KEY) as { show: boolean; setShow: (v:boolean)=>void }
const toggle = () => ai.setShow(!ai.show)
</script>

<style scoped>
/* 使用 theme-hope 提供的 CSS 变量，自动随明暗主题变化 */
.ai-toggle {
  position: fixed;
  z-index: 9999;
  top: 12px;
  right: 300px;
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;

  /* 使用主题变量：这些会随 theme-hope 自动切换 */
  color: var(--c-text, #111);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  border: 1px solid var(--c-border, #e5e7eb);

  /* 阴影与过渡 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: 
    background 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

/* 悬停状态：增加蓝色边框和轻微上移 */
.ai-toggle:hover {
  border-color: var(--c-brand, #3a7bff);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

/* 暗色模式适配：跟随 theme-hope 的 data-theme 属性 */
html[data-theme='dark'] .ai-toggle {
  background: var(--vp-c-bg-soft, #1e1e1e);
  color: var(--c-text, #eee);
  border-color: var(--c-border, #333);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

html[data-theme='dark'] .ai-toggle:hover {
  border-color: var(--c-brand, #5c9dff);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
}
</style>