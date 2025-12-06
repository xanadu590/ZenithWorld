import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/test-a.html.vue"
const data = JSON.parse("{\"path\":\"/docs/world/characters/superhero/test-a.html\",\"title\":\"测试目标A\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"测试目标A\",\"description\":\"术语总览 这里是按 五大分类 和 标签 自动生成的索引页。 说明：只要某篇文档的 Frontmatter 里写了 category / tag，就会自动出现在下面列表中。\"},\"git\":{\"createdTime\":1764636538000,\"updatedTime\":1764745209000},\"readingTime\":{\"minutes\":0.24,\"words\":72},\"filePathRelative\":\"docs/world/characters/superhero/test-a.md\",\"autoDesc\":true}")
export { comp, data }

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updatePageData) {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ data }) => {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  })
}
