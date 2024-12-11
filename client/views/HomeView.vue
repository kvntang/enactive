<script setup lang="ts">
import oneDCanvasComponent from "@/components/Canvas/oneDCanvasComponent_7.vue";
import twoDCanvasComponent from "@/components/Canvas/twoDCanvasComponent_4.vue";
import uploadButton from "@/components/Canvas/uploadButton.vue";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref } from "vue";
import deleteButton from "../components/Canvas/deleteButton.vue";
import { fetchy } from "../utils/fetchy.js";

// Define props
const props = defineProps(["is1DCanvas"]);
const images = ref([]);
const loading = ref(false); // Loading state
const error = ref<string | null>(null); // Explicitly define the type as string or null
// const showUploadButton = ref(true);
const showUploadButton = computed(() => {
  return isLoggedIn.value && images.value.length === 0;
});

// Use store
const { currentUsername, currentUserID, isLoggedIn } = storeToRefs(useUserStore());

// Get ImageDocs from current user and pass as props into the canvases
async function fetchImages() {
  loading.value = true;
  error.value = null;
  try {
    const result = await fetchy(`/api/images/author/${currentUserID.value}`, "GET");
    console.log("Fetched images:", result);
    images.value = result.images || [];
    // showUploadButton.value = images.value.length === 0; // Key change here
  } catch (err) {
    error.value = "Failed to load images. Please try again later.";
    console.error("Error fetching images:", err);
  } finally {
    loading.value = false;
  }
}

// Fetch images on component mount
onMounted(() => {
  fetchImages().catch((err) => {
    console.error("Error during onMounted fetch:", err);
  });
});

function refreshImages() {
  fetchImages()
    .then(() => {
      // showUploadButton.value = images.value.length === 0;
      console.log("Images updated, showUploadButton:", showUploadButton.value);
    })
    .catch((err) => {
      console.error("Error during refreshImages:", err);
    });
}

//some sort of checker to see if database has that initial imagedoc, if it does. then show canvas.

function deleteAll() {
  refreshImages();
}

// Dynamic message based on the canvas type
// const canvasMessage = computed(() => (props.is1DCanvas ? "1D Canvas" : "2D Canvas"));
</script>

<template>
  <main>
    <!-- Fixed Floating Panel -->
    <div class="delete-panel">
      <!-- <h2 class="canvas-message">{{ canvasMessage }}</h2> -->
      <deleteButton @deleteAll="deleteAll" />
    </div>
    <!-- 
    <div class="tips-panel">
      <h2>User Tips</h2>
      <div>
        - hold "shift" and drag to navigate the canvas
        <br />
        - double click to select a box
        <br />
        - press "esc" to exist dragging mode
      </div>
    </div> -->

    <!-- <div class="upload-panel">
      <h2>Upload an image to start!</h2>
      <uploadButton @refreshImages="refreshImages" />
    </div> -->

    <!-- Show Canvas only if an image has been uploaded.  -->
    <div v-if="showUploadButton && !isLoggedIn" class="upload-panel">
      <h2>Upload an image to start!</h2>
      <uploadButton @refreshImages="refreshImages" />
    </div>

    <!-- Canvas Components
    <section v-if="isLoggedIn">
      <section v-if="loading">Loading images...</section>
      <section v-else-if="error">{{ error }}</section>
      <template v-else>
        <oneDCanvasComponent v-if="is1DCanvas" :images="images" @refreshImages="refreshImages" />
        <twoDCanvasComponent v-else :images="images" @refreshImages="refreshImages" />
      </template>
    </section>
  </main>
