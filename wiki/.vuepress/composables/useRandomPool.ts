// wiki/.vuepress/composables/useRandomPool.ts
import { ref } from 'vue'
import { withBase } from '@vuepress/client'

export type RandomItem = {
  href: string
  title?: string
  excerpt?: string
}

export function useRandomPool() {
  const pool = ref<RandomItem[]>([])
  const loaded = ref(false)

  const load = async () => {
    loaded.value = false
    pool.value = []

    try {
      const url = withBase('data/random-index.json')
      const res = await fetch(url, { cache: 'force-cache' })
      if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`)
      const json = await res.json()
      pool.value = normalizeIndex(json)
    } catch (err) {
      console.warn('[RandomPool] load json failed, fallback to document scan.', err)
      pool.value = collectFromDocument()
    }

    // 统一去重
    pool.value = uniqueByHref(pool.value)

    // 当前页 & 顶层页 一并排除
    const cur = normalize(location.pathname)
    pool.value = pool.value.filter(i => {
      const p = normalize(i.href)
      return p !== cur && !isTopPage(p)
    })

    loaded.value = true
  }

  const sample = (n: number): RandomItem[] => {
    const seen = new Set<string>()
    const arr = pool.value.slice()
    const out: RandomItem[] = []
    while (arr.length && out.length < n) {
      const idx = Math.floor(Math.random() * arr.length)
      const item = arr.splice(idx, 1)[0]
      const key = normalize(item.href)
      if (!seen.has(key)) {
        seen.add(key)
        out.push(item)
      }
    }
    return out
  }

  const resolveLink = (p: string) => withBase(ensureLeadingSlash(p))

  return { pool, loaded, load, sample, resolveLink }
}

/* ================= 工具函数 ================ */

/** 解析 random-index.json 为 RandomItem[]（兼容两种结构），并排除顶层页 */
function normalizeIndex(json: any): RandomItem[] {
  if (!json) return []

  const toItem = (i: any): RandomItem | null => {
    const raw = String(i?.path ?? i?.link ?? '')
    if (!raw) return null
    const href = normalize(raw)
    // 仅收 .html，且排除顶层页
    if (!/\.html$/i.test(href) || isTopPage(href) || href.startsWith('http')) return null
    return {
      href,
      title: (i?.title ?? '').trim(),
      excerpt: (i?.excerpt ?? '').trim(),
    }
  }

  const list = Array.isArray(json?.pages)
    ? (json.pages as any[]).map(toItem).filter(Boolean)
    : Array.isArray(json)
    ? (json as any[]).map(toItem).filter(Boolean)
    : []

  return uniqueByHref(list as RandomItem[])
}

/** 从文档中收集“本站 .html”链接；排除顶层页 */
function collectFromDocument(): RandomItem[] {
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a'))
  const items = anchors
    .map(a => a.getAttribute('href') || a.href)
    .filter(Boolean)
    .map(h => normalize(String(h)))
    .filter(p => /\.html$/i.test(p) && !p.startsWith('http') && !isTopPage(p))
    .map(p => ({ href: p, title: '', excerpt: '' }))

  return uniqueByHref(items)
}

/** 顶层页判定：/、/index.html、/README.html 都认为是首页 */
function isTopPage(p: string): boolean {
  const x = normalize(p)
  return x === '/' || /\/index\.html$/i.test(x) || /\/README\.html$/i.test(x)
}

function uniqueByHref(list: RandomItem[]): RandomItem[] {
  const m = new Map<string, RandomItem>()
  list.forEach(i => {
    const key = normalize(i.href)
    if (!m.has(key)) m.set(key, { ...i, href: key })
  })
  return [...m.values()]
}

function ensureLeadingSlash(p: string) {
  return p.startsWith('/') ? p : `/${p}`
}

/**
 * 标准化为“站内路径”：
 * - 去域名，仅保留 pathname
 * - 去掉已知的 base 前缀（运行时 base 和 '/ZenithWorld/' 兼容）
 * - 确保以 /
 */
function normalize(href: string): string {
  let path = href
  try {
    path = new URL(href, location.href).pathname
  } catch {}
  path = ensureLeadingSlash(path)

  const runtimeBase = normalizeBase(withBase('/').replace(location.origin, ''))
  const knownBases = new Set<string>([runtimeBase, '/ZenithWorld/'])
  for (const b of knownBases) {
    if (b !== '/' && path.startsWith(b)) {
      path = ensureLeadingSlash(path.slice(b.length))
      break
    }
  }
  return path
}

/** 规范化 base：确保头尾都有斜杠 */
function normalizeBase(b: string): string {
  if (!b) return '/'
  let x = b
  if (!x.startsWith('/')) x = `/${x}`
  if (!x.endsWith('/')) x = `${x}/`
  return x
}