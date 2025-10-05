import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/guide/bar/baz.html.vue"
const data = JSON.parse("{\"path\":\"/guide/bar/baz.html\",\"title\":\"Baz\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"Baz\",\"icon\":\"circle-info\",\"description\":\"功能详情...\",\"head\":[[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"Baz\\\",\\\"image\\\":[\\\"\\\"],\\\"dateModified\\\":null,\\\"author\\\":[{\\\"@type\\\":\\\"Person\\\",\\\"name\\\":\\\"xanadu590\\\"}]}\"],[\"meta\",{\"property\":\"og:url\",\"content\":\"https://zenithworld.com/guide/bar/baz.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"巅峰世界\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"Baz\"}],[\"meta\",{\"property\":\"og:description\",\"content\":\"功能详情...\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}],[\"meta\",{\"property\":\"og:locale:alternate\",\"content\":\"en-US\"}],[\"link\",{\"rel\":\"alternate\",\"hreflang\":\"en-us\",\"href\":\"https://zenithworld.com/en/guide/bar/baz.html\"}]]},\"git\":{},\"readingTime\":{\"minutes\":0.03,\"words\":10},\"filePathRelative\":\"guide/bar/baz.md\",\"autoDesc\":true}")
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
