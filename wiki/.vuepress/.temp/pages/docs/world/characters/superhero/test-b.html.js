import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/test-b.html.vue"
const data = JSON.parse("{\"path\":\"/docs/world/characters/superhero/test-b.html\",\"title\":\"测试 B\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"测试 B\",\"description\":\"我在这里随便写一句：测试目标A 会不会被自动加链接。\"},\"git\":{},\"readingTime\":{\"minutes\":0.09,\"words\":27},\"filePathRelative\":\"docs/world/characters/superhero/test-b.md\",\"autoDesc\":true}")
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
