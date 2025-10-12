// wiki/.vuepress/scripts/gen-random-index.mjs
/*
  脚本名称：gen-random-index.mjs
  用途综述：
    - 在构建/本地命令行中扫描 wiki 目录下的 Markdown 文件，生成一个随机推荐用的索引 JSON：
        .vuepress/public/data/random-index.json
    - 每个页面可生成“简介卡片”（summary/excerpt）与“台词卡片”（quote），供前端随机组件读取。
  工作流程：
    1) 通过 fast-glob 枚举所有 Markdown 文件（排除 .vuepress 与 node_modules）。
    2) 使用 gray-matter 解析 Frontmatter 与正文。
    3) 依据规则提取网页路由、标题、简介（摘要）与台词（LeadBlock/:::quote/Frontmatter）。
    4) 去重（同一页面+相同文案只保留一条），写出 JSON 文件。
  可调参数与改法：
    - ROOT：扫描根目录（默认 wiki），若项目路径不同可修改为你的内容根目录。
    - PUB_DIR/OUT_FILE：输出目录与文件名；需要与前端读取路径保持一致（默认 /data/random-index.json）。
    - extractMeta()：摘要截断长度（默认 120 字），可按需调整 slice(0, 120)。
    - extractQuotes()：若要支持更多自定义台词语法，可在正则中扩展。
    - isTopPage()：定义“顶层页”（首页）过滤规则，可按站点实际调整。
*/

import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import fg from 'fast-glob'
import matter from 'gray-matter'

/*
  配置：按你的目录来
  - ROOT：内容根目录（被扫描的 markdown 所在目录）
  - PUB_DIR：输出 JSON 所在的静态资源目录（会被 VuePress 原样拷贝）
  - OUT_FILE：最终的输出文件路径
*/
const ROOT = path.resolve(process.cwd(), 'wiki')
const PUB_DIR = path.join(ROOT, '.vuepress', 'public', 'data')
const OUT_FILE = path.join(PUB_DIR, 'random-index.json')

/*
  函数：mdToRoute(mdAbsPath)
  作用：把仓库里的 Markdown 文件绝对路径转换为 VuePress 2 对应的页面路由。
  规则：
    - /foo/README.md    => /foo/         // 目录首页
    - /foo/index.md     => /foo/         // 目录首页
    - /foo/bar.md       => /foo/bar.html // 普通页面
  注意：
    - 使用 path.posix 统一成 POSIX 分隔符，避免跨平台差异。
    - fast-glob 已排除 .vuepress，但这里仍做一次兜底过滤。
*/
function mdToRoute(mdAbsPath) {
  const rel = path.posix.join(
    ...path.relative(ROOT, mdAbsPath).split(path.sep) // 统一成 POSIX
  )

  // 去掉 .md 扩展名
  const noExt = rel.replace(/\.md$/i, '')

  // 兜底：忽略 .vuepress 目录下的文件
  if (noExt.startsWith('.vuepress/')) return null

  // README.md 或 index.md => 目录路由
  if (/\/(README|index)$/i.test(noExt)) {
    const dir = noExt.replace(/\/(README|index)$/i, '')
    return '/' + (dir ? dir + '/' : '')
  }
  // 其它 => .html
  return '/' + noExt + '.html'
}

/*
  函数：extractMeta(content, data)
  作用：从 Frontmatter/正文中提取标题与摘要。
  优先级：
    1) frontmatter.title / frontmatter.description
    2) 正文第一行 ATX 标题（# 标题）
    3) 正文第一段纯文本（去除注释/代码/图片/链接等），并截断到 120 字
  返回：
    { title, excerpt }
  可调：
    - 摘要截断长度：修改 .slice(0, 120)
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

  // 3) 正文前一段做摘要（剔除无关标记）
  if (!excerpt) {
    const para = content
      .replace(/<!--[\s\S]*?-->/g, '')               // 注释
      .replace(/```[\s\S]*?```/g, '')                // 代码块
      .replace(/`[^`]+`/g, '')                       // 行内代码
      .replace(/!\[[^\]]*]\([^)]+\)/g, '')           // 图片
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')       // 链接 -> 文本
      .split(/\n{2,}/)[0] || ''                      // 第一段
    excerpt = para
      .replace(/[#>*_\-\[\]()`~]/g, '')              // 杂项符号
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 120)                                 // 可调：摘要长度
  }

  return { title, excerpt }
}

/*
  函数：extractQuotes(content, data)
  作用：从 Frontmatter/正文提取“台词”候选，去重后返回数组。
  支持来源：
    - frontmatter.quote: string
    - frontmatter.quotes: string[]
    - 组件语法：<LeadBlock quote="..."> 或 <LeadBlock quote='...'>
    - 容器语法：:::quote ... :::
  可扩展：
    - 若你的项目存在其它标记方式，可在此追加正则匹配逻辑。
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

  // 2) <LeadBlock quote="..."> / '...'
  const reLeadBlock = /<LeadBlock\b[^>]*\bquote\s*=\s*(?:"([^"]+)"|'([^']+)')/g
  for (const m of content.matchAll(reLeadBlock)) {
    const q = (m[1] ?? m[2] ?? '').trim()
    if (q) set.add(q)
  }

  // 3) :::quote ... :::
  const reFence = /:::\s*quote\s*\n([\s\S]*?)\n:::/g
  for (const m of content.matchAll(reFence)) {
    const q = (m[1] ?? '').replace(/\s+/g, ' ').trim()
    if (q) set.add(q)
  }

  return [...set]
}

/*
  函数：isTopPage(p)
  作用：判定是否首页或顶层目录页，这类页面不纳入随机池。
  规则：
    - '/' 或以 /index.html、/README.html 结尾的页面
*/
function isTopPage(p) {
  return p === '/' || /\/(index|README)\.html$/i.test(p)
}

