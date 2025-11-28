<template><div><MapJump
  src="/images/worldmap.jpg"
  ratio="16/9"
  :regions="[
    { id: 1, title: '中域群体', to: '/docs/world/characters/superhero/character-EtherealKnight.html', x: 32, y: 41, w: 12, h: 10 },
    { id: 2, title: '北境共和国', to: '/factions/north.html',  x: 48, y: 18, w: 14, h: 11 },
    { id: 3, title: '官方站点',   to: 'https://example.com',   x: 72, y: 68, w: 12, h: 10 }
  ]"
  :showLabel="true"
/>
</div></template>


