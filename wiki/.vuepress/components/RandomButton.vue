<template>
  <!-- 只在客户端渲染，避免 SSR 报错 -->
  <ClientOnly>
    <button class="rnd-btn" @click="goRandom">🎲 随机一篇</button>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useRouter } from 'vuepress/client'
import { usePageData } from 'vuepress/client'

/**
 * 允许用户限定随机范围：
 * - scope：只从某个路径前缀中抽取，例如 "/zh/character/"
 * - exclude: 逗号分隔的排除前缀，默认排除 404、tag、分类页等
 */
const props = withDefaults(defineProps<{
  scope?: string
  exclude?: string
}>(), {
  exclude: '/404,/tag,/category,/timeline'
})

const router = useRouter()
const page = usePageData()

function getAllCandidates(): string[] {
  // 所有路由
  const all = router.getRoutes()
  // 转换成可访问路径
  let paths = all.map(r => r.path)

  // 过滤：限定前缀
  if (props.scope) {
    paths = paths.filter(p => p.startsWith(props.scope!))
  }

  // 过滤：排除前缀
  const excludes = props.exclude.split(',').map(s => s.trim()).filter(Boolean)
  if (excludes.length) {
    paths = paths.filter(p => !excludes.some(ex => p.startsWith(ex)))
  }

  // 过滤：去掉当前页、首页、空页
  paths = paths.filter(p =>
    p !== page.value.path &&
    p !== '/' &&
    !/\.map$/.test(p)
  )

  return paths
}

function goRandom() {
  const list = getAllCandidates()
  if (!list.length) return
  const target = list[Math.floor(Math.random() * list.length)]
  router.push(target)
}
</script>

<style scoped>
.rnd-btn{
  padding: 6px 12px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, #fff);
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(0,0,0,.05);
  cursor: pointer;
}
.rnd-btn:hover{
  border-color: var(--c-border, #cbd5e1);
}
html[data-theme="dark"] .rnd-btn{
  background: var(--vp-c-bg-soft, #0b0f19);
  border-color: #333;
}
</style>