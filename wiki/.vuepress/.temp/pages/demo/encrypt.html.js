import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo/encrypt.html.vue"
const data = JSON.parse("{\"path\":\"/demo/encrypt.html\",\"title\":\"密码加密的文章\",\"lang\":\"zh-CN\",\"frontmatter\":{\"icon\":\"lock\",\"category\":[\"使用指南\"],\"tag\":[\"加密\"],\"feed\":false,\"seo\":false,\"head\":[[\"link\",{\"rel\":\"alternate\",\"hreflang\":\"en-us\",\"href\":\"https://zenithworld.com/en/demo/encrypt.html\"}]]},\"git\":{},\"readingTime\":{\"minutes\":0.51,\"words\":154},\"filePathRelative\":\"demo/encrypt.md\"}")
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
