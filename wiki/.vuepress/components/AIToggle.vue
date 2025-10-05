<template>
  <button class="ai-toggle" @click="toggle">
    {{ showAI ? '隐藏 AI 图' : '显示 AI 图' }}
  </button>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'

const showAI = ref(false)
const toggle = () => (showAI.value = !showAI.value)

provide('showAI', showAI)
</script>

<style scoped>
.ai-toggle {
  display: block;
  margin: 1rem auto;
  padding: 0.4rem 1rem;
  background: #444;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.ai-toggle:hover {
  background: #666;
}
</style>