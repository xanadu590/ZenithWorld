<!-- wiki/.vuepress/layouts/Layout.vue -->
<script setup lang="ts">
import { Layout } from "vuepress-theme-hope/client"
import LeadBlock from "../components/LeadBlock.vue"
</script>

<template>
  <Layout>
    <template #default>
      <!-- ✅ 自动在页面开头显示简介 -->
      <!-- @vue-ignore  ↓ 忽略 Volar 对 $frontmatter 的类型提示 -->
      <LeadBlock v-if="$frontmatter.summary" :summary="$frontmatter.summary" />

      <!-- ✅ 正文 -->
      <Content />
    </template>
  </Layout>
</template>