<script setup lang="ts">
import { useToastStore } from "@/stores/toast";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { computed, onBeforeMount, ref } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";

const currentRoute = useRoute();
const currentRouteName = computed(() => currentRoute.name);
const userStore = useUserStore();
const { currentUsername, isLoggedIn } = storeToRefs(userStore);
const { toast } = storeToRefs(useToastStore());

// Make sure to update the session before mounting the app in case the user is already logged in
onBeforeMount(async () => {
  try {
    await userStore.updateSession();
  } catch {
    // User is not logged in
  }
});

// Canvas state for toggling
const is1DCanvas = ref(true);

function toggleCanvas() {
  is1DCanvas.value = !is1DCanvas.value;
}
</script>

<template>
  <header>
    <nav>
      <div class="title">
        <img src="@/assets/images/logo.svg" />
        <RouterLink :to="{ name: 'Home' }">
          <h1>Entropy Compass</h1>
        </RouterLink>
      </div>
      <ul>
        <li>
          <h1 v-if="isLoggedIn">Welcome {{ currentUsername }}!</h1>
          <h1 v-else>Please login!</h1>
        </li>
        <li>
          <RouterLink :to="{ name: 'Home' }" :class="{ underline: currentRouteName == 'Home' }"> Home </RouterLink>
        </li>
        <li v-if="isLoggedIn">
          <RouterLink :to="{ name: 'Settings' }" :class="{ underline: currentRouteName == 'Settings' }"> Settings </RouterLink>
        </li>
        <li v-else>
          <RouterLink :to="{ name: 'Login' }" :class="{ underline: currentRouteName == 'Login' }"> Login </RouterLink>
        </li>
        <li v-if="isLoggedIn && currentRouteName === 'Home'">
          <button @click="toggleCanvas">
            {{ is1DCanvas ? "Switch to 2D Canvas" : "Switch to 1D Canvas" }}
          </button>
        </li>
      </ul>
    </nav>
    <article v-if="toast !== null" class="toast" :class="toast.style">
      <p>{{ toast.message }}</p>
    </article>
  </header>
  <!-- prop being passed into the child -->
  <RouterView :is1DCanvas="is1DCanvas" />
</template>

<style scoped>
@import "./assets/toast.css";

body {
  font-family: "Arial", sans-serif;
  margin: 0;
  padding: 0;
  background-color: #000000;
  color: white;
}

nav {
  position: fixed; /* Makes the navbar fixed */
  top: 0; /* Ensures it stays at the very top */
  left: 0;
  width: 100%; /* Spans the full width of the page */
  z-index: 1000; /* Ensures it stays above other elements */
  padding: 1em 2em; /* Adds vertical and horizontal padding */
  background-color: rgba(26, 26, 26, 0);
  display: flex;
  align-items: center;
  justify-content: space-between; /* Ensures proper spacing between title and nav links */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0); /* Optional: Add a shadow for better visibility */
  box-sizing: border-box; /* Ensures padding doesn't affect width calculations */
}

h1 {
  font-family: "Arial", sans-serif;
  font-size: 1em;
  margin: 0;
  color: white;
}

.title {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

img {
  height: 2em;
}

a {
  font-size: large;
  color: white;
  text-decoration: none;
}

ul {
  list-style-type: none;
  margin-left: auto;
  display: flex;
  align-items: center;
  flex-direction: row;
  gap: 1em;
}

.underline {
  text-decoration: underline;
}
</style>
