import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/concepts/index.html.vue"
const data = JSON.parse("{\"path\":\"/docs/world/concepts/\",\"title\":\"概念\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"概念\",\"nosearch\":true},\"git\":{\"createdTime\":1763552885000,\"updatedTime\":1763609204000},\"readingTime\":{\"minutes\":0.02,\"words\":5},\"filePathRelative\":\"docs/world/concepts/README.md\"}")
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
