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
          <!-- <h1>Entropy Compass</h1> -->
        </RouterLink>
      </div>
      <ul>
        <li>
          <h1 v-if="isLoggedIn">Welcome {{ currentUsername }}!</h1>
          <h1 v-else>Please login!</h1>
        </li>
        <li>
          <RouterLink :to="{ name: 'Home' }" :class="{ underline: currentRouteName == 'Home' }">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="currentColor">
              <!-- <path d="M12 3l8 8h-3v8h-10v-8H4l8-8z"/> -->
              <path d="M12 2.1L1 12h3v9h7v-6h2v6h7v-9h3L12 2.1zm0 2.691l6 5.4V19h-3v-6H9v6H6v-8.809l6-5.4z" />
            </svg>
          </RouterLink>
        </li>
        <!-- <li v-if="isLoggedIn">
          <RouterLink :to="{ name: 'Archive' }" :class="{ underline: currentRouteName == 'Archive' }">Archive</RouterLink>
        </li> -->
        <li v-if="isLoggedIn">
          <RouterLink :to="{ name: 'Archive' }" :class="{ underline: currentRouteName == 'Archive' }">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/>
            </svg>
          </RouterLink>
        </li>
        <li v-if="isLoggedIn">
          <RouterLink :to="{ name: 'Settings' }" :class="{ underline: currentRouteName == 'Settings' }">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" />
              <path
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.09a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.09a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
              />
            </svg>
          </RouterLink>
        </li>
        <li v-else>
          <RouterLink :to="{ name: 'Login' }" :class="{ underline: currentRouteName == 'Login' }">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM4 20v-2c0-3.31 2.69-6 6-6h4c3.31 0 6 2.69 6 6v2" />
            </svg>
          </RouterLink>
        </li>
        <li v-if="isLoggedIn && currentRouteName === 'Home'">
          <label class="switch">
            <input type="checkbox" v-model="is1DCanvas" />
            <span class="slider"></span>
          </label>
        </li>
      </ul>
    </nav>
    <article v-if="toast !== null" class="toast" :class="toast.style">
      <p>{{ toast.message }}</p>
    </article>
  </header>
  <!-- Prop being passed into the child -->
  <RouterView :is1DCanvas="is1DCanvas" />
</template>

<style scoped>
@import "./assets/toast.css";

body {
  font-family: "Courier New", Courier, monospace;
  margin: 0;
  padding: 0;
  background-color: white;
  color: rgb(0, 0, 0);
}

nav {
  position: fixed; /* Makes the navbar fixed */
  top: 0; /* Ensures it stays at the very top */
  left: 0;
  width: 100%; /* Spans the full width of the page */
  z-index: 1000; /* Ensures it stays above other elements */
  padding: 1em 2em; /* Adds vertical and horizontal padding */
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between; /* Ensures proper spacing between title and nav links */
  box-sizing: border-box; /* Ensures padding doesn't affect width calculations */
}

h1 {
  /* font-family: "roboto", sans-serif; */
  font-family: "Courier New", Courier, monospace;
  font-size: 1em;
  margin: 0;
  color: rgb(0, 0, 0);
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
  color: rgb(0, 0, 0);
  text-decoration: none;
  display: flex;
  align-items: center;
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

/* Toggle Switch Styles */
.switch {
  position: relative;
  display: inline-block;
  width: 80px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #8cff00;
  transition: 0.4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "2D";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 500;
}

input:checked + .slider {
  background-color: rgb(52, 29, 185);
}

input:checked + .slider:before {
  transform: translateX(46px);
  content: "1D";
}

/* Icon Styles */
.icon {
  /* fill: rgb(52, 29, 185);   */
  /* stroke: rgb(52, 29, 185); */
  width: 20px;
  height: 20px;
  margin-right: 0.5em;
  vertical-align: middle;
}
</style>