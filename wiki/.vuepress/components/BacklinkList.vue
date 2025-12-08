<template>
  <ClientOnly>
    <!-- 没加载完 or 没数据：啥也不渲染，避免空白块 -->
    <section v-if="!loading && items.length" class="zw-backlinks">
      <h2 class="zw-backlinks-title">
        📎 提到本条目的页面
      </h2>

      <ul class="zw-backlinks-list">
        <li
          v-for="item in items"
          :key="item.path"
          class="zw-backlinks-item"
        >
          <RouterLink :to="item.path" class="zw-backlinks-link">
            {{ item.title }}
          </RouterLink>
        </li>
      </ul>
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePageData, withBase } from '@vuepress/client'

interface BacklinkItem {
  path: string
  title: string
}

const page = usePageData()

const loading = ref(true)
const items = ref<BacklinkItem[]>([])
const error = ref<null | string>(null)

onMounted(async () => {
  try {
    const url = withBase('/backlinks/index.json')
    const res = await fetch(url)

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const all = (await res.json()) as Record<string, BacklinkItem[]>
    const key = page.value.path // 和插件里 recordBacklink 用的是同一套 page.path

    items.value = all[key] ?? []
  } catch (e: any) {
    console.warn('[BacklinksList] load error:', e)
    error.value = String(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.zw-backlinks {
  margin-top: 2.5rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, rgba(0, 0, 0, 0.02));
}

html[data-theme='dark'] .zw-backlinks {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.75);
}

.zw-backlinks-title {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
}

.zw-backlinks-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.zw-backlinks-item + .zw-backlinks-item {
  margin-top: 0.35rem;
}

.zw-backlinks-link {
  text-decoration: none;
  font-size: 0.95rem;
}

.zw-backlinks-link:hover {
  text-decoration: underline;
}
</style>
