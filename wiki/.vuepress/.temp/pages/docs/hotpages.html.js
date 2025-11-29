import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/hotpages.html.vue"
const data = JSON.parse("{\"path\":\"/docs/hotpages.html\",\"title\":\"🔥 热门文章\",\"lang\":\"zh-CN\",\"frontmatter\":{\"nosearch\":true,\"description\":\"🔥 热门文章\"},\"git\":{\"createdTime\":1764398930000,\"updatedTime\":1764398930000},\"readingTime\":{\"minutes\":0.09,\"words\":28},\"filePathRelative\":\"docs/hotpages.md\",\"autoDesc\":true}")
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
