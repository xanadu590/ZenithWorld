import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/index.html.vue"
const data = JSON.parse("{\"path\":\"/demo-0.0.1/character/\",\"title\":\"角色介绍\",\"lang\":\"zh-CN\",\"frontmatter\":{\"home\":true,\"icon\":\"user\",\"title\":\"角色介绍\",\"bgImageStyle\":{\"background-attachment\":\"fixed\"},\"heroText\":\"角色介绍\",\"tagline\":\"这个世界属于少数精英，他们是舞台的主角。\",\"actions\":[{\"text\":\"超级英雄\",\"icon\":\"star\",\"link\":\"./superhero/\",\"type\":\"primary\"}],\"head\":[[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"WebPage\\\",\\\"name\\\":\\\"角色介绍\\\"}\"],[\"meta\",{\"property\":\"og:url\",\"content\":\"https://zenithworld.com/demo-0.0.1/character/\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"巅峰世界\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"角色介绍\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"website\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}]]},\"git\":{},\"readingTime\":{\"minutes\":0.16,\"words\":49},\"filePathRelative\":\"demo-0.0.1/character/README.md\"}")
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
