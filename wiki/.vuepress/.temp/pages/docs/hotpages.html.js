import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/hotpages.html.vue"
const data = JSON.parse("{\"path\":\"/docs/hotpages.html\",\"title\":\"推荐文章\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"推荐文章\",\"nosearch\":true},\"git\":{\"createdTime\":1764398930000,\"updatedTime\":1764405068000},\"readingTime\":{\"minutes\":0.08,\"words\":25},\"filePathRelative\":\"docs/hotpages.md\"}")
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
