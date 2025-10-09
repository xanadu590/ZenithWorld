// .vuepress/composables/useRandomArticles.ts
import { ref } from 'vue'
import { withBase } from '@vuepress/client'

export interface Candidate {
  href: string
  title?: string
  excerpt?: string
}

export function useRandomArticles(maxHistory = 3) {
  const ready = ref(false)
  const candidates = ref<Candidate[]>([])
  const current = ref<Candidate | null>(null)
  const history = ref<Candidate[]>([])
  const RUNTIME_BASE = normalizeBase(withBase('/'))
  const KNOWN_BASES = new Set<string>([RUNTIME_BASE, '/ZenithWorld/'])

  async function init() {
    ready.value = false
    const fromJson = await loadFromJson()
    candidates.value = fromJson.length ? fromJson : collectFromDocument()
    const curPath = location.pathname
    candidates.value = candidates.value.filter(c => normalize(c.href) !== normalize(curPath))
    if (candidates.value.length) {
      current.value = pickRandom(candidates.value)
      ready.value = true
    }
  }

  async function loadFromJson(): Promise<Candidate[]> {
    try {
      const url = withBase('data/random-index.json')
      const res = await fetch(url, { cache: 'force-cache' })
      if (!res.ok) throw new Error('fetch fail')
      const json = await res.json()
      return normalizeIndex(json)
    } catch {
      return []
    }
  }

  function normalizeIndex(json: any): Candidate[] {
    const toItem = (i: any): Candidate | null => {
      const raw = String(i?.path ?? i?.link ?? '')
      if (!raw) return null
      const href = stripKnownBase(ensureLeadingSlash(raw))
      if (!/\.html$/.test(href) || href.startsWith('http')) return null
      return { href, title: i?.title, excerpt: i?.excerpt }
    }
    const list = Array.isArray(json?.pages)
      ? json.pages.map(toItem).filter(Boolean)
      : Array.isArray(json)
      ? json.map(toItem).filter(Boolean)
      : []
    return uniqueByHref(list as Candidate[])
  }

  function collectFromDocument(): Candidate[] {
    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a'))
    const items = anchors
      .map(a => a.getAttribute('href') || a.href)
      .filter(Boolean)
      .map(h => {
        let p = ''
        try { p = new URL(String(h), location.href).pathname } catch { p = String(h) }
        p = stripKnownBase(ensureLeadingSlash(p))
        return p
      })
      .filter(p => /\.html$/.test(p) && !p.startsWith('http'))
      .map(p => ({ href: p }))
    return uniqueByHref(items)
  }

  function showNext() {
    if (!current.value || candidates.value.length === 0) return
    history.value.unshift(current.value)
    if (history.value.length > maxHistory) history.value.pop()
    let next = pickRandom(candidates.value)
    if (history.value[0] && normalize(next.href) === normalize(history.value[0].href)) {
      next = pickRandom(candidates.value)
    }
    current.value = next
  }

  function showPrev() {
    if (history.value.length === 0) return
    current.value = history.value.shift()!
  }

  function goCurrent() {
    if (!current.value) return
    window.location.assign(withBase(current.value.href))
  }

  /* 工具函数 */
  function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
  function normalize(href: string): string {
    try { return new URL(href, location.href).pathname } catch { return href }
  }
  function ensureLeadingSlash(p: string) { return p.startsWith('/') ? p : `/${p}` }
  function stripKnownBase(p: string): string {
    for (const b of KNOWN_BASES) if (b !== '/' && p.startsWith(b)) return ensureLeadingSlash(p.slice(b.length))
    return p
  }
  function normalizeBase(b: string): string {
    if (!b) return '/'
    let x = b
    if (!x.startsWith('/')) x = `/${x}`
    if (!x.endsWith('/')) x = `${x}/`
    return x
  }
  function uniqueByHref(list: Candidate[]): Candidate[] {
    const m = new Map<string, Candidate>()
    for (const c of list) {
      const k = normalize(c.href)
      if (!m.has(k)) m.set(k, { ...c, href: k })
    }
    return [...m.values()]
  }

  return { ready, candidates, current, history, init, showNext, showPrev, goCurrent }
}