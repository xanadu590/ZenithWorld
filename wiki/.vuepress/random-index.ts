// .vuepress/plugins/random-index.ts
import type { Plugin } from 'vuepress'
import { fs, path } from '@vuepress/utils'

export const randomIndexPlugin = (): Plugin => ({
  name: 'random-index-plugin',
  // 构建完成后输出一个精简索引
  onGenerated: async (app) => {
    const items = app.pages
      .filter(p => !p.path.endsWith('/404.html'))
      .map(p => ({
        title: p.title ?? '',
        path: p.path,
        excerpt: (p.frontmatter?.description || p.data?.excerpt || '')
          .toString().slice(0, 180)
      }))
      .filter(x => x.title && x.path)

    const out = path.join(app.dir.dest(), 'random-index.json')
    await fs.writeFile(out, JSON.stringify({ pages: items }, null, 2), 'utf-8')
  }
})