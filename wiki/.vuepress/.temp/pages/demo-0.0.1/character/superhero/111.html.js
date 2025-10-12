import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/superhero/111.html.vue"
const data = JSON.parse("{\"path\":\"/demo-0.0.1/character/superhero/111.html\",\"title\":\"\",\"lang\":\"zh-CN\",\"frontmatter\":{},\"git\":{\"createdTime\":1759711076000,\"updatedTime\":1760238137000},\"readingTime\":{\"minutes\":0.5,\"words\":150},\"filePathRelative\":\"demo-0.0.1/character/superhero/111.md\"}")
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
