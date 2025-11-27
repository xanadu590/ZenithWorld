// wiki/.vuepress/composables/useRandomPool.ts
import { ref } from 'vue'
import { withBase } from '@vuepress/client'

/*
  模块：随机文章池 useRandomPool
  功能：
    - 统一加载站点生成的随机索引 JSON（/data/random-index.json），或在失败时从当前文档扫描可用链接作为兜底。
    - 解决多种部署前缀（VuePress base、/demo-*、/v*、手动前缀等）导致的链接失效问题。
    - 暴露：pool（池数据）、loaded（是否加载完成）、load()（加载池）、sample(n)（抽样 n 条）、
            resolveLink(path)（把站内路径转换为最终可跳转 URL）。
  实现要点：
    - 通过 makeVersionedUrl 为拉取 JSON 的请求统一追加版本参数 v，以规避浏览器/边缘缓存。
    - tryFetch() 支持多候选 URL 依次尝试，并按开发/生产切换 cache 策略。
    - normalize()/normalizeBase() 统一“剥离/补齐 base”，保证池内的 href 可比较与去重。
    - resolveLink() 优先走 VuePress 的 withBase()，否则根据运行时路径自动推断 demo-/v* 前缀。
  调试参数：
    - DEBUG：true 时输出详细日志，并强制请求使用 no-store；上线建议设为 false。
*/

 /** 调试开关（排查用；上线可设为 false） */
const DEBUG = true
const TAG = '[RandomPool]'

export type RandomItem = {
  href: string
  title?: string
  excerpt?: string
  /** 记录“简介版/台词版/旧摘要版” */
  variant?: 'summary' | 'quote' | 'excerpt'
}

