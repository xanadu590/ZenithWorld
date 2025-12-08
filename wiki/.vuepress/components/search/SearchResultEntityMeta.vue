<template>
  <div v-if="meta" class="mfs-entity-meta">
    <span v-if="meta.name">姓名：{{ meta.name }}</span>
    <span v-if="meta.shortName"> · 简称：{{ meta.shortName }}</span>
    <span v-if="meta.alias"> · 别名：{{ meta.alias }}</span>
    <span v-if="meta.enName"> · 英文名：{{ meta.enName }}</span>
    <span v-if="meta.title"> · 称号：{{ meta.title }}</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  meta?: {
    name?: string;
    alias?: string;
    shortName?: string;
    enName?: string;
    title?: string;
  };
}>();
</script>

<style scoped>
.mfs-entity-meta {
  margin-top: 0.15rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-2, #6b7280);
}
.mfs-entity-meta span + span {
  margin-left: 0.25rem;
}
</style>
