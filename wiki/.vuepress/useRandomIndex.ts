// .vuepress/client/useRandomIndex.ts
// 作用：加载站内“随机文章索引”（random-index.json），并提供抽样工具。
// 只在客户端运行；SSR 时不触发网络请求。

import { withBase } from '@vuepress/client'

export type RandomItem = {
  title: string
  link: string          // 对外仍然叫 link
  excerpt?: string
}

let CACHE: RandomItem[] | null = null

function normalizeIndex(json: any): RandomItem[] {
  if (!json) return []

  // 结构1：{ pages: [{ title, path, excerpt }] }
  if (Array.isArray(json?.pages)) {
    return (json.pages as any[])
      .filter(i => i?.title && (i?.path || i?.link))
      .map(i => {
        const link = String(i.path ?? i.link ?? '')
        return {
          title: String(i.title),
          link: link.startsWith('/') ? link : `/${link}`,
          excerpt: String(i.excerpt ?? ''),
        }
      })
  }

  // 结构2：数组 [{ title, link, ... }]
  if (Array.isArray(json) && json.length && 'link' in json[0]) {
    return (json as any[])
      .filter(i => i?.title && i?.link)
      .map(i => ({
        title: String(i.title),
        link: String(i.link).startsWith('/') ? String(i.link) : `/${String(i.link)}`,
        excerpt: String(i.excerpt ?? i.headers?.[0]?.title ?? ''),
      }))
  }

  // 结构3：{ entries: [...] }
  if (Array.isArray((json as any).entries)) {
    return (json.entries as any[])
      .filter(i => i?.title && i?.link)
      .map(i => ({
        title: String(i.title),
        link: String(i.link).startsWith('/') ? String(i.link) : `/${String(i.link)}`,
        excerpt: String(i.excerpt ?? ''),
      }))
  }

  return []
}

/** 加载索引（只加载一次并缓存） */
export async function loadRandomIndex(): Promise<RandomItem[]> {
  if (CACHE) return CACHE
  if (typeof window === 'undefined') return []

  const url = withBase('random-index.json') // ← 只保留这处
  try {
    const res = await fetch(url, { cache: 'force-cache' })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    const json = await res.json()
    const list = normalizeIndex(json)
    CACHE = list
    return list
  } catch (e) {
    console.warn('[Random] loadRandomIndex fail:', e)
    CACHE = []
    return CACHE
  }
}

/** 从索引中抽一个随机项；可传入排除集合避免最近重复 */
export function pickRandom(
  list: RandomItem[],
  exclude: Set<string> = new Set()
): RandomItem | null {
  const candidates = list.filter(i => !exclude.has(i.link))
  const pool = candidates.length ? candidates : list
  if (!pool.length) return null
  const idx = Math.floor(Math.random() * pool.length)
  return pool[idx]
}

/** 生成可用于 <a href> 或 router.push 的最终链接（带 base 前缀） */
export function resolveRandomLink(item: RandomItem): string {
  return withBase(item.link)
}