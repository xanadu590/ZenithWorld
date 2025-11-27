// wiki/.vuepress/composables/useRandomPool.ts
import { ref } from 'vue'
import { withBase } from '@vuepress/client'
import { MeiliSearch } from 'meilisearch'

/*
  升级版：随机文章池 useRandomPool（优先使用 MeiliSearch）
  -----------------------------------------------------------------
  行为顺序：
    1. 优先：从 Meili 索引拉一批文档，当作“随机池”；
    2. 若 Meili 失败：退回旧逻辑，从 /data/random-index.json 加载；
    3. 若 JSON 也失败：再兜底扫描当前页面 <a href> 生成候选。
  其它保持不变：
    - normalize / resolveLink 的各种 base / demo-/v* 处理逻辑原样保留。
*/

const DEBUG = true
const TAG = '[RandomPool]'

export type RandomItem = {
  href: string
  title?: string
  excerpt?: string
  /** 记录“简介版/台词版/旧摘要版” */
  variant?: 'summary' | 'quote' | 'excerpt'
}

/* ================= MeiliSearch 配置 ================ */

/**
 * ✅ 这里改成你自己的配置：
 *  - MEILI_HOST: 你的 Meili 地址（http/https 开头，推荐挂域名）
 *  - MEILI_SEARCH_KEY: 前端用 search_key（不能用 master key）
 *  - MEILI_INDEX: docs-scraper 建的索引名
 *
 * 建议以后用环境变量：
 *  VITE_MEILI_HOST / VITE_MEILI_SEARCH_KEY / VITE_MEILI_INDEX
 */
const MEILI_HOST =
  (import.meta as any).env?.VITE_MEILI_HOST ||
  'http://47.99.85.126:7700'

const MEILI_SEARCH_KEY =
  (import.meta as any).env?.VITE_MEILI_SEARCH_KEY ||
  '2873699d178c266076a0e57bbb60fc1aa1757a661d320a96be8eb09b26e15907'

const MEILI_INDEX =
  (import.meta as any).env?.VITE_MEILI_INDEX ||
  'characters' // 改成你真实的 index 名

// 创建全局 Meili 客户端和索引实例（多个页面复用）
const meiliClient = new MeiliSearch({
  host: MEILI_HOST,
  apiKey: MEILI_SEARCH_KEY,
})

const meiliIndex = meiliClient.index(MEILI_INDEX)

/*
  函数：normalizeMeiliHits
  作用：
    - 将 Meili 返回的 hits 转成 RandomItem[]
    - 自动从 url/path/href 字段拿链接，从 title/summary/excerpt 拿标题和摘要
*/
function normalizeMeiliHits(hits: any[]): RandomItem[] {
  const out: RandomItem[] = []

  for (const hit of hits) {
    const rawHref =
      hit.url ||
      hit.path ||
      hit.href ||
      ''

    const href = normalize(String(rawHref || ''))
    if (!href || !/\.html$/i.test(href) || isTopPage(href) || href.startsWith('http')) {
      DEBUG && console.debug(TAG, '[meili] skip hit:', { rawHref, href })
      continue
    }

    const title = String(hit.title ?? '').trim()
    const summary = String(hit.summary ?? '').trim()
    const excerpt = String(hit.excerpt ?? '').trim()
    const text = summary || excerpt || ''

    out.push({
      href,
      title,
      excerpt: text,
      variant: text ? 'excerpt' : undefined,
    })
  }

  DEBUG && console.info(TAG, '[meili] normalize hits ->', out.length)
  return out
}

/* ================= 旧逻辑：random-index.json + 扫描兜底 ================ */

/*
  函数：makeVersionedUrl
  作用：
    - 为给定 URL 统一追加 ?v=xxx 查询参数，减少缓存导致的“旧数据”问题。
*/
function makeVersionedUrl(raw: string): string {
  const host = location.hostname
  const isLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.local')

  const metaRev = document.querySelector('meta[name="build-rev"]') as HTMLMetaElement | null
  const metaTime = document.querySelector('meta[name="build-time"]') as HTMLMetaElement | null
  const buildVersion = (metaRev?.content || metaTime?.content || String(Date.now())).trim()

  const ver = (DEBUG || isLocal) ? String(Date.now()) : buildVersion

  try {
    const u = new URL(raw, location.origin)
    u.searchParams.set('v', ver)
    return u.pathname + u.search
  } catch {
    const sep = raw.includes('?') ? '&' : '?'
    return `${raw}${sep}v=${ver}`
  }
}

