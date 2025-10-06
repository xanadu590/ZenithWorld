<template>
  <div class="timeline">
    <div
      v-for="item in items"
      :key="item.date"
      class="timeline-item"
    >
      <div class="timeline-date">{{ item.date }}</div>
      <div class="timeline-content">
        <h3>{{ item.title }}</h3>
        <p>{{ item.detail }}</p >
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
})
</script>

<style scoped>
.timeline {
  border-left: 2px solid #999;
  margin: 20px;
  padding-left: 20px;
}

.timeline-item {
  margin-bottom: 20px;
  position: relative;
}

.timeline-item::before {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--c-brand);
  position: absolute;
  left: -6px;
  top: 6px;
}

.timeline-date {
  font-weight: bold;
  margin-bottom: 4px;
}

.timeline-content h3 {
  margin: 0;
  color: var(--c-text-accent);
}
</style>