</template> -->
    <section v-if="isLoggedIn">
      <section v-if="loading">Loading images...</section>
      <section v-else-if="error">{{ error }}</section>
      <template v-else>
        <!-- If no images, show upload panel -->
        <div v-if="images.length === 0" class="upload-panel">
          <h2>Upload an image to start!</h2>
          <uploadButton @refreshImages="refreshImages" />
        </div>

        <oneDCanvasComponent v-if="is1DCanvas" :images="images" @refreshImages="refreshImages" />
        <twoDCanvasComponent v-else :images="images" @refreshImages="refreshImages" />
      </template>
    </section>
    <section v-else class="welcome-section">
      <div>
        Welcome travelers!
        <br /><br />
        This is an experiment on image augmentation using diffusion-based techniques.
        <br /><br />
        You’ll explore how subtle changes in entropy and noise can shape your results. Our interface makes it easy to guide prompts and navigate the latent spaces of your images.

        <br /><br />
        Ready to explore and experiment? Let’s get started!
        <br /><br />
        Kevin and Una
        <br />
        fall 2024
      </div>
    </section>
  </main>
</template>

<style scoped>
/* change global font */
/* body {
  font-family: "Arial", sans-serif;
  margin: 0;
  padding: 0;
  background-color: #000000;
  color: white;
} */

h1 {
  text-align: center;
  margin: 20px 0;
}

main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  background-color: rgba(255, 255, 255);
  color: white;
  padding: 20px;
}

section {
  width: 100%;
  max-width: 1200px;
  margin: 10px 0;
  padding: 10px;
  border-radius: 10px;
  background: #ffffff;
  /* box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3); */
}

/* Center the 1D/2D canvas text and arrange header */
.delete-panel {
  position: fixed; /* Keeps it fixed in place */
  top: 45%; /* Adjust distance from the top of the viewport */
  right: 20px; /* Adjust distance from the left of the viewport */
  display: flex;
  flex-direction: column; /* Stack elements vertically */
  align-items: flex-start; /* Align elements to the start of the container */
  padding: 10px;
  border-radius: 8px;
  z-index: 1000; /* Places it above the canvas and other elements */
  width: auto; /* Width adjusts to the widest element */
}

.tips-panel {
  position: fixed; /* Keeps it fixed in place */
  top: 300px; /* Adjust distance from the top of the viewport */
  right: 10px; /* Adjust distance from the left of the viewport */
  display: flex;
  flex-direction: column; /* Stack elements vertically */
  align-items: flex-start; /* Align elements to the start of the container */
  padding: 10px;
  background: rgba(26, 26, 26, 0.8); /* Semi-transparent background */
  border-radius: 8px;

  z-index: 1000; /* Places it above the canvas and other elements */
  width: auto; /* Width adjusts to the widest element */
}

.upload-panel {
  position: fixed; /* Keeps it fixed in place */
  top: 45%; /* Position the panel in the middle vertically */
  left: 50%; /* Position the panel in the middle horizontally */
  transform: translate(-50%, -50%); /* Center the panel exactly */
  display: flex;
  flex-direction: column; /* Stack elements vertically */
  align-items: flex-start; /* Align elements to the start of the container */
  padding: 10px;
  background: transparent;
  border-radius: 8px;
  z-index: 1000; /* Places it above the canvas and other elements */
  width: auto; /* Width adjusts to the widest element */
}

.canvas-message {
  margin: 0 0 10px 0; /* Add spacing between stacked elements */
}

body {
  font-family: "Arial", sans-serif;
  font-size: large;
  margin: 0;
  padding: 0;
  background-color: #000000;
  color: white;
}

.welcome-section {
  display: flex; /* Use flexbox for centering */
  justify-content: center; /* Center horizontally */
  position: absolute; /* Positioning to control vertical placement */
  top: 40%; /* 40% from the top of the viewport */
  left: 50%; /* Center horizontally */
  transform: translate(-50%, -50%); /* Adjust to center the element */
  font-size: medium; /* Set the font size here */
  font-family: "Courier New", Courier, monospace;
  color: rgb(52, 29, 185);
  max-width: 600px; /* Restrict the maximum width */
  width: 100%; /* Allow it to be responsive */
  padding: 0 20px; /* Optional: Add some padding for smaller screens */
  text-align: center; /* Center text within the div */
}
</style>
