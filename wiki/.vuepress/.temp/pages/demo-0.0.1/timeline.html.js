import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/timeline.html.vue"
const data = JSON.parse("{\"path\":\"/demo-0.0.1/timeline.html\",\"title\":\"世界大事年表\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"世界大事年表\"},\"git\":{\"createdTime\":1759756071000,\"updatedTime\":1759756423000},\"readingTime\":{\"minutes\":0.28,\"words\":84},\"filePathRelative\":\"demo-0.0.1/timeline.md\"}")
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
