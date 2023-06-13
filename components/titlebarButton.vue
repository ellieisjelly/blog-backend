<script setup>
defineProps(["content", "href", "active"]);
</script>
<style scoped>
mymom:active {
  color: white;
}
.active {
  background-color: rgba(156, 163, 175, 0.2);
}
.mymom:hover {
  background-color: rgba(255, 255, 255, 0.5);
}
.mymom {
  text-decoration: none;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  color: white;
  border-radius: 12px;
  margin-left: 0.75rem;
  margin-right: 0.75rem;
}
</style>
<template>
  <a
    :class="`mymom ${active === 'true' ? 'active' : ''}`"
    :href="href"
    @click="active"
    >{{ content }}</a
  >
</template>