/* ================= 主体：useRandomPool ================ */

export function useRandomPool() {
  const pool = ref<RandomItem[]>([])
  const loaded = ref(false)

  /*
    工具：tryFetch
    作用：
      - 依次尝试一组候选 URL，返回首个成功解析为 JSON 的结果。
  */
  const tryFetch = async <T = any>(candidates: string[]): Promise<T | null> => {
    const host = location.hostname
    const isLocal =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.local')
    const isDev = DEBUG || isLocal
    const cacheMode: RequestCache = isDev ? 'no-store' : 'force-cache'

    for (const url of candidates) {
      try {
        DEBUG && console.info(TAG, 'fetch try:', url)
        const res = await fetch(url, { cache: cacheMode })
        if (!res.ok) {
          DEBUG && console.warn(TAG, `fetch fail ${res.status}:`, url)
          continue
        }
        const json = await res.json()
        DEBUG && console.info(TAG, 'fetch ok:', url)
        return json as T
      } catch (e) {
        DEBUG && console.warn(TAG, 'fetch error:', url, e)
      }
    }
    return null
  }

  /*
    方法：load
    ------------------------------------------------------------------
    优先顺序：
      1) 先尝试用 Meili 拉一个“全站随机池”；
      2) 若 Meili 失败或命中数量为 0，再退回 random-index.json；
      3) JSON 也失败，则扫描当前文档链接兜底。
  */
  const load = async () => {
    loaded.value = false
    pool.value = []

    // 1) 优先尝试从 Meili 拉 500 条
    try {
      DEBUG && console.info(TAG, '[meili] search start')
      const { hits } = await meiliIndex.search('', {
        limit: 500,
        // 如果你的索引里有 docType / lang / tags 字段，可以加 filter:
        // filter: ['docType = "page"'],
      } as any)

      const meiliItems = normalizeMeiliHits(hits)
      if (meiliItems.length > 0) {
        pool.value = meiliItems
        DEBUG && console.info(TAG, '[meili] used as pool, size =', pool.value.length)
      } else {
        DEBUG && console.warn(TAG, '[meili] search returns 0 hits, fallback to JSON')
      }
    } catch (e) {
      DEBUG && console.warn(TAG, '[meili] search failed, fallback to JSON:', e)
    }

    // 2) 如果 Meili 没拿到有效数据，再走原来的 JSON 逻辑
    if (!pool.value.length) {
      const baseUrl = makeVersionedUrl(withBase('data/random-index.json'))

      const stripped = (() => {
        try {
          const u = new URL(baseUrl, location.origin)
          const seg = u.pathname.match(/^\/([^/]+)\/(.*)$/)
          if (seg) {
            const first = seg[1]
            if (/^(demo-[\w.-]+|v[\w.-]+)$/i.test(first)) {
              return makeVersionedUrl(`/${seg[2]}`)
            }
          }
        } catch {}
        return null
      })()

      const candidates = Array.from(
        new Set([
          baseUrl,
          makeVersionedUrl('/data/random-index.json'),
          stripped ?? undefined,
        ].filter(Boolean) as string[])
      )

      const json = await tryFetch<any>(candidates)

      if (json) {
        pool.value = normalizeIndex(json)
        DEBUG && console.info(TAG, 'normalizeIndex ->', pool.value.length)
      } else {
        // 3) JSON 也失败：兜底扫描页面链接
        console.warn(`${TAG} all fetch candidates failed, fallback to document scan.`)
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
        pool.value = collectFromDocument()
        DEBUG && console.info(TAG, 'collectFromDocument ->', pool.value.length)
      }
    }

    // 4) 清洗：排除首页/当前页，避免“自我推荐”
    const beforeFilter = pool.value.length
    const cur = normalize(location.pathname)
    pool.value = pool.value.filter(i => {
      const p = normalize(i.href)
      return !isTopPage(p) && p !== cur && !location.pathname.endsWith(p)
    })
    DEBUG && console.info(TAG, `filter current/top: ${beforeFilter} -> ${pool.value.length} (cur=${cur})`)

    loaded.value = true
  }

  /*
    方法：sample
    作用：
      - 从池中随机抽取 n 条项目。
  */
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
    DEBUG && console.debug(TAG, `sample(${n}) -> ${out.length}`, out.map(i => `${i.href} [${i.variant ?? ''}]`))
    return out
  }

  /*
    方法：resolveLink
    作用：
      - 把“站内 path”转换为“最终可跳转 URL”。
  */
  const resolveLink = (p: string) => {
    const path = ensureLeadingSlash(p)

    // 1) 优先用 vuepress base
    try {
      const vueBase = withBase('/') // 例如 '/docs/' 或 '/'
      if (vueBase && vueBase !== '/') {
        return vueBase.replace(/\/$/, '') + path
      }
    } catch { /* ignore */ }

    // 2) 运行时自动识别 demo-/v* 前缀
    const m = location.pathname.match(/^\/(demo-[\w.-]+|v[\w.-]+)\//)
    if (m) {
      const runtimeBase = `/${m[1]}/`
      return runtimeBase.replace(/\/$/, '') + path
    }

    // 3) 再兜底：不加前缀
    return path
  }

  return { pool, loaded, load, sample, resolveLink }
}

