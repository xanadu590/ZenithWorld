<!-- .vuepress/components/RandomCard.vue -->
<template>
  <ClientOnly>
    <div class="random-card" v-if="ready">
      <button class="nav-btn prev" :disabled="history.length===0" @click="showPrev">←</button>

      <RandomCardBase
        :title="current?.title || current?.href"
        :excerpt="current?.excerpt || simpleExcerpt(current)"
        @click="goCurrent"
      />

      <button class="nav-btn next" :disabled="candidates.length===0" @click="showNext">→</button>
    </div>

    <div class="random-card empty" v-else>
      <span>暂无推荐文章。</span>
      <button class="retry" @click="init">重试</button>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRandomArticles } from '../composables/useRandomArticles'
import RandomCardBase from './RandomCardBase.vue'

const { ready, candidates, current, history, init, showNext, showPrev, goCurrent } = useRandomArticles(3)
onMounted(init)

function simpleExcerpt(c?: any): string {
  if (!c) return ''
  if (c.excerpt && c.excerpt.trim()) return c.excerpt.trim()
  if (c.title && c.title.trim() && c.title.trim() !== c.href) return c.title.trim()
  const m = c.href.match(/\/([^\/]+)\.html$/)
  return m ? decodeURIComponent(m[1]) : c.href
}
</script>

<style scoped>
.random-card {
  width: 100%;
  display: flex;
  align-items: stretch;
  gap: 8px;
  margin: 16px 0 0;
}
.nav-btn {
  flex: none;
  width: 44px;
  min-height: 96px;
  border-radius: 10px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  color: var(--c-text, #111);
  cursor: pointer;
  transition: background .15s ease, border-color .15s ease, transform .1s ease;
}
.nav-btn:hover:enabled { transform: translateY(-1px); }
.nav-btn:disabled { opacity: .5; cursor: not-allowed; }
.random-card.empty {
  width: 100%;
  margin: 16px 0 0;
  padding: 10px 12px;
  border: 1px dashed var(--c-border, #e5e7eb);
  border-radius: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
}
.retry {
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
}
</style>