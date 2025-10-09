<!-- .vuepress/components/RandomCardBase.vue -->
<template>
  <div
    class="card-body"
    role="link"
    tabindex="0"
    @click="onClick"
    @keydown.enter.prevent="onClick"
    :title="title"
  >
    <div class="title">{{ title }}</div>
    <div class="excerpt">{{ excerpt }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  excerpt: string
}>()

const emit = defineEmits(['click'])
const onClick = () => emit('click')
</script>

<style scoped>
.card-body {
  flex: 1;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,.04);
  cursor: pointer;
  transition: box-shadow .15s ease, border-color .15s ease, transform .1s ease;
}
.card-body:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0,0,0,.08);
  border-color: var(--c-border, #cbd5e1);
}
.title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.excerpt {
  font-size: 14px;
  line-height: 1.6;
  color: var(--c-text-light, #65758b);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 2;
}
</style>