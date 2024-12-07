<script setup lang="ts">
import { ref, computed, onBeforeMount } from "vue";
import CarouselComponent from "@/components/Post/CarouselComponent.vue";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { fetchy } from "@/utils/fetchy";

// Using the Pinia store for user data
const userStore = useUserStore();
const { isLoggedIn, currentUserStep } = storeToRefs(userStore); // currentUserStep is reactive
const loaded = ref(false);

let posts = ref<Array<Record<string, string>>>([]);
let editing = ref("");
let searchAuthor = ref("");

// Computed property to map currentUserStep (1-10) to offsetValue (1-400)
// Ensuring that currentUserStep is converted to a number before performing any calculations
const offsetValue = computed(() => {
  const stepSize = Number(currentUserStep.value); // Convert currentUserStep to a number
  return (stepSize / 10) * 400; // Map 1-10 to 1-400
});

async function getPosts(author?: string) {
  let query: Record<string, string> = author !== undefined ? { author } : {};
  let postResults;
  try {
    postResults = await fetchy("/api/posts", "GET", { query });
  } catch (_) {
    return;
  }
  searchAuthor.value = author ? author : "";
  posts.value = postResults;
}

function updateEditing(id: string) {
  editing.value = id;
}

onBeforeMount(async () => {
  await getPosts();
  loaded.value = true;
});
</script>

<template>
  <div class="row"></div>

  <!-- Load a carousel for each post, first card is the post, rest are placeholders -->
  <section class="posts" v-if="loaded && posts.length !== 0">
    <div v-for="post in posts" :key="post._id" class="carousel-wrapper">
      <!-- Pass the computed offsetValue to control the scaling and translation -->
      <CarouselComponent :post="post" :totalItems="5" :offset="offsetValue" @refreshPosts="getPosts" @editPost="updateEditing" />
    </div>
  </section>

  <p v-else-if="loaded">No posts found</p>
  <p v-else>Loading...</p>
</template>

<style scoped>
section {
  display: block; /* Allow section to handle stacking */
}

.carousel-wrapper {
  position: relative;
  margin-bottom: 2em; /* Space between each carousel */
  width: 100%;
  height: 800px;
}

section,
p,
.row {
  margin: 0 auto;
  max-width: 60em;
}

.posts {
  padding: 1em;
  width: 100%;
}

.row {
  display: flex;
  justify-content: space-between;
  margin: 0 auto;
  max-width: 60em;
}
</style>
