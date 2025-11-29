import comp from "C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/index.html.vue"
const data = JSON.parse("{\"path\":\"/docs/world/characters/\",\"title\":\"角色介绍\",\"lang\":\"zh-CN\",\"frontmatter\":{\"home\":true,\"icon\":\"user\",\"title\":\"角色介绍\",\"bgImageStyle\":{\"background-attachment\":\"fixed\"},\"heroText\":\"角色介绍\",\"tagline\":\"这个世界属于少数精英，他们是舞台的主角。\",\"actions\":[{\"text\":\"超级英雄\",\"icon\":\"star\",\"link\":\"/docs/RoleCard.md\",\"type\":\"primary\"}]},\"git\":{\"createdTime\":1759636241000,\"updatedTime\":1763559366000},\"readingTime\":{\"minutes\":0.16,\"words\":49},\"filePathRelative\":\"docs/world/characters/README.md\"}")
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
