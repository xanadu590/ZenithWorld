<template>
  <button class="ai-toggle" @click="toggle">
    {{ showAI ? '隐藏 AI 图' : '显示 AI 图' }}
  </button>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'

// 全局状态：是否显示AI图
const showAI = ref(false)
const toggle = () => (showAI.value = !showAI.value)

// 提供给 AIMedia 使用
provide('showAI', showAI)
</script>

<style scoped>
.ai-toggle {
  background: #333;
  color: #fff;
  border: none;
  padding: .4rem .8rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background .2s;
}
.ai-toggle:hover {
  background: #555;
}
</style>