// wiki/.vuepress/composables/useRandomPool.ts
import { ref } from 'vue'
import { withBase } from '@vuepress/client'

/** 调试开关（排查时设为 true，上线可设为 false） */
const DEBUG = true
const TAG = '[RandomPool]'

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
      DEBUG && console.info(TAG, 'fetch:', url)
      const res = await fetch(url, { cache: 'force-cache' })
      if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`)
      const json = await res.json()
      pool.value = normalizeIndex(json)
      DEBUG && console.info(TAG, 'normalizeIndex ->', pool.value.length)
    } catch (err) {
      console.warn(`${TAG} load json failed, fallback to document scan.`, err)
      pool.value = collectFromDocument()
      DEBUG && console.info(TAG, 'collectFromDocument ->', pool.value.length)
    }

    // 统一去重
    const beforeUnique = pool.value.length
    pool.value = uniqueByHref(pool.value)
    DEBUG && console.info(TAG, `uniqueByHref: ${beforeUnique} -> ${pool.value.length}`)

    // 当前页 & 顶层页 一并排除
    const cur = normalize(location.pathname)
    const beforeFilter = pool.value.length
    pool.value = pool.value.filter(i => {
      const p = normalize(i.href)
      // ⚠️ 只排除真正同页面（不排除路径含 base 的情况）
      return !isTopPage(p) && p !== cur && !location.pathname.endsWith(p)
    })
    DEBUG && console.info(TAG, `filter current/top: ${beforeFilter} -> ${pool.value.length} (cur=${cur})`)

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
    DEBUG && console.debug(TAG, `sample(${n}) -> ${out.length}`)
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
    // 仅收 .html，且排除顶层页与外链
    if (!/\.html$/i.test(href) || isTopPage(href) || href.startsWith('http')) {
      DEBUG && console.debug(TAG, 'skip:', { raw, href })
      return null
    }
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

  DEBUG && console.info(TAG, 'normalizeIndex list =', list.length)
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

  DEBUG && console.info(TAG, 'collectFromDocument size =', items.length)
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
 * - 只保留 pathname（去域名）
 * - 剥离已知 base 前缀：
 *    1) 运行时 base：withBase('/')
 *    2) 历史：'/ZenithWorld/'
 *    3) 自动识别：当前 URL 的首段若形如 'demo-*' 或 'v*'，视作 base（如 '/demo-0.0.1/'、'/v1/'）
 * - 最终确保以 '/' 开头
 */
function normalize(href: string): string {
  let path = href
  try {
    path = new URL(href, location.href).pathname
  } catch {}
  path = ensureLeadingSlash(path)

  // 1) 运行时 base（如 '/' 或 '/ZenithWorld/'）
  const runtimeBase = normalizeBase(withBase('/').replace(location.origin, ''))

  // 2) 自动识别当前 URL 的第一段作为潜在 base（demo-*/v*）
  const autoBases: string[] = []
  const seg = location.pathname.match(/^\/([^/]+)\//)
  if (seg) {
    const first = seg[1]
    if (/^(demo-[\w.-]+|v[\w.-]+)$/i.test(first)) {
      autoBases.push(`/${first}/`)
    }
  }

  // 3) 历史手动列举
  const manualBases = ['/ZenithWorld/']

  // 汇总并按长度降序（避免短前缀先剥导致误差）
  const knownBases = [runtimeBase, ...autoBases, ...manualBases]
    .filter(Boolean)
    .map(normalizeBase)
    .sort((a, b) => b.length - a.length)

  for (const b of knownBases) {
    if (b !== '/' && path.startsWith(b)) {
      const old = path
      path = ensureLeadingSlash(path.slice(b.length))
      DEBUG && console.debug(TAG, 'strip base:', b, '=>', old, '->', path)
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