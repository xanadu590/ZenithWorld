<!-- recommended-articles/HotPages.vue -->
<template>
  <div class="hot-pages">
    <h2 v-if="title">{{ title }}</h2>

    <div v-if="loading">Loading hot pages…</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <ul v-else>
      <li v-for="page in hotList" :key="page.path">
        <RouterLink :to="page.path">
          <span>{{ page.title }}</span>
          <span v-if="page.hotScore">🔥 {{ page.hotScore }}</span>
        </RouterLink>
        <span v-if="page.lastUpdated" class="date">
          {{ formatDate(page.lastUpdated) }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";

interface PageMeta {
  title: string;
  path: string;
  hotScore: number;
  lastUpdated: number | null;
}

const props = defineProps<{ title?: string; limit?: number; src?: string }>();

const pages = ref<PageMeta[]>([]);
const loading = ref(true);
const error = ref("");

const src = props.src ?? "/assets/recommended-pages.json";
const limit = props.limit ?? 10;

onMounted(async () => {
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    pages.value = await res.json();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});

const hotList = computed(() => {
  return [...pages.value]
    .sort(
      (a, b) =>
        (b.hotScore ?? 0) - (a.hotScore ?? 0) ||
        (b.lastUpdated ?? 0) - (a.lastUpdated ?? 0)
    )
    .slice(0, limit);
});

function formatDate(ts: number | null) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}
</script>

<style scoped>
.hot-pages ul li {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
}
.date {
  opacity: 0.6;
  font-size: 0.8em;
}
</style>