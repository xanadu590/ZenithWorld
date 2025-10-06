<template>
  <section class="relation-section">
    <h2 class="relation-title">人物关系</h2>
    <div class="relation-container">
      <div v-for="(item, i) in relations" :key="i" class="relation-card">
        <img :src="item.img" :alt="item.name" class="relation-avatar" />
        <div class="relation-name">{{ item.name }}</div>
        <div class="relation-role">{{ item.role }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const relations = [
  { name: "Alter Ego", role: "哥哥", img: "/images/relation/alter.png" },
  { name: "日向创", role: "好友", img: "/images/relation/hinata.png" },
  { name: "雪染千纱", role: "老师", img: "/images/relation/yukizome.png" },
  { name: "黄樱公一", role: "老师", img: "/images/relation/oyama.png" },
]
</script>

<style scoped>
.relation-section {
  margin-top: 2rem;
}

.relation-title {
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 0.6rem;
}

.relation-container {
  display: flex;
  overflow-x: auto;
  gap: 1.2rem;
  padding-bottom: 0.5rem;
  scroll-behavior: smooth;
}

.relation-container::-webkit-scrollbar {
  height: 6px;
}
.relation-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.relation-card {
  flex: 0 0 auto;
  width: 90px;
  text-align: center;
}

.relation-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 0.3rem;
  border: 1px solid #ddd;
}

.relation-name {
  font-weight: bold;
  font-size: 14px;
}

.relation-role {
  color: #777;
  font-size: 12px;
}
</style>
