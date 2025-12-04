<template>
  <div class="zw-tip-card">
    <div class="title">{{ term }}</div>
    <p class="summary">{{ tooltip }}</p >
  </div>
</template>

<script setup lang="ts">
defineProps<{
  term: string
  to: string
  tooltip?: string
  first?: string
}>()
</script>

<style scoped>
.zw-tip-card {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translate(12px, -50%);
  max-width: 320px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft, #fff);
  color: var(--vp-c-text, #222);
  box-shadow: 0 4px 16px rgba(0,0,0,.18);
  font-size: 12px;
  line-height: 1.5;
  z-index: 9999;
  display: none;
}

/* 父级是 .zw-auto-link-wrap，你可以用下面这种写法配合全局样式控制显示 */
</style>