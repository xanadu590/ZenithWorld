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

const ai = inject(AI_INJECT_KEY) as { show: boolean; setShow: (v: boolean) => void }
const toggle = () => ai.setShow(!ai.show)
</script>

<style scoped>
.ai-toggle{
  position: fixed;
  z-index: 9999;
  top: 12px;
  right: 16px;
  font-size: 13px;
  padding: 6px 10px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--c-bg, #fff);
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
}
</style>