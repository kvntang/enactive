<script setup lang="ts">
import { ref } from "vue";
import { fetchy } from "../../utils/fetchy";

interface ImageDoc {
  author: string;
  parent: string; // Parent ImageDoc ID
  coordinate: string; // stored as x, y
  prompt: string;
  type: string;
  step: string;
  originalImage: string;
  steppedImage: string;
  promptedImage: string;
  _id: string;
}

// Form input fields
const photo = ref<File | null>(null);
const emit = defineEmits(["refreshImages"]);

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const createImageDoc = async (): Promise<ImageDoc | null> => {
  try {
    let base64Photo = null;

    // Convert the photo to base64 if it exists
    if (photo.value) {
      try {
        base64Photo = await fileToBase64(photo.value);
      } catch (error) {
        console.error("Error converting image to base64:", error);
      }
    }

    //Create Initial ImageDoc
    const response = await fetchy("/api/images", "POST", {
      body: {
        author: "mocked-author-id", // Mocked user
        parent: "", // Parent ID is empty for the root node
        coordinate: "50,50",
        type: "denosie",
        step: "0",
        prompt: "0",
        originalImage: base64Photo, //save photo string here!
        steppedImage: "",
        promptedImage: "",
      },
    });
    console.log(`Initial ImageDoc created successfully!`);
    emit("refreshImages"); // Let the parent know to refresh the images

    // Reset the form
    emptyForm();

    return response as ImageDoc; // Return the created ImageDoc
  } catch (error) {
    console.error("Error creating ImageDoc:", error);
    return null;
  }
};

// Function to reset the form fields
const emptyForm = () => {
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
  <form @submit.prevent="createImageDoc">
    <!-- Input for the image -->
    <input id="photo" type="file" accept="image/*" @change="handleFileChange" />

    <!-- Submit button is disabled if no photo is selected -->
    <button type="submit" class="pure-button-primary pure-button" :disabled="!photo">Upload</button>
  </form>
</template>

<style scoped>
form {
  background-color: #3fa14c68;
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

button:disabled {
  background-color: #000000; /* Gray background */
  cursor: not-allowed; /* Indicate it's not clickable */
  opacity: 0.2; /* Slightly transparent */
}
</style>
