<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { onMounted, ref } from "vue";
import { fetchy } from "../utils/fetchy.js";

const { currentUserID } = storeToRefs(useUserStore());
const error = ref<string | null>(null); // Explicitly define the type as string or null

const images = ref([]);

async function fetchArchive() {
  console.log(`current user id: ${currentUserID.value}`);
  if (!currentUserID.value) {
    error.value = "User ID is not available.";
    console.error("User ID is not available.");
    return; // Exit the function if user ID is not defined
  }

  try {
    const result = await fetchy(`/api/archive/${currentUserID.value}`, "GET");
    console.log("Fetched images:", result);
    images.value = result._id;
  } catch (err) {
    error.value = "Failed to load images. Please try again later.";
    console.error("Error fetching images:", err);
  }
}

// Fetch images on component mount
onMounted(() => {
  fetchArchive().catch((err) => {
    console.error("Error during onMounted fetch:", err);
  });
});
</script>

<template>
  <main class="main-container">
    <h1>My Archive</h1>
    {{ images }}
  </main>
</template>

<style scoped>
body {
  font-family: "Courier New", Courier, monospace;
  background-color: #f0f0f0;
  margin: 0;
  padding: 0;
}

.main-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  background-color: #ffffff;
  color: rgb(26, 26, 26);
  padding: 20px;
}

h1 {
  font-family: "Courier New", Courier, monospace;
  text-align: center;
  margin: 20px 0;
}

.forms-section {
  font-family: "Courier New", Courier, monospace;
  width: 100%;
  max-width: 900px;
  display: flex;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
  box-sizing: border-box;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
}

@media (min-width: 768px) {
  .form-container {
    flex-direction: row;
    justify-content: center;
    gap: 40px;
  }

  .forms-section {
    display: flex;
    justify-content: center;
  }

  .form {
    flex: 1;
    max-width: 400px;
  }
}

@media (max-width: 480px) {
  .forms-section {
    padding: 10px;
  }

  h1 {
    font-size: 1.5rem;
  }
}
</style>