/*
  函数：ensureQuoted(text)
  作用：台词文本若没有成对引号，则默认加一层中文引号“”；已有任意成对引号则保持原样。
  场景：
    - 保证前端展示时台词的观感统一。
*/
function ensureQuoted(text) {
  const s = (text || '').trim()
  if (!s) return s
  const pairs = [
    ['"', '"'],      // 直双引号
    ['“', '”'],      // 中文双引号
    ['「', '」'],    // 日式
    ['『', '』'],
    ['‘', '’'],      // 英/中文单引号
    ["'", "'"],
  ]
  for (const [l, r] of pairs) {
    if (s.startsWith(l) && s.endsWith(r)) return s
  }
  // 默认包一层中文双引号（若想用英文直引号，可改为 `"${s}"`）
  return `“${s}”`
}

/*
  主流程：main()
  作用：
    - 扫描 markdown 文件，抽取元数据，构建 items 列表并写入 JSON。
  输出结构：
    {
      "pages": [
        { "title": "...", "path": "/foo/bar.html", "excerpt": "..." },
        ...
      ]
    }
*/
async function main() {
  const entries = await fg('**/*.md', {
    cwd: ROOT,
    ignore: ['.vuepress/**', 'node_modules/**'], // 忽略内部与依赖目录
    absolute: true,                               // 返回绝对路径，便于读取
  })

  const items = []
  const seenKey = new Set() // path + '\n' + excerpt，用于去重同页同文案

  for (const abs of entries) {
    const route = mdToRoute(abs)
    if (!route) continue
    if (!/\.html$|\/$/.test(route)) continue
    if (isTopPage(route)) continue

    const raw = await fsp.readFile(abs, 'utf8')
    const { data, content } = matter(raw)
    const { title, excerpt: autoExcerpt } = extractMeta(content, data)
    if (!title) continue

    // A) 简介卡片：优先 frontmatter.summary，否则使用自动摘要
    const summary = (data?.summary ?? '').toString().trim()
    const summaryToUse = summary || autoExcerpt
    if (summaryToUse) {
      const key = `${route}\n${summaryToUse}`
      if (!seenKey.has(key)) {
        items.push({ title, path: route, excerpt: summaryToUse })
        seenKey.add(key)
      }
    }

    // B) 台词卡片：保持/补充双引号后入表
    const quotes = extractQuotes(content, data)
    for (const qRaw of quotes) {
      const q = ensureQuoted(qRaw)
      const key = `${route}\n${q}`
      if (!seenKey.has(key)) {
        items.push({ title, path: route, excerpt: q })
        seenKey.add(key)
      }
    }
  }

  // 确保输出目录存在并写入 JSON
  await fsp.mkdir(PUB_DIR, { recursive: true })
  const out = { pages: items }
  await fsp.writeFile(OUT_FILE, JSON.stringify(out, null, 2), 'utf8')

  console.log(
    `[gen-random-index] done: ${items.length} items -> ${path.relative(process.cwd(), OUT_FILE)}`
  )
}

/*
  执行入口：
    - 直接 node 运行此脚本时执行 main()
    - 发生异常时打印错误并以非零码退出，便于 CI 失败感知
*/
main().catch((e) => {
  console.error('[gen-random-index] failed:', e)
  process.exit(1)
})