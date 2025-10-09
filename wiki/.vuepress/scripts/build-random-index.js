// .vuepress/scripts/build-random-index.js
// 自动生成 random-index.json → 输出到 .vuepress/public/

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const ROOT = path.resolve(process.cwd(), 'wiki')
const DOCS = path.join(ROOT) // 你的文档主目录
const OUTPUT = path.resolve(ROOT, '.vuepress/public/data/random-index.json')

// 递归读取 Markdown 文件
function walk(dir) {
  const files = fs.readdirSync(dir)
  let result = []
  for (const f of files) {
    const full = path.join(dir, f)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      result = result.concat(walk(full))
    } else if (f.endsWith('.md')) {
      result.push(full)
    }
  }
  return result
}

// 提取标题、摘要
function extract(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  const title =
    data.title ||
    content.split('\n').find(l => l.trim().startsWith('# '))?.replace(/^# /, '') ||
    path.basename(filePath, '.md')

  const excerpt = content
    .replace(/[#>*`\[\]\(\)!-]/g, '')
    .trim()
    .split('\n')
    .find(line => line.length > 10) || ''

  // 生成相对路径：例如 /demo-0.0.1/character/foo.html
  const rel = filePath.replace(DOCS, '').replace(/\\/g, '/')
  const pathUrl = rel.replace(/\/README\.md$/, '/').replace(/\.md$/, '.html')

  return { title, path: pathUrl, excerpt }
}

function main() {
  const pages = walk(DOCS)
    .filter(p => !p.includes('.vuepress'))
    .map(extract)
    .filter(i => i.title && i.path)

  const json = { pages }
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
  fs.writeFileSync(OUTPUT, JSON.stringify(json, null, 2))
  console.log(`✅ 生成 random-index.json，共 ${pages.length} 篇 → ${OUTPUT}`)
}

main()