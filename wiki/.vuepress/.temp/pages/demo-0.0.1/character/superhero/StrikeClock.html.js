import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/superhero/StrikeClock.html.vue"
const data = JSON.parse("{\"path\":\"/demo-0.0.1/character/superhero/StrikeClock.html\",\"title\":\"\",\"lang\":\"zh-CN\",\"frontmatter\":{},\"git\":{},\"readingTime\":{\"minutes\":0,\"words\":0},\"filePathRelative\":\"demo-0.0.1/character/superhero/StrikeClock.md\"}")
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
