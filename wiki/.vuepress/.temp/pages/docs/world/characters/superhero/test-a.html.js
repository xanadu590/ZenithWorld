import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/test-a.html.vue"
const data = JSON.parse("{\"path\":\"/docs/world/characters/superhero/test-a.html\",\"title\":\"测试目标A\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"测试目标A\",\"description\":\"这是测试目标 A 的页面。\"},\"git\":{},\"readingTime\":{\"minutes\":0.05,\"words\":16},\"filePathRelative\":\"docs/world/characters/superhero/test-a.md\",\"autoDesc\":true}")
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
