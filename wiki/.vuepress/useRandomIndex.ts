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

  const url = withBase('data/random-index.json')
  // ✅ 这三行是新增的日志，不影响功能
  console.log('[RandomIndex] 请求路径 =', url)

  try {
    const res = await fetch(url, { cache: 'force-cache' })
    console.log('[RandomIndex] 请求状态 =', res.status, res.statusText)

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    const json = await res.json()
    const list = normalizeIndex(json)

    // ✅ 打印解析后的数量
    console.log('[RandomIndex] 成功解析条目数 =', list.length)

    CACHE = list
    return list
  } catch (e) {
    console.warn('[RandomIndex] 加载失败：', e)
    CACHE = []
    return CACHE
  }
}