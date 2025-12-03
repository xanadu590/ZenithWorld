import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/hotpages.html.vue"
const data = JSON.parse("{\"path\":\"/docs/hotpages.html\",\"title\":\"推荐文章\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"推荐文章\",\"nosearch\":true,\"head\":[[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"推荐文章\\\",\\\"image\\\":[\\\"\\\"],\\\"dateModified\\\":\\\"2025-12-01T08:37:36.000Z\\\",\\\"author\\\":[{\\\"@type\\\":\\\"Person\\\",\\\"name\\\":\\\"xanadu590\\\"}]}\"],[\"meta\",{\"property\":\"og:url\",\"content\":\"https://zenithworld.com/docs/hotpages.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"巅峰世界\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"推荐文章\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}],[\"meta\",{\"property\":\"og:updated_time\",\"content\":\"2025-12-01T08:37:36.000Z\"}],[\"meta\",{\"property\":\"article:modified_time\",\"content\":\"2025-12-01T08:37:36.000Z\"}]]},\"git\":{\"createdTime\":1764398930000,\"updatedTime\":1764578256000},\"readingTime\":{\"minutes\":0.08,\"words\":25},\"filePathRelative\":\"docs/hotpages.md\",\"excerpt\":\"\"}")
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
