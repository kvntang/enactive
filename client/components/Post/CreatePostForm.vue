<script setup lang="ts">
import { ref } from "vue";
import { fetchy } from "../../utils/fetchy";

// Form input fields
const content = ref("");
const photo = ref<File | null>(null);
const emit = defineEmits(["refreshPosts"]);

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Function to create a post with content and an optional image
const createPost = async () => {
  // Ensure content exists
  if (!content.value) {
    console.error("Content is empty.");
    return;
  }

  let base64Photo = null;

  // Convert the photo to base64 if it exists
  if (photo.value) {
    try {
      base64Photo = await fileToBase64(photo.value);
    } catch (error) {
      console.error("Error converting image to base64:", error);
      return;
    }
  }

  // Send post data including the base64 image (if any)
  try {
    await fetchy("/api/posts", "POST", {
      body: { content: content.value, photo: base64Photo }, // Add photo to the post data
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return;
  }

  // Emit event to refresh posts after submission
  emit("refreshPosts");

  // Reset the form
  emptyForm();
};

// Function to reset the form fields
const emptyForm = () => {
  content.value = "";
  photo.value = null;
};

// Function to handle file change safely
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target && target.files && target.files.length > 0) {
    photo.value = target.files[0]; // Assign the new file
  } else {
    photo.value = null; // Reset if no file is selected
  }
};
</script>

<template>
  <form @submit.prevent="createPost">
    <label for="content">Post Contents:</label>
    <textarea id="content" v-model="content" placeholder="Create a post!" required></textarea>

    <label for="photo">Upload Image:</label>
    <input id="photo" type="file" accept="image/*" @change="handleFileChange" />

    <button type="submit" class="pure-button-primary pure-button">Create Post</button>
  </form>
</template>

<style scoped>
form {
  /* background-color: var(--base-bg);
  border-radius: 1em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em; */
  background-color: #eeeeee;
  border-radius: 1em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em;
  width: 90%; /* Set a responsive width */
  max-width: 40em; /* Ensure it doesn’t grow too large on wide screens */
  margin: 1em auto; /* Center the article and add spacing between articles */
}

textarea {
  font-family: inherit;
  font-size: inherit;
  height: 6em;
  padding: 0.5em;
  border-radius: 4px;
  resize: none;
}
</style>
