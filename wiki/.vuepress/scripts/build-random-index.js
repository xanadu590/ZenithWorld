// .vuepress/scripts/build-random-index.js
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const ROOT = path.resolve(process.cwd(), 'wiki')
const OUTPUT = path.resolve(ROOT, '.vuepress/public/data/random-index.json') // ✅ 改这里
const PAGES_DIR = ROOT

function walk(dir) {
  const files = fs.readdirSync(dir)
  const list = []
  for (const file of files) {
    const full = path.join(dir, file)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      list.push(...walk(full))
    } else if (file.endsWith('.md')) {
      list.push(full)
    }
  }
  return list
}

function build() {
  const pages = walk(PAGES_DIR).map((file) => {
    const src = fs.readFileSync(file, 'utf8')
    const { data } = matter(src)
    return {
      title: data.title || path.basename(file, '.md'),
      link: file.replace(PAGES_DIR, '').replace(/\.md$/, '.html'),
      excerpt: data.excerpt || '',
    }
  })

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
  fs.writeFileSync(OUTPUT, JSON.stringify({ pages }, null, 2), 'utf8')
  console.log('✅ 生成随机索引:', OUTPUT)
}

build()