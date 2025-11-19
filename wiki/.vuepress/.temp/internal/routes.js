export const redirects = JSON.parse("{}")

export const routes = Object.fromEntries([
  ["/", { loader: () => import(/* webpackChunkName: "index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/index.html.js"), meta: {"title":"巅峰世界","icon":"house"} }],
  ["/docs/characterline.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_characterline.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/characterline.html.js"), meta: {"title":""} }],
  ["/docs/", { loader: () => import(/* webpackChunkName: "demo-0.0.1_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/index.html.js"), meta: {"title":"世界观总览","icon":"laptop-code"} }],
  ["/docs/timeline.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_timeline.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/timeline.html.js"), meta: {"title":"世界大事年表"} }],
  ["/docs/world/characters/", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/index.html.js"), meta: {"title":"角色介绍","icon":"user"} }],
  ["/docs/world/characters/CCO/", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_CCO_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/CCO/index.html.js"), meta: {"title":""} }],
  ["/docs/world/characters/divineproxy/", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_divineproxy_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/divineproxy/index.html.js"), meta: {"title":""} }],
  ["/docs/world/characters/superhero/1.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_1.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/1.html.js"), meta: {"title":""} }],
  ["/docs/world/characters/superhero/111.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_111.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/111.html.js"), meta: {"title":""} }],
  ["/docs/world/characters/superhero/2.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_2.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/2.html.js"), meta: {"title":"[2][WizardHope]"} }],
  ["/docs/world/characters/superhero/3.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_3.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/3.html.js"), meta: {"title":"[3][WizardHope]"} }],
  ["/docs/world/characters/superhero/4.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_4.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/4.html.js"), meta: {"title":"[4][WizardHope]"} }],
  ["/docs/world/characters/superhero/5.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_5.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/5.html.js"), meta: {"title":"[5][WizardHope]"} }],
  ["/docs/world/characters/superhero/6.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_6.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/6.html.js"), meta: {"title":"[6][WizardHope]"} }],
  ["/docs/world/characters/superhero/7.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_7.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/7.html.js"), meta: {"title":"[7][WizardHope]"} }],
  ["/docs/world/characters/superhero/8.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_8.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/8.html.js"), meta: {"title":"[8][WizardHope]"} }],
  ["/docs/world/characters/superhero/character-EtherealKnight.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_character-EtherealKnight.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/character-EtherealKnight.html.js"), meta: {"title":"灵动骑士"} }],
  ["/docs/world/characters/superhero/character-HearTone.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_character-HearTone.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/character-HearTone.html.js"), meta: {"title":"赤听"} }],
  ["/docs/world/characters/superhero/character-Illustra.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_character-Illustra.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/character-Illustra.html.js"), meta: {"title":"幻绘星"} }],
  ["/docs/world/characters/superhero/character-M-A-Y.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_character-M-A-Y.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/character-M-A-Y.html.js"), meta: {"title":"月五"} }],
  ["/docs/world/characters/superhero/character-Scourge.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_character-Scourge.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/character-Scourge.html.js"), meta: {"title":"天灾"} }],
  ["/docs/world/characters/superhero/character-StrikeClock.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_character-StrikeClock.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/character-StrikeClock.html.js"), meta: {"title":"警钟"} }],
  ["/docs/world/characters/superhero/character-WizardHope.html", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_character-WizardHope.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/character-WizardHope.html.js"), meta: {"title":"巫师希望"} }],
  ["/docs/world/characters/superhero/", { loader: () => import(/* webpackChunkName: "demo-0.0.1_character_superhero_index.html" */"C:/Users/super/ZenithWorld/wiki/.vuepress/.temp/pages/docs/world/characters/superhero/index.html.js"), meta: {"title":"超级英雄"} }],
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
