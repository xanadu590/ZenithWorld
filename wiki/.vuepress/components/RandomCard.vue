<template>
  <!-- 只在客户端渲染，避免 SSR 期间 fetch -->
  <ClientOnly>
    <div class="random-card" v-if="current">
      <!-- 左箭头（回退） -->
      <button
        class="nav prev"
        :disabled="!canBack"
        @click="goPrev"
        aria-label="上一条随机文章"
      >‹</button>

      <!-- 中间内容（整块可点击跳转） -->
      <a class="content" :href="current.link">
        <h3 class="title">{{ current.title }}</h3>
        <p class="excerpt">{{ current.excerpt || '（这篇没有摘要）' }}</p >
      </a >

      <!-- 右箭头（下一条） -->
      <button
        class="nav next"
        :disabled="!canNext"
        @click="goNext"
        aria-label="下一条随机文章"
      >›</button>
    </div>

    <!-- 索引不可用时的占位（可选） -->
    <div class="random-card empty" v-else>
      暂无可推荐的随机文章
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { loadRandomIndex, pickRandom, type RandomItem } from '../useRandomIndex'

/** 历史最多回退条数（你说“最多回到三个前的随机页面”） */
const MAX_BACK = 3

/** 索引、历史栈、当前指针 */
const index = ref<RandomItem[]>([])
const history = ref<RandomItem[]>([])
const cursor = ref(-1) // 指向 history 中的当前位置；-1 表示还没准备好

/** 当前卡片 */
const current = computed(() => history.value[cursor.value])

/** 是否可以回退/前进 */
const canBack = computed(() => cursor.value > 0)
const canNext = computed(() => index.value.length > 0) // 总能“抽下一条”

/** 进入页面后加载索引并抽第一条 */
onMounted(async () => {
  index.value = await loadRandomIndex()
  // 如果有内容，抽第一条
  if (index.value.length) {
    goNext()
  }
})

/** 前进：抽一条新随机，并维护“最多 3 条可回退”的历史窗口 */
function goNext() {
  if (!index.value.length) return
  // 构造最近（最多 3 条）的排除集合，避免刚展示过
  const recent = new Set(
    history.value.slice(Math.max(0, cursor.value - (MAX_BACK - 1)), cursor.value + 1).map(i => i.link)
  )
  const next = pickRandom(index.value, recent)
  if (!next) return

  // 如果当前不在栈顶（用户回退后又点了下一条），切掉“未来”分支
  history.value = history.value.slice(0, cursor.value + 1)

  // 压入新项并移动指针
  history.value.push(next)
  cursor.value = history.value.length - 1

  // 控制历史窗口大小：最多 1（当前）+ 3（可回退）
  const overflow = history.value.length - (MAX_BACK + 1)
  if (overflow > 0) {
    history.value.splice(0, overflow)
    cursor.value -= overflow
  }
}

/** 回退：只要指针大于 0 就能回去 */
function goPrev() {
  if (cursor.value > 0) cursor.value--
}
</script>

<style scoped>
/* 外层：占满当前内容宽度，贴着页面底部放 */
.random-card {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto; /* 左按钮 / 内容 / 右按钮 */
  align-items: stretch;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: var(--vp-c-bg-soft, var(--c-bg, #fff));
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,.05);
  margin-top: 24px;        /* 和正文内容留一点间距 */
}

/* 暗色 */
html[data-theme="dark"] .random-card {
  border-color: #333;
  background: var(--vp-c-bg-soft, #0b0f19);
  color: var(--c-text, #e5e5e5);
}

/* 左右箭头按钮 */
.nav {
  width: 40px;
  border: 1px solid var(--c-border, #e5e7eb);
  background: transparent;
  border-radius: 8px;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  transition: background .15s ease, border-color .15s ease;
}
.nav:hover { background: rgba(0,0,0,.04); }
.nav:disabled { opacity: .4; cursor: not-allowed; }

/* 中间内容块（整块可点） */
.content {
  display: block;
  padding: 4px 2px;
  text-decoration: none;           /* 去掉链接下划线 */
  color: inherit;
}
.content:hover .title { text-decoration: underline; }

.title {
  font-size: 18px;
  font-weight: 700;
  margin: 2px 0 6px;
}

/* 摘要：两到三行省略 */
.excerpt {
  margin: 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;           /* 想要两行可改为 2 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 3;  
}

/* 空态 */
.random-card.empty {
  opacity: .7;
  text-align: center;
}
</style>