<template>
  <figure class="ai-media" :class="{ 'is-ai': isAI, 'blur': isAI && !revealed }">
    < img :src="src" :alt="alt" :loading="loading" />
    <figcaption v-if="isAI" class="ai-label" @click="toggle">
      🔒 AI 生成图（点击查看）
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { ref, defineProps } from 'vue'

const props = defineProps({
  src: String,
  alt: String,
  isAI: { type: Boolean, default: false },
  loading: { type: String, default: 'lazy' }
})

const revealed = ref(false)
const toggle = () => (revealed.value = !revealed.value)
</script>

<style scoped>
.ai-media {
  position: relative;
  overflow: hidden;
  display: inline-block;
  margin: 0 0.5rem;
}
.ai-media img {
  display: block;
  width: 100%;
  height: 420px;
  object-fit: cover;
  border-radius: 8px;
  transition: filter 0.4s ease;
}
.ai-media.blur img {
  filter: blur(18px) brightness(0.9);
}
.ai-label {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 14px;
  color: white;
  background: rgba(0, 0, 0, 0.45);
  cursor: pointer;
  border-radius: 0 0 8px 8px;
  padding: 4px;
}
</style>