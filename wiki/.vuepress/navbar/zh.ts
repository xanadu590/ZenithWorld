import { navbar } from "vuepress-theme-hope";

export const zhNavbar = navbar([
  "/",

  {
    text: '推荐文章',
    icon: 'fire',
    link: '/docs/hotpages.html',
  },

  {
    text: '高级搜索',
    icon: 'search',
    link: '/docs/advanced-search.html',
  },

]);
