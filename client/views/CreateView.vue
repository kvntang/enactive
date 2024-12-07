<script setup lang="ts">
import CreatePostForm from "../components/Post/CreatePostForm.vue";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";

const { isLoggedIn } = storeToRefs(useUserStore());
</script>

<template>
  <main>
    <h1>Create a post:</h1>
    <section v-if="isLoggedIn">
      <h2>Create a post:</h2>
      <CreatePostForm />
    </section>
  </main>
</template>

<style scoped>
h1 {
  text-align: center;
}
</style>