/* ================= 工具函数（原样保留） ================ */

function normalizeIndex(json: any): RandomItem[] {
  if (!json) return []

  const rows: any[] = Array.isArray(json?.pages)
    ? json.pages
    : Array.isArray(json)
    ? json
    : []

  const out: RandomItem[] = []
  for (const raw of rows) {
    const pathLike = String(raw?.path ?? raw?.link ?? raw?.href ?? '')
    const href = normalize(pathLike)
    if (!href || !/\.html$/i.test(href) || isTopPage(href) || href.startsWith('http')) {
      DEBUG && console.debug(TAG, 'skip:', { pathLike, href })
      continue
    }

    const title = String(raw?.title ?? '').trim()
    const summary = String(raw?.summary ?? '').trim()
    const quote = String(raw?.quote ?? '').trim()
    const excerpt = String(raw?.excerpt ?? '').trim()

    if (summary) out.push({ href, title, excerpt: summary, variant: 'summary' })
    if (quote)   out.push({ href, title, excerpt: quote,   variant: 'quote' })

    if (!summary && !quote && excerpt) {
      out.push({ href, title, excerpt, variant: 'excerpt' })
    }
    if (!summary && !quote && !excerpt) {
      out.push({ href, title, excerpt: '', variant: 'excerpt' })
    }
  }

  DEBUG && console.info(TAG, 'normalizeIndex list =', out.length)
  return out
}

function collectFromDocument(): RandomItem[] {
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a'))
  const items = anchors
    .map(a => a.getAttribute('href') || a.href)
    .filter(Boolean)
    .map(h => normalize(String(h)))
    .filter(p => /\.html$/i.test(p) && !p.startsWith('http') && !isTopPage(p))
    .map(p => ({ href: p, title: '', excerpt: '', variant: 'excerpt' as const }))

  DEBUG && console.info(TAG, 'collectFromDocument size =', items.length)
  return uniqueByHref(items)
}

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

function normalize(href: string): string {
  let path = href
  try {
    path = new URL(href, location.href).pathname
  } catch {}
  path = ensureLeadingSlash(path)

  const runtimeBase = normalizeBase(withBase('/').replace(location.origin, ''))

  const autoBases: string[] = []
  const seg = location.pathname.match(/^\/([^/]+)\//)
  if (seg) {
    const first = seg[1]
    if (/^(demo-[\w.-]+|v[\w.-]+)$/i.test(first)) {
      autoBases.push(`/${first}/`)
    }
  }

  const manualBases = ['/ZenithWorld/']

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

function normalizeBase(b: string): string {
  if (!b) return '/'
  let x = b
  if (!x.startsWith('/')) x = `/${x}`
  if (!x.endsWith('/')) x = `${x}/`
  return x
}