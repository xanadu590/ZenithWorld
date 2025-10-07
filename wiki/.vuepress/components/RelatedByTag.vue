<template>
  <ClientOnly>
    <section v-if="items.length" class="related">
      <h3>你可能感兴趣</h3>
      <div class="grid">
        <article v-for="it in items" :key="it.path" class="card">
          <a :href="it.path" class="cover" v-if="it.cover">< img :src="it.cover" :alt="it.title" loading="lazy" /></a >
          <h4><a :href="it.path">{{ it.title }}</a ></h4>
          <p class="meta" v-if="it.tags?.length">#{{ it.tags.slice(0,3).join(' #') }}</p >
        </article>
      </div>
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePageData, usePagesData } from 'vuepress/client'

type Rel = { path: string; title: string; cover?: string; tags: string[]; score: number }
const items = ref<Rel[]>([])

onMounted(async () => {
  const page = usePageData()
  const pagesData = usePagesData()

  const cur = await pagesData[page.value.path]()
  const curTags = new Set<string>([...(cur.frontmatter.tag || []), ...(cur.frontmatter.tags || [])])

  // 没标签就不算相关推荐
  if (!curTags.size) return

  const tmp: Rel[] = []
  for (const key of Object.keys(pagesData)) {
    if (key === page.value.path) continue
    const p = await pagesData[key]()
    const tags: string[] = [...(p.frontmatter.tag || []), ...(p.frontmatter.tags || [])]
    if (!tags.length) continue
    const score = tags.filter(t => curTags.has(t)).length
    if (!score) continue
    tmp.push({
      path: p.path,
      title: p.title || p.path,
      cover: p.frontmatter.heroImage,
      tags,
      score,
    })
  }

  items.value = tmp.sort((a,b) => b.score - a.score).slice(0, 6)
})
</script>

<style scoped>
.related{ margin-top: 28px; }
.related h3{ margin: 0 0 12px; font-size: 18px; }
.grid{ display:grid; grid-template-columns: repeat(auto-fill,minmax(220px,1fr)); gap: 12px; }
.card{ border:1px solid var(--c-border,#e5e7eb); border-radius:10px; overflow:hidden; background:var(--c-bg,#fff); }
.cover{ display:block; aspect-ratio: 16/9; overflow:hidden; }
.cover img{ width:100%; height:100%; object-fit:cover; display:block; transition: transform .25s; }
.card:hover .cover img{ transform: scale(1.03); }
.card h4{ font-size: 14px; margin: 10px 10px 6px; line-height: 1.35; }
.meta{ font-size: 12px; color: var(--c-text,#111); opacity: .7; margin: 0 10px 12px; }
</style>