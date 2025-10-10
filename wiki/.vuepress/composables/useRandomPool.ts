// wiki/.vuepress/composables/useRandomPool.ts
import { ref } from 'vue'
import { withBase } from '@vuepress/client'

/** 随机池条目（站内路径为 href，形如 /xxx/yyy.html） */
export type RandomItem = {
  href: string
  title?: string
  excerpt?: string
}

/**
 * 提供“全站随机文章池”的加载与抽样能力
 * - 优先加载 data/random-index.json
 * - 失败时回退：扫描当前页面站内 <a> 链接
 * - 全局去重、防止采样重复
 * - 自动排除当前页
 */
export function useRandomPool() {
  const pool = ref<RandomItem[]>([])
  const loaded = ref(false)

  /** 加载全站 random-index.json；失败则回退到“本页站内链接收集” */
  const load = async () => {
    loaded.value = false
    pool.value = []

    // 1) 先尝试全站索引
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

    // 2) 标准化并去重
    pool.value = uniqueByHref(pool.value)

    // 3) 去掉当前页自己
    const cur = normalize(location.pathname)
    pool.value = pool.value.filter(i => normalize(i.href) !== cur)

    loaded.value = true
  }

  /** 随机抽样 N 条（不放回、不重复） */
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

  /** 将站内 path 变成最终可跳转 href（自动加 base） */
  const resolveLink = (p: string) => withBase(ensureLeadingSlash(p))

  return {
    pool,
    loaded,
    load,
    sample,
    resolveLink,
  }
}

/* ================= 工具函数 ================ */

/** 解析 random-index.json 为 RandomItem[]（兼容两种结构） */
function normalizeIndex(json: any): RandomItem[] {
  if (!json) return []

  const toItem = (i: any): RandomItem | null => {
    const raw = String(i?.path ?? i?.link ?? '')
    if (!raw) return null
    // 统一处理为站内路径（去掉可能的域名/基路径）
    const href = normalize(raw)
    // 仅接受本站的 .html 条目
    if (!/\.html$/.test(href) || href.startsWith('http')) return null
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

/** 从文档中收集“本站 .html”链接，作为兜底数据源 */
function collectFromDocument(): RandomItem[] {
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a'))
  const items = anchors
    .map(a => a.getAttribute('href') || a.href)
    .filter(Boolean)
    .map(h => normalize(String(h)))
    .filter(p => /\.html$/.test(p) && !p.startsWith('http'))
    .map(p => ({
      href: p,
      title: '', // 这里只放路径，标题/摘要可后续再完善
      excerpt: '',
    }))
  return uniqueByHref(items)
}

/** 去重（基于标准化后的 href） */
function uniqueByHref(list: RandomItem[]): RandomItem[] {
  const m = new Map<string, RandomItem>()
  list.forEach(i => {
    const key = normalize(i.href)
    if (!m.has(key)) m.set(key, { ...i, href: key })
  })
  return [...m.values()]
}

/** 确保前导斜杠 */
function ensureLeadingSlash(p: string) {
  return p.startsWith('/') ? p : `/${p}`
}

/**
 * 【关键修复点】将各种 href（相对/绝对/含 base）标准化为**站内根路径**：
 * - 绝对 URL（http/https）：直接取 pathname
 * - 非绝对 URL：
 *   - 如果不以 "/" 开头（例如 "demo-0.0.1/foo.html"），**强制补 "/"** → "/demo-0.0.1/foo.html"
 *     这样就不会被浏览器当成“相对当前页面目录”的相对路径，从而避免跳转 404
 * - 去掉已知的 base 前缀（运行时 base 或常见的 '/ZenithWorld/'）
 * - 最终返回以 "/" 开头的站内路径
 */
function normalize(href: string): string {
  let raw = String(href || '').trim()
  if (!raw) return '/'

  // 1) 绝对 URL：取 pathname 即可
  if (/^https?:\/\//i.test(raw)) {
    try {
      return new URL(raw).pathname
    } catch {
      return '/'
    }
  }

  // 2) 非绝对 URL：
  //    —— 这里是本次修复的核心：不以 "/" 开头的，一律视为“站点根路径”，先补一个 "/"
  //    例如 "demo-0.0.1/foo.html" -> "/demo-0.0.1/foo.html"
  //    避免使用 new URL(raw, location.href) 把它解析为“相对当前页面目录”的路径。
  if (!raw.startsWith('/')) raw = '/' + raw

  // 3) 先得到规范化的 path
  let path = raw

  // 4) 去掉已知 base 前缀
  //    - 运行时 base（如 "/" 或 "/ZenithWorld/"），通过 withBase('/') 获取，再去掉域名
  //    - 手动兼容一个常见的 "/ZenithWorld/"（即使运行时 base 为 "/" 也能匹配）
  const runtimeBase = normalizeBase(withBase('/').replace(location.origin, ''))
  const knownBases = new Set<string>([runtimeBase, '/ZenithWorld/'])

  for (const b of knownBases) {
    // base 为 "/" 时无需处理；其余情况若命中前缀则剥离
    if (b !== '/' && path.startsWith(b)) {
      path = ensureLeadingSlash(path.slice(b.length))
      break
    }
  }

  return path
}

/** 规范化 base：确保前后都有斜杠（例如 "ZenithWorld" -> "/ZenithWorld/"） */
function normalizeBase(b: string): string {
  if (!b) return '/'
  let x = b
  if (!x.startsWith('/')) x = `/${x}`
  if (!x.endsWith('/')) x = `${x}/`
  return x
}