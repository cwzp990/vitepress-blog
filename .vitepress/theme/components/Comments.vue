<template>
  <div id="gitalk-container"></div>
</template>
<script lang="ts" setup>
import "gitalk/dist/gitalk.css";
import Gitalk from "gitalk";
import { onMounted } from "vue";
// import { useData } from "vitepress";
// const relativePath = useData().page.value.relativePath;

const gitalk = new Gitalk({
  clientID: "3ff6646f35dfa943d5f2",
  clientSecret: "fb53080bea8f946710da14fb2cf3186128af689c",
  repo: "blog-comments",
  owner: "Juzi",
  admin: ["Juzi"],
  id: location.pathname.substring(0, 50), // Ensure uniqueness and length less than 50
  language: "zh-CN",
  distractionFreeMode: true, // Facebook-like distraction free mode
});

onMounted(() => {
  gitalk.render("gitalk-container");
});
</script>
<style scoped></style>
