import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/characterline.html.vue"
const data = JSON.parse("{\"path\":\"/demo-0.0.1/characterline.html\",\"title\":\"\",\"lang\":\"zh-CN\",\"frontmatter\":{\"description\":\"人物关系图谱\"},\"git\":{\"createdTime\":1759760065000,\"updatedTime\":1759833016000},\"readingTime\":{\"minutes\":0.17,\"words\":50},\"filePathRelative\":\"demo-0.0.1/characterline.md\",\"autoDesc\":true}")
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
