// wiki/.vuepress/composables/useRandomPool.ts
import { ref } from 'vue'
import { withBase } from '@vuepress/client'

/** 随机池条目（站内“可直达的 .html 页面”） */
export type RandomItem = {
  href: string
  title?: string
  excerpt?: string
}

/**
 * 全站随机文章数据源（组合式 API）
 * - 优先从 /data/random-index.json 读取全站索引
 * - 读取失败时，回退为“扫描当前页面中的站内链接”
 * - 自动剥离 base（兼容 /、/demo-0.0.1/、/ZenithWorld/ 等）
 * - 过滤首页与当前页，避免推荐到自己
 * - 提供无放回采样（不重复）
 */
export function useRandomPool() {
  const pool = ref<RandomItem[]>([])  // 可用候选的集合（已标准化、去重、过滤）
  const loaded = ref(false)           // 是否完成加载

  /**
   * 依次尝试多个候选 URL 去拉取 JSON；
   * 成功返回解析对象，全部失败返回 null。
   */
  const tryFetch = async <T = any>(candidates: string[]): Promise<T | null> => {
    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: 'force-cache' })
        if (!res.ok) continue
        const json = await res.json()
        return json as T
      } catch {
        // 忽略单个候选的失败，继续尝试下一个
      }
    }
    return null
  }

  /**
   * 加载随机池：
   * 1) 组装 JSON 的可能地址（受 base 影响的 / 去 base 的 / 站点根）
   * 2) 读取到 JSON 就解析；否则回退扫描页面链接
   * 3) 去重 + 过滤首页/当前页
   */
  const load = async () => {
    loaded.value = false
    pool.value = []

    // 受 base 影响的地址，如：/demo-0.0.1/data/random-index.json
    const baseUrl = withBase('data/random-index.json')

    // 尝试把“首段 demo-* 或 v*”当作 base 去掉：
    // /demo-0.0.1/data/random-index.json -> /data/random-index.json
    const stripped = (() => {
      try {
        const u = new URL(baseUrl, location.origin)
        const seg = u.pathname.match(/^\/([^/]+)\/(.*)$/)
        if (seg) {
          const first = seg[1]
          if (/^(demo-[\w.-]+|v[\w.-]+)$/i.test(first)) {
            return `/${seg[2]}`
          }
        }
      } catch {}
      return null
    })()

    // 候选列表去重（Set）后，依次尝试
    const candidates = Array.from(
      new Set([
        baseUrl,
        '/data/random-index.json',
        stripped ?? undefined,
      ].filter(Boolean) as string[])
    )

    // 先试拉 JSON；失败则回退扫描
    const json = await tryFetch<any>(candidates)
    if (json) {
      pool.value = normalizeIndex(json)     // 解析 JSON 为 RandomItem[]
    } else {
      pool.value = collectFromDocument()    // 扫描当前页 <a> 的兜底方案
    }

    // 统一去重（以标准化后的 href 为 key）
    pool.value = uniqueByHref(pool.value)

    // 过滤：去掉“首页”和“当前页”
    const cur = normalize(location.pathname)
    pool.value = pool.value.filter(i => {
      const p = normalize(i.href)
      // p !== cur：不等于标准化后的当前路径
      // !location.pathname.endsWith(p)：避免 base 差异造成的“看似不同实为同页”
      return !isTopPage(p) && p !== cur && !location.pathname.endsWith(p)
    })

    loaded.value = true
  }

  /**
   * 采样 n 条（无放回、不重复）
   * - 每次从副本里随机拿一个并移除
   * - 用 Set 防止因不同写法（相对/绝对）导致的“同页重复”
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
    return out
  }

  /** 把站内 path 还原为“带 base 的最终可跳转地址” */
  const resolveLink = (p: string) => withBase(ensureLeadingSlash(p))

  return { pool, loaded, load, sample, resolveLink }
}

/* ===================== 工具函数 ===================== */

/**
 * 把 random-index.json 解析为 RandomItem[]（容错两种结构）：
 * - 仅接受以 .html 结尾的站内页面
 * - 排除首页与外链
 */
function normalizeIndex(json: any): RandomItem[] {
  if (!json) return []

  const toItem = (i: any): RandomItem | null => {
    const raw = String(i?.path ?? i?.link ?? '')
    if (!raw) return null
    const href = normalize(raw)
    if (!/\.html$/i.test(href) || isTopPage(href) || href.startsWith('http')) {
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

  return uniqueByHref(list as RandomItem[])
}

/**
 * 兜底方案：从文档中收集“本站的 .html 链接”
 * - 仅保留同域、非外链、非首页
 */
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

/** 判定“首页”：/、/index.html、/README.html 都视为顶层页 */
function isTopPage(p: string): boolean {
  const x = normalize(p)
  return x === '/' || /\/index\.html$/i.test(x) || /\/README\.html$/i.test(x)
}

/** 以标准化后的 href 为 key 去重 */
function uniqueByHref(list: RandomItem[]): RandomItem[] {
  const m = new Map<string, RandomItem>()
  list.forEach(i => {
    const key = normalize(i.href)
    if (!m.has(key)) m.set(key, { ...i, href: key })
  })
  return [...m.values()]
}

/** 确保以 / 开头 */
function ensureLeadingSlash(p: string) {
  return p.startsWith('/') ? p : `/${p}`
}

/**
 * 标准化 href 为“站内路径”（与 base 无关）：
 * 1) 仅保留 pathname（去掉域名）
 * 2) 剥离可能的 base 前缀：
 *    - 运行时 base：withBase('/')
 *    - 历史前缀：'/ZenithWorld/'
 *    - 自动识别的首段：若当前 URL 第一段形如 'demo-*' 或 'v*'，也视作 base
 * 3) 最终保证以 '/' 开头
 */
function normalize(href: string): string {
  let path = href
  try {
    path = new URL(href, location.href).pathname
  } catch {}
  path = ensureLeadingSlash(path)

  // 运行时 base（可能是 '/' 或 '/demo-0.0.1/' 等）
  const runtimeBase = normalizeBase(withBase('/').replace(location.origin, ''))

  // 自动把当前 URL 的第一段（demo-* / v*）识别为潜在 base
  const autoBases: string[] = []
  const seg = location.pathname.match(/^\/([^/]+)\//)
  if (seg) {
    const first = seg[1]
    if (/^(demo-[\w.-]+|v[\w.-]+)$/i.test(first)) {
      autoBases.push(`/${first}/`)
    }
  }

  // 历史手动列举的 base
  const manualBases = ['/ZenithWorld/']

  // 汇总并按长度降序，避免短前缀先剥导致误判
  const knownBases = [runtimeBase, ...autoBases, ...manualBases]
    .filter(Boolean)
    .map(normalizeBase)
    .sort((a, b) => b.length - a.length)

  for (const b of knownBases) {
    if (b !== '/' && path.startsWith(b)) {
      path = ensureLeadingSlash(path.slice(b.length))
      break
    }
  }
  return path
}

/** 标准化 base：确保前后都有斜杠（/xxx/ 形态） */
function normalizeBase(b: string): string {
  if (!b) return '/'
  let x = b
  if (!x.startsWith('/')) x = `/${x}`
  if (!x.endsWith('/')) x = `${x}/`
  return x
}