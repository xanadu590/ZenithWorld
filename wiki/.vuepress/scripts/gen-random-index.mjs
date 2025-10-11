// wiki/.vuepress/scripts/gen-random-index.mjs
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import fg from 'fast-glob'
import matter from 'gray-matter'

/**
 * 配置：按你的目录来
 */
const ROOT = path.resolve(process.cwd(), 'wiki')
const PUB_DIR = path.join(ROOT, '.vuepress', 'public', 'data')
const OUT_FILE = path.join(PUB_DIR, 'random-index.json')

/**
 * 将 repo 内部的 Markdown 路径，映射成 VuePress 2 的网页路径。
 * 规则：
 *  - /foo/README.md    => /foo/       （或 /）
 *  - /foo/index.md     => /foo/
 *  - /foo/bar.md       => /foo/bar.html
 */
function mdToRoute(mdAbsPath) {
  const rel = path.posix.join(
    ...path.relative(ROOT, mdAbsPath).split(path.sep) // 统一成 POSIX
  )

  // 去掉 .md
  const noExt = rel.replace(/\.md$/i, '')

  // fast-glob 已排除 .vuepress，这里再兜底
  if (noExt.startsWith('.vuepress/')) return null

  // README.md 或 index.md => 目录路由
  if (/\/(README|index)$/i.test(noExt)) {
    const dir = noExt.replace(/\/(README|index)$/i, '')
    return '/' + (dir ? dir + '/' : '')
  }
  // 其它 => .html
  return '/' + noExt + '.html'
}

/**
 * 从 Markdown 内容里提取 “标题 + 摘要”
 * 优先级：
 *  1) frontmatter.title / frontmatter.description
 *  2) 第一行 # 标题
 *  3) 前 1 段纯文本
 */
function extractMeta(content, data) {
  // 1) frontmatter
  let title = (data.title ?? data.pageTitle ?? '').toString().trim()
  let excerpt = (data.description ?? data.excerpt ?? '').toString().trim()

  // 2) 正文第一个 ATX 标题
  if (!title) {
    const m = content.match(/^\s*#\s+(.+?)\s*$/m)
    if (m) title = m[1].trim()
  }

  // 3) 正文前一段做摘要（去掉 markdown 语法，保留中文/字母/数字和空格）
  if (!excerpt) {
    const para = content
      .replace(/<!--[\s\S]*?-->/g, '')               // 注释
      .replace(/```[\s\S]*?```/g, '')                // 三反引号代码块
      .replace(/`[^`]+`/g, '')                       // 行内代码
      .replace(/!\[[^\]]*]\([^)]+\)/g, '')           // 图片
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')       // 链接 -> 文本
      .split(/\n{2,}/)[0] || ''
    excerpt = para
      .replace(/[#>*_\-\[\]()`~]/g, '')              // 简单清理符号
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 120)                                 // 控制长度
  }

  return { title, excerpt }
}

/**
 * 提取“台词”：
 * - frontmatter.quote: string
 * - frontmatter.quotes: string[]
 * - 正文里的 <LeadBlock quote="..."> 或 <LeadBlock quote='...'>
 * - :::quote ... :::（可选）
 */
function extractQuotes(content, data) {
  const set = new Set()

  // 1) frontmatter
  if (typeof data?.quote === 'string') {
    const q = data.quote.trim()
    if (q) set.add(q)
  }
  if (Array.isArray(data?.quotes)) {
    data.quotes.forEach((q) => {
      if (typeof q === 'string' && q.trim()) set.add(q.trim())
    })
  }

  // 2) <LeadBlock quote="...">（支持单双引号；允许组件内有其他属性；可多处）
  const reLeadBlock = /<LeadBlock\b[^>]*\bquote\s*=\s*(?:"([^"]+)"|'([^']+)')/g
  for (const m of content.matchAll(reLeadBlock)) {
    const q = (m[1] ?? m[2] ?? '').trim()
    if (q) set.add(q)
  }

  // 3) :::quote ... :::（可选，用不到可保留）
  const reFence = /:::\s*quote\s*\n([\s\S]*?)\n:::/g
  for (const m of content.matchAll(reFence)) {
    const q = (m[1] ?? '').replace(/\s+/g, ' ').trim()
    if (q) set.add(q)
  }

  return [...set]
}

/** 判定首页或顶层目录页（通常不进入随机池） */
function isTopPage(p) {
  return p === '/' || /\/(index|README)\.html$/i.test(p)
}

async function main() {
  // 1) 扫描 wiki 下所有 .md，排除 .vuepress 与 node_modules
  const entries = await fg('**/*.md', {
    cwd: ROOT,
    ignore: ['.vuepress/**', 'node_modules/**'],
    absolute: true,
  })

  const items = []
  const seenKey = new Set() // 用于去重：path + '\n' + excerpt

  for (const abs of entries) {
    const route = mdToRoute(abs)
    if (!route) continue
    if (!/\.html$|\/$/.test(route)) continue
    if (isTopPage(route)) continue

    const raw = await fsp.readFile(abs, 'utf8')
    const { data, content } = matter(raw)
    const { title, excerpt: autoExcerpt } = extractMeta(content, data)
    if (!title) continue

    // A) 简介卡片：优先 frontmatter.summary，否则用 autoExcerpt
    const summary = (data?.summary ?? '').toString().trim()
    const summaryToUse = summary || autoExcerpt
    if (summaryToUse) {
      const key = `${route}\n${summaryToUse}`
      if (!seenKey.has(key)) {
        items.push({ title, path: route, excerpt: summaryToUse })
        seenKey.add(key)
      }
    }

    // B) 台词卡片：可能多条
    const quotes = extractQuotes(content, data)
    for (const q of quotes) {
      const key = `${route}\n${q}`
      if (!seenKey.has(key)) {
        items.push({ title, path: route, excerpt: q })
        seenKey.add(key)
      }
    }
  }

  // 2) 输出目录
  await fsp.mkdir(PUB_DIR, { recursive: true })

  // 3) 写入 json
  const out = { pages: items }
  await fsp.writeFile(OUT_FILE, JSON.stringify(out, null, 2), 'utf8')

  console.log(
    `[gen-random-index] done: ${items.length} items -> ${path.relative(process.cwd(), OUT_FILE)}`
  )
}

main().catch((e) => {
  console.error('[gen-random-index] failed:', e)
  process.exit(1)
})