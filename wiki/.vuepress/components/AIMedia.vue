<template>
  <div class="ai-media">
    < img :src="src" :alt="alt" :width="width" :height="height" loading="lazy" />
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  src: string
  alt?: string
  width?: string | number
  height?: string | number
}>()
</script>

<style scoped>
.ai-media { display:inline-block; text-align:center; margin:.5rem; }
.ai-media img { max-width:100%; height:auto; border-radius:6px; }
</style>