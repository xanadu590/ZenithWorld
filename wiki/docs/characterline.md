---
title: 人物关系图谱
---


## 人物关系图谱

<ClientOnly>
  <RelationGraph
    :height="420"
    :nodes="[ 
      { id: 'ek', label: '灵动骑士', url: '/docs/world/characters/superhero/character-EtherealKnight.html', image: '/images/EtherealKnightCombatSuit.jpg' },
      { id: 'sx', label: '舒雪' },
      { id: 'hn', label: '韩桉宁' }
    ]"
    :edges="[
      { from: 'ek', to: 'sx', type: 'friend' },
      { from: 'ek', to: 'hn', type: 'ally' }
    ]"
  />
</ClientOnly>