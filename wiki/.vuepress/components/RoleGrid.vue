<template>
  <!-- 网格容器：把插槽里的卡片平铺，自动换行 -->
  <div class="role-grid">
    <slot />
  </div>
</template>

<script setup lang="ts">
// 纯展示组件，无脚本逻辑
</script>

<style scoped>
.role-grid {
  /* Flex 版本 */
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}

/* 如果希望卡片有统一宽度，可以这里统一管控 */
:deep(.box) {
  max-width: 20px;   /* 统一每张卡的最大宽度 */
}
</style>