<template>
  <div class="meili-filter-search">
    <!-- 搜索输入框 -->
    <div class="mfs-bar">
      <input
        v-model="keyword"
        class="mfs-input"
        type="search"
        placeholder="搜索角色 / 概念 / 势力 / 地理 / 历史 / 力量体系……"
        @keyup.enter="search"
      />
      <button class="mfs-btn" @click="search">搜索</button>
    </div>

    <!-- 分类筛选按钮 -->
    <div class="mfs-filters">
      <span class="mfs-filters-label">分类：</span>
      <button
        v-for="opt in typeOptions"
        :key="String(opt.value)"
        class="mfs-filter-btn"
        :class="{ 'is-active': activeType === opt.value }"
        @click="setType(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- 状态提示 -->
    <div class="mfs-status" v-if="loading">正在搜索……</div>
    <div class="mfs-status" v-else-if="error">出错了：{{ error }}</div>
    <div class="mfs-status" v-else-if="!results.length && searchedOnce">没有搜索结果</div>

    <!-- 搜索结果 -->
    <ul class="mfs-results" v-if="results.length">
      <li
        v-for="hit in results"
        :key="hit.id || hit.objectID || hit.url"
        class="mfs-result-item"
      >
        <a :href="hit.url" class="mfs-result-link">
          <div class="mfs-result-title">
            <!-- 根据 url / type 推断类型，显示中文标签 -->
            <span v-if="inferType(hit)" class="mfs-tag">
              [{{ typeLabelMap[inferType(hit)!] || inferType(hit) }}]
            </span>
            {{ hit.title || hit.hierarchy_lvl1 || hit.hierarchy_lvl0 || '(无标题)' }}
          </div>
          <div class="mfs-result-meta">
            <span v-if="hit.region">区域：{{ hit.region }}</span>
            <span v-if="hit.tags?.length"> · 标签：{{ hit.tags.join(' / ') }}</span>
          </div>
          <div class="mfs-result-summary">
            {{ hit.summary || hit.text || '（暂无摘要）' }}
          </div>
          <div class="mfs-result-url">{{ hit.url }}</div>
        </a >
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// ！！！这里替换成你自己的配置 ！！！
const host = 'http://47.99.85.126:7700'   // 以后你有 https 域名再改
const indexUid = 'wiki'
const apiKey =
  '2873699d178c266076a0e57bbb60fc1aa1757a661d320a96be8eb09b26e15907' // 千万不要填 Master Key

const keyword = ref('')
const activeType = ref<string | null>(null)
const results = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchedOnce = ref(false)

// 分类按钮：对应六大目录
const typeOptions: { value: string | null; label: string }[] = [
  { value: null,        label: '全部' },
  { value: 'character', label: '人物' },
  { value: 'concept',   label: '概念' },
  { value: 'faction',   label: '势力' },
  { value: 'geography', label: '地理' },
  { value: 'history',   label: '历史' },
  { value: 'power',     label: '力量体系' },
]

// type -> 中文显示名
const typeLabelMap: Record<string, string> = {
  character: '人物',
  concept: '概念',
  faction: '势力',
  geography: '地理',
  history: '历史',
  power: '力量体系',
}

// 根据文档的字段 / url 推断类型
function inferType(hit: any): string | null {
  // 如果以后你把 frontmatter 里的 type 抓进索引，这一句会优先使用真正的 type
  if (hit.type) return hit.type as string

  const url: string = hit.url || ''

  // 根据 url 路径推断
  if (url.includes('/world/characters/')) return 'character'
  if (url.includes('/world/concepts/'))   return 'concept'
  if (url.includes('/world/factions/'))   return 'faction'
  if (url.includes('/world/geography/'))  return 'geography'
  if (url.includes('/world/history/'))    return 'history'
  if (url.includes('/world/power/'))      return 'power'

  return null
}

function setType(val: string | null) {
  // 再点一下同一个按钮可以“取消筛选”
  activeType.value = val === activeType.value ? null : val
  search()
}

async function search() {
  searchedOnce.value = true
  loading.value = true
  error.value = null

  try {
    const body: any = {
      q: keyword.value,
      // 不再在后端 filter，只是多要一点结果，前端自己筛
      limit: 50,
    }

    const res = await fetch(`${host}/indexes/${indexUid}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const data = await res.json()
    let hits: any[] = data.hits || []

    // 前端按类型筛选：通过 inferType 判断
    if (activeType.value) {
      hits = hits.filter((hit) => inferType(hit) === activeType.value)
    }

    results.value = hits
  } catch (e: any) {
    console.error(e)
    error.value = e.message || String(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.meili-filter-search {
  max-width: 860px;
  margin: 1.5rem auto;
  padding: 1.5rem;
  border-radius: 1rem;
  background: var(--vp-bg, #fff);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
}

.mfs-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.mfs-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-border, #d0d7de);
  font-size: 0.95rem;
}

.mfs-btn {
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  white-space: nowrap;
  background: var(--vp-c-accent, #6366f1);
  color: #fff;
}

.mfs-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.mfs-filters-label {
  font-weight: 600;
}

.mfs-filter-btn {
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-border, #d0d7de);
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
}

.mfs-filter-btn.is-active {
  background: var(--vp-c-accent, #6366f1);
  color: #fff;
  border-color: transparent;
}

.mfs-status {
  font-size: 0.9rem;
  color: var(--vp-c-text-2, #6b7280);
  margin: 0.5rem 0;
}

.mfs-results {
  list-style: none;
  margin: 0;
  padding: 0;
}

.mfs-result-item + .mfs-result-item {
  margin-top: 0.75rem;
}

.mfs-result-link {
  display: block;
  padding: 0.7rem 0.9rem;
  border-radius: 0.75rem;
  border: 1px solid var(--vp-c-border, #e5e7eb);
  text-decoration: none;
  color: inherit;
}

.mfs-result-link:hover {
  border-color: var(--vp-c-accent, #6366f1);
  background: rgba(99, 102, 241, 0.02);
}

.mfs-result-title {
  font-weight: 600;
  margin-bottom: 0.2rem;
}

.mfs-tag {
  display: inline-block;
  margin-right: 0.35rem;
  padding: 0 0.35rem;
  border-radius: 0.5rem;
  background: rgba(99, 102, 241, 0.12);
  color: #4f46e5;
  font-size: 0.75rem;
}

.mfs-result-meta {
  font-size: 0.8rem;
  color: var(--vp-c-text-2, #9ca3af);
  margin-bottom: 0.25rem;
}

.mfs-result-summary {
  font-size: 0.85rem;
  color: var(--vp-c-text-1, #4b5563);
  margin-bottom: 0.3rem;
}

.mfs-result-url {
  font-size: 0.75rem;
  color: var(--vp-c-text-3, #9ca3af);
}
</style>