/*
  函数：makeVersionedUrl
  作用：
    - 为给定 URL 统一追加 ?v=xxx 查询参数，减少缓存导致的“旧数据”问题。
  规则：
    - 若是本地/调试环境（localhost/127.0.0.1/*.local 或 DEBUG 为 true），v 取 Date.now()，确保每次请求都绕过缓存。
    - 否则优先从页面 <meta name="build-rev" | name="build-time"> 读取构建版本/时间，固定 v 值，便于 CDN 缓存。
  参数：
    - raw: string — 原始 URL（相对或绝对）
  返回：
    - string — 带 v 参数的 URL（保持原始路径 + 查询串，不包含 origin）
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
    // 尝试用 URL 统一处理（可接受相对路径，base 为 location.origin）
    const u = new URL(raw, location.origin)
    u.searchParams.set('v', ver)
    return u.pathname + u.search       // 返回 path + query（不带 origin），方便与 withBase 组合
  } catch {
    // 兜底：字符串拼接
    const sep = raw.includes('?') ? '&' : '?'
    return `${raw}${sep}v=${ver}`
  }
}

/*
  组合式函数：useRandomPool
  返回：
    - pool: Ref<RandomItem[]>     // 随机池数据
    - loaded: Ref<boolean>        // 是否加载完成
    - load(): Promise<void>       // 加载（或重新加载）随机池
    - sample(n:number): RandomItem[]      // 从池中随机抽 n 条（同 href 只取 1 条）
    - resolveLink(p:string): string       // 把站内路径转换为最终可跳转的绝对地址（含 base 推断）
*/
export function useRandomPool() {
  const pool = ref<RandomItem[]>([])
  const loaded = ref(false)

  /*
    工具：tryFetch
    作用：
      - 依次尝试一组候选 URL，返回首个成功解析为 JSON 的结果。
      - 根据当前环境选择合适的缓存策略（开发: no-store；生产: force-cache）。
    参数：
      - candidates: string[] — 候选 URL 列表（会按顺序尝试）
    返回：
      - Promise<T | null> — 成功返回 JSON 对象，否则 null
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
    作用：
      - 尝试从多种路径加载 random-index.json（都附带版本参数）。
      - 成功则解析为池；失败则扫描当前文档中的 a[href] 作为兜底。
      - 加载完成后会过滤掉首页与当前页，避免“推荐自身/首页”。
  */
  const load = async () => {
    loaded.value = false
    pool.value = []

    // A) 组织候选 URL，并统一加 ?v= 版本参数
    const baseUrl = makeVersionedUrl(withBase('data/random-index.json'))

    // 去掉运行时 base 的简易版本（匹配 /demo-* 或 /v* 这类前缀，回退到根）
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

    // 候选列表：withBase 版本 / 根路径版本 / 自动剥前缀版本（去重）
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
      // 不在这里按 href 去重：允许同页面的“summary/quote”并存
      pool.value = normalizeIndex(json)
      DEBUG && console.info(TAG, 'normalizeIndex ->', pool.value.length)
    } else {
      // C) 全部失败：兜底扫描页面链接（只保留站内 .html）
      console.warn(`${TAG} all fetch candidates failed, fallback to document scan.`)
      // 双 RAF 等待 DOM 稳定（一些路由/渲染情况下更保险）
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
      pool.value = collectFromDocument()
      DEBUG && console.info(TAG, 'collectFromDocument ->', pool.value.length)
    }

    // D) 清洗：排除首页/当前页，避免“自我推荐”
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
      - 去重策略：同一 normalize(href) 只取 1 条（避免相同页面的多种“版本”重复展示）。
    参数：
      - n: number — 期望抽样数量
    返回：
      - RandomItem[] — 实际抽到的条目（长度 ≤ n）
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
      - 把“站内 path”（如 /foo/bar.html 或 foo/bar.html）转换为“最终可跳转 URL”。
      - 优先使用 VuePress 的 base（withBase('/')）；若不可用，再根据运行时路径自动识别 /demo-* 或 /v* 前缀。
      - 最后兜底：不加任何前缀，直接返回标准化的 path。
    参数：
      - p: string — 目标页面的站内路径
    返回：
      - string — 最终可跳转 URL（带或不带前缀）
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

/* ================= 工具函数 ================ */

/*
  函数：normalizeIndex
  作用：
    - 解析 random-index.json，生成 RandomItem[]。
    - 支持两种来源结构：
      1) { pages: [...] }（推荐）
      2) 直接数组 [...]
  规则：
    - 仅保留站内 .html 且非顶层页的条目。
    - 一个条目可产出多条 RandomItem：
        * summary → variant: 'summary'
        * quote   → variant: 'quote'
        * 只有 excerpt 或都没有 → variant: 'excerpt'
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

/*
  函数：collectFromDocument
  作用：
    - 当 JSON 加载失败时，从当前文档中收集所有 a[href]，筛出“本站 .html”，并去除顶层页。
  返回：
    - RandomItem[]（初始均为 variant: 'excerpt'）
*/
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

/*
  函数：isTopPage
  作用：
    - 判断是否“顶层页”（/、/index.html、/README.html），这些页不参与推荐。
*/
function isTopPage(p: string): boolean {
  const x = normalize(p)
  return x === '/' || /\/index\.html$/i.test(x) || /\/README\.html$/i.test(x)
}

/*
  函数：uniqueByHref
  作用：
    - 对 RandomItem[] 按 normalize(href) 做一次“每个 href 只留一条”的去重。
  使用场景：
    - 仅在 fallback 的文档收集路径中使用（JSON 模式允许同页多变体并存）。
*/
function uniqueByHref(list: RandomItem[]): RandomItem[] {
  const m = new Map<string, RandomItem>()
  list.forEach(i => {
    const key = normalize(i.href)
    if (!m.has(key)) m.set(key, { ...i, href: key })
  })
  return [...m.values()]
}

/*
  函数：ensureLeadingSlash
  作用：
    - 确保路径以 / 开头，便于与 base 拼接。
*/
function ensureLeadingSlash(p: string) {
  return p.startsWith('/') ? p : `/${p}`
}

/*
  函数：normalize
  作用：
    - 将任意 href（绝对/相对/含 origin）标准化为“站内路径”（以 / 开头、不含 base 前缀）。
  步骤：
    1) 用 new URL 取 pathname（失败则保留原值）。
    2) ensureLeadingSlash 统一补前导 /。
    3) 计算所有“可能的 base 前缀”（运行时 withBase('/')、自动识别的 /demo-* 或 /v*、手动维护的 /ZenithWorld/）。
    4) 从最长匹配开始剥离一个已知 base，得到纯站内路径。
*/
function normalize(href: string): string {
  let path = href
  try {
    path = new URL(href, location.href).pathname
  } catch {}
  path = ensureLeadingSlash(path)

  // 运行时的 VuePress base（可能为 '/' 或 '/xxx/'）
  const runtimeBase = normalizeBase(withBase('/').replace(location.origin, ''))

  // 自动识别的 demo-/v* 前缀
  const autoBases: string[] = []
  const seg = location.pathname.match(/^\/([^/]+)\//)
  if (seg) {
    const first = seg[1]
    if (/^(demo-[\w.-]+|v[\w.-]+)$/i.test(first)) {
      autoBases.push(`/${first}/`)
    }
  }

  // 手工维护的其它可能前缀（可按需增减）
  const manualBases = ['/ZenithWorld/']

  // 归一化、去空、按长度倒序（保证最长优先匹配）
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

/*
  函数：normalizeBase
  作用：
    - 规范化 base：保证前后都带斜杠（如 'foo' -> '/foo/'，'/' -> '/'）
*/
function normalizeBase(b: string): string {
  if (!b) return '/'
  let x = b
  if (!x.startsWith('/')) x = `/${x}`
  if (!x.endsWith('/')) x = `${x}/`
  return x
}