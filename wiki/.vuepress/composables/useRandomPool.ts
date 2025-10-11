// wiki/.vuepress/composables/useRandomPool.ts
import { ref } from 'vue'
import { withBase } from '@vuepress/client'


/** 调试开关（排查用；上线可设为 false） */
const DEBUG = true
const TAG = '[RandomPool]'

export type RandomItem = {
  href: string
  title?: string
  excerpt?: string
  /** ★ 新增：记录这是“简介版”还是“台词版”（便于调试/扩展，可选） */
  variant?: 'summary' | 'quote' | 'excerpt'
}

/**
 * 统一：从多个可能的 URL 拉取 random-index.json（带版本参数）
 * - 加上 ?v= 构建版本，强制绕过浏览器/CDN 缓存
 * - “开发”通过 hostname 判断（不依赖 env），每次请求都加时间戳
 * - “生产”尽量用 <meta> 注入的 build-rev / build-time；没有则回退为时间戳
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

export function useRandomPool() {
  const pool = ref<RandomItem[]>([])
  const loaded = ref(false)

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

  const load = async () => {
    loaded.value = false
    pool.value = []

    // A) 组织候选 URL，并统一加 ?v= 版本参数
    const baseUrl = makeVersionedUrl(withBase('data/random-index.json'))

    // 去掉运行时 base 的简易版本
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

    // B) 先尝试从 JSON 读全站索引
    const json = await tryFetch<any>(candidates)

    if (json) {
      pool.value = normalizeIndex(json) // ★ 不在这里去重（允许同 href 的“简介/台词”并存）
      DEBUG && console.info(TAG, 'normalizeIndex ->', pool.value.length)
    } else {
      // C) 全部失败：兜底扫描页面链接
      console.warn(`${TAG} all fetch candidates failed, fallback to document scan.`)
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
      pool.value = collectFromDocument()   // 这里仍会按 href 去重（因为没有“台词/简介”双版本的意义）
      DEBUG && console.info(TAG, 'collectFromDocument ->', pool.value.length)
    }

    // ★ D) 不做 global href 去重（保留同页的两个版本）；仅做轻度清洗
    const beforeFilter = pool.value.length
    const cur = normalize(location.pathname)
    pool.value = pool.value.filter(i => {
      const p = normalize(i.href)
      return !isTopPage(p) && p !== cur && !location.pathname.endsWith(p)
    })
    DEBUG && console.info(TAG, `filter current/top: ${beforeFilter} -> ${pool.value.length} (cur=${cur})`)

    loaded.value = true
  }

  /** 从池中随机抽取 n 条（不放回；★ 同一 href 只取 1 条，保证“不重复页面”） */
  const sample = (n: number): RandomItem[] => {
    const seen = new Set<string>()     // ★ 按 href 去重放在抽样阶段
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

  /** 把站内 path 变为最终可跳转的绝对地址（自动加 base） */
  const resolveLink = (p: string) => withBase(ensureLeadingSlash(p))

  return { pool, loaded, load, sample, resolveLink }
}

/* ================= 工具函数 ================ */

/**
 * 解析 random-index.json 为 RandomItem[]
 * 兼容两种结构：
 * - { pages: [ { path/title/summary/quote/excerpt } ] }
 * - [ { path/title/summary/quote/excerpt } ]
 *
 * 规则：
 * - 同一页面可产出最多两条：
 *   1) summary 版（variant='summary'）
 *   2) quote   版（variant='quote'）
 * - 若没有 summary/quote，但有 excerpt，则产出 1 条（variant='excerpt'）
 * - 过滤：外链、顶层页、非 .html
 * - ★ 不做 href 去重（留给 sample 阶段控制“同一页面只出 1 条”）
 */
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

    // 1) 人物页可生成 2 条
    if (summary) {
      out.push({ href, title, excerpt: summary, variant: 'summary' })
    }
    if (quote) {
      out.push({ href, title, excerpt: quote, variant: 'quote' })
    }

    // 2) 兼容旧数据：只有 excerpt（且没有 summary/quote）则进 1 条
    if (!summary && !quote && excerpt) {
      out.push({ href, title, excerpt, variant: 'excerpt' })
    }

    // 3) 如果三者都没有，也可选择丢弃；这里保留为空摘要的单条，便于兜底
    if (!summary && !quote && !excerpt) {
      out.push({ href, title, excerpt: '', variant: 'excerpt' })
    }
  }

  DEBUG && console.info(TAG, 'normalizeIndex list =', out.length)
  return out
}

/** 从文档中收集“本站 .html”链接；排除顶层页（此分支没有 summary/quote，保留去重即可） */
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

/** 顶层页判定：/、/index.html、/README.html 都认为是首页 */
function isTopPage(p: string): boolean {
  const x = normalize(p)
  return x === '/' || /\/index\.html$/i.test(x) || /\/README\.html$/i.test(x)
}

/** 仅在 fallback 收集时使用的去重（保持池内“每个 href 1 条”） */
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
 *    3) 自动识别：当前 URL 的首段若形如 'demo-*' 或 'v*'，视作 base
 * - 最终确保以 '/' 开头
 */
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

/** 规范化 base：确保头尾都有斜杠 */
function normalizeBase(b: string): string {
  if (!b) return '/'
  let x = b
  if (!x.startsWith('/')) x = `/${x}`
  if (!x.endsWith('/')) x = `${x}/`
  return x
}

