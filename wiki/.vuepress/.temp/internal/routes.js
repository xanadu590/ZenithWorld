export const redirects = JSON.parse("{}")

export const routes = Object.fromEntries([
  ["/", { loader: () => import(/* webpackChunkName: "index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/index.html.js"), meta: {"title":"巅峰世界","icon":"house"} }],
  ["/demo-0.0.1/characterline.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_characterline.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/characterline.html.js"), meta: {"title":""} }],
  ["/demo-0.0.1/", { loader: () => import(/* webpackChunkName: "demo-0.0.1_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/index.html.js"), meta: {"title":"世界观总览","icon":"laptop-code"} }],
  ["/demo-0.0.1/timeline.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_timeline.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/timeline.html.js"), meta: {"title":"世界大事年表"} }],
  ["/demo-0.0.1/character/", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/index.html.js"), meta: {"title":"角色介绍","icon":"user"} }],
  ["/demo-0.0.1/character/divineproxy/", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_divineproxy_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/divineproxy/index.html.js"), meta: {"title":""} }],
  ["/demo-0.0.1/character/CCO/", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_CCO_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/CCO/index.html.js"), meta: {"title":""} }],
  ["/demo-0.0.1/character/superhero/111.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_111.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/superhero/111.html.js"), meta: {"title":""} }],
  ["/demo-0.0.1/character/superhero/character-EtherealKnight.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_character-EtherealKnight.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/superhero/character-EtherealKnight.html.js"), meta: {"title":"灵动骑士"} }],
  ["/demo-0.0.1/character/superhero/character-HearTone.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_character-HearTone.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/superhero/character-HearTone.html.js"), meta: {"title":"天灾"} }],
  ["/demo-0.0.1/character/superhero/character-Illustra.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_character-Illustra.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/superhero/character-Illustra.html.js"), meta: {"title":""} }],
  ["/demo-0.0.1/character/superhero/character-M-A-Y.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_character-M-A-Y.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/superhero/character-M-A-Y.html.js"), meta: {"title":""} }],
  ["/demo-0.0.1/character/superhero/character-Scourge.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_character-Scourge.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/superhero/character-Scourge.html.js"), meta: {"title":"天灾"} }],
  ["/demo-0.0.1/character/superhero/character-StrikeClock.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_character-StrikeClock.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/superhero/character-StrikeClock.html.js"), meta: {"title":""} }],
  ["/demo-0.0.1/character/superhero/character-WizardHope.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_character-WizardHope.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/superhero/character-WizardHope.html.js"), meta: {"title":""} }],
  ["/demo-0.0.1/character/superhero/", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/demo-0.0.1/character/superhero/index.html.js"), meta: {"title":"超级英雄"} }],
  ["/404.html", { loader: () => import(/* webpackChunkName: "404.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/404.html.js"), meta: {"title":""} }],
]);

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updateRoutes) {
    __VUE_HMR_RUNTIME__.updateRoutes(routes)
  }
  if (__VUE_HMR_RUNTIME__.updateRedirects) {
    __VUE_HMR_RUNTIME__.updateRedirects(redirects)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ routes, redirects }) => {
    __VUE_HMR_RUNTIME__.updateRoutes(routes)
    __VUE_HMR_RUNTIME__.updateRedirects(redirects)
  })
}
