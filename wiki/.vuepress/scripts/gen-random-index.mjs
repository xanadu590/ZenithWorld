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

  // 去掉开头的 .vuepress/ 等（fast-glob 已排除，这里再兜底）
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
      .replace(/`{1,3}[\s\S]*?`{1,3}/g, '')          // 行内/代码块（粗暴去掉）
      .replace(/!\[[^\]]*]\([^)]+\)/g, '')           // 图片
      .replace(/\[[^\]]*]\([^)]+\)/g, (_, t) => t)   // 链接 -> 文本
      .split(/\n{2,}/)[0] || ''
    excerpt = para
      .replace(/[#>*_\-\[\]()`~]/g, '')              // 简单清理符号
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 120)                                 // 控制长度
  }

  return { title, excerpt }
}

async function main() {
  // 1) 扫描 wiki 下所有 .md，排除 .vuepress与 node_modules
  const entries = await fg('**/*.md', {
    cwd: ROOT,
    ignore: ['.vuepress/**', 'node_modules/**'],
    absolute: true,
  })

  const pages = []

  for (const abs of entries) {
    const route = mdToRoute(abs)
    if (!route) continue

    const raw = await fsp.readFile(abs, 'utf8')
    const { data, content } = matter(raw)
    const { title, excerpt } = extractMeta(content, data)

    // 忽略没有标题的页（也可以放开）
    if (!title && route !== '/') continue

    pages.push({
      title: title || route,
      path: route,       // 你的 RandomCard.vue 用的是 path/href 均可
      excerpt,
    })
  }

  // 2) 输出目录
  await fsp.mkdir(PUB_DIR, { recursive: true })

  // 3) 写入 json
  const json = { pages }
  await fsp.writeFile(OUT_FILE, JSON.stringify(json, null, 2), 'utf8')

  console.log(`[gen-random-index] done: ${pages.length} pages -> ${path.relative(process.cwd(), OUT_FILE)}`)
}

main().catch((e) => {
  console.error('[gen-random-index] failed:', e)
  process.exit(1)
})