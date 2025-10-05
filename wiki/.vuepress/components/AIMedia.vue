<!-- .vuepress/components/AIMedia.vue -->
<template>
  <ClientOnly>
    <figure v-if="ai.show" class="ai-media">
      <img :src="src" :alt="alt" :width="width" :height="height" loading="lazy" />
      <figcaption v-if="caption">{{ caption }}</figcaption>
    </figure>

    <div v-else class="ai-placeholder">
      <slot name="placeholder">
        🔒 AI 生成内容已隐藏
      </slot>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { AI_INJECT_KEY } from '../client'

defineProps<{
  src: string
  alt?: string
  width?: string | number
  height?: string | number
  caption?: string
}>()

const ai = inject(AI_INJECT_KEY) as { show: boolean }
</script>

<style scoped>
.ai-media img{ border-radius: 6px; max-width: 100%; height: auto; }
.ai-media figcaption{ color:#666; font-size: 13px; margin-top: 6px; }
.ai-placeholder{
  border: 1px dashed #ddd; border-radius: 6px; padding: 10px; color:#666;
  text-align: center; font-size: 14px; background: #fafafa;
}
</style>