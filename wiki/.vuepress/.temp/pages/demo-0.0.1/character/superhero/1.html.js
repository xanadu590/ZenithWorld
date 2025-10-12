import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/superhero/1.html.vue"
const data = JSON.parse("{\"path\":\"/demo-0.0.1/character/superhero/1.html\",\"title\":\"\",\"lang\":\"zh-CN\",\"frontmatter\":{\"sidebar\":false},\"git\":{\"createdTime\":1759644953000,\"updatedTime\":1760099644000},\"readingTime\":{\"minutes\":0.21,\"words\":64},\"filePathRelative\":\"demo-0.0.1/character/superhero/1.md\"}")
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
