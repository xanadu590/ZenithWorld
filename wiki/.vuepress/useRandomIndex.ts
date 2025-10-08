// .vuepress/client/useRandomIndex.ts
// 作用：加载站内的“可随机文章索引”，并提供抽样工具。
// 只在客户端运行；SSR 时不触发网络请求。

type RandomItem = {
  title: string
  link: string
  excerpt?: string
};

let CACHE: RandomItem[] | null = null;

// 把任意搜索索引的条目，映射为 {title, link, excerpt}
function normalizeIndex(json: any): RandomItem[] {
  if (!json) return [];

  // 常见结构1：@vuepress/plugin-search 的 { title, link, headers, excerpt }
  if (Array.isArray(json) && json.length && 'link' in json[0]) {
    return json
      .filter((i: any) => i?.title && i?.link)
      .map((i: any) => ({
        title: i.title,
        link: i.link,                 // 如 "/foo/bar.html"
        excerpt: i.excerpt || i.headers?.[0]?.title || '',
      }));
  }

  // 常见结构2：有些主题会包一层 { entries: [...] }
  if (Array.isArray(json?.entries)) {
    return json.entries
      .filter((i: any) => i?.title && i?.link)
      .map((i: any) => ({
        title: i.title,
        link: i.link,
        excerpt: i.excerpt || '',
      }));
  }

  return [];
}

/** 加载索引（只加载一次并缓存） */
export async function loadRandomIndex(): Promise<RandomItem[]> {
  if (CACHE) return CACHE;

  // 只在浏览器端执行
  if (typeof window === 'undefined') return [];

  // 多路径兜底
  const candidates = [
    '/searchIndex.json',
    '/search.json',
    '/assets/searchIndex.json',
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: 'force-cache' });
      if (res.ok) {
        const json = await res.json();
        const list = normalizeIndex(json);
        if (list.length) {
          CACHE = list;
          return CACHE;
        }
      }
    } catch (e) {
      // 忽略单个路径失败，继续尝试下一个
    }
  }

  // 兜底：没有索引就返回空
  CACHE = [];
  return CACHE;
}

/** 从索引中抽一个随机项；可传入排除集合避免最近重复 */
export function pickRandom(list: RandomItem[], exclude: Set<string> = new Set()): RandomItem | null {
  const candidates = list.filter(i => !exclude.has(i.link));
  const pool = candidates.length ? candidates : list; // 如果全被排除了，就放开限制
  if (!pool.length) return null;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

export type { RandomItem };