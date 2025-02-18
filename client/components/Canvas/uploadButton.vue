<script setup lang="ts">
import { HfInference } from "@huggingface/inference";
import { ref } from "vue";
import { fetchy } from "../../utils/fetchy";

// Hugging Face Inference instance
const inference = new HfInference("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");

const isLoading = ref(false);

interface ImageDoc {
  author: string;
  parent: string;
  coordinate: string;
  prompt: string;
  type: string;
  step: string;
  originalImage: string;
  steppedImage: string;
  promptedImage: string;
  _id: string;
  caption: string;
  promptList: string;
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

// Direct Hugging Face caption generation
const generateCaption = async (imageBase64: string): Promise<string> => {
  try {
    const base64Data = imageBase64.split(",")[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = Array.from(byteCharacters, (char) => char.charCodeAt(0));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/jpeg" });

    const result = await inference.imageToText({
      data: blob,
      model: "nlpconnect/vit-gpt2-image-captioning",
    });

    return result.generated_text;
  } catch (error) {
    console.error("Error generating caption:", error);
    return "Failed to generate caption";
  }
};

async function getChatGPTResponse(prompt: string) {
  try {
    const result = await fetchy("/api/chatgpt", "POST", {
      body: { prompt }, // Send the prompt in the body
    });
    return result.response;
  } catch (error) {
    console.error("Error fetching ChatGPT response:", error);
    throw error;
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const createImageDoc = async (): Promise<ImageDoc | null> => {
  console.log("Starting to create ImageDoc..."); // Debug log
  isLoading.value = true; // Start loading
  console.log("Loading state set to true."); // Debug log

  try {
    let base64Photo = null;
    let caption = "";

    // 1. Get caption
    if (photo.value) {
      try {
        base64Photo = await fileToBase64(photo.value);
        caption = await generateCaption(base64Photo); // Get caption
        console.log("Image caption:", caption);
      } catch (error) {
        console.error("Error converting image or generating caption:", error);
        return null; // Exit early if there's an error with the caption
      }
    }

    // 2. Get 36 prompts in a list
    console.log("Waiting for ChatGPT response...");
    let promptList = null;

    try {
      promptList = await getChatGPTResponse(caption); // Wait for ChatGPT response
      console.log("ChatGPT Response:", promptList);
    } catch (error) {
      console.error("Failed to get ChatGPT response:", error);
      return null; // Exit early if there's an error with the ChatGPT response
    }

    // 3. Create Initial ImageDoc
    try {
      const response = await fetchy("/api/images", "POST", {
        body: {
          author: "mocked-author-id", // Mocked user
          parent: "", // Parent ID is empty for the root node
          coordinate: "50,50",
          type: "denoise",
          step: "0",
          prompt: "0",
          originalImage: base64Photo,
          steppedImage: "",
          promptedImage: "",
          caption: caption, // Include the generated caption
          promptList: promptList, // Include the ChatGPT response
        },
      });

      console.log(`Initial ImageDoc created successfully!`);
      emit("refreshImages"); // Let the parent know to refresh the images
      emptyForm(); // Reset the form
      return response as ImageDoc; // Return the created ImageDoc
    } catch (error) {
      console.error("Error creating ImageDoc:", error);
      return null;
    }
  } catch (error) {
    console.error("Error creating ImageDoc:", error);
    return null;
  } finally {
    isLoading.value = false; // Stop loading
    console.log("Loading state set to false."); // Debug log
  }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Function to reset the form fields
const emptyForm = () => {
  photo.value = null;
};

// Function to handle file change safely
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target && target.files && target.files.length > 0) {
    photo.value = target.files[0];
  } else {
    photo.value = null;
  }
};
</script>

<!-- <template>
  <form @submit.prevent="createImageDoc">
    <input id="photo" type="file" accept="image/*" @change="handleFileChange" />
    <button type="submit" class="pure-button-primary pure-button" :disabled="!photo">Upload</button>
  </form>
</template> -->

<template>
  <form @submit.prevent="createImageDoc">
    <label for="photo" class="custom-file-upload">Choose File</label>
    <input id="photo" type="file" accept="image/*" @change="handleFileChange" />

    <!-- Upload Button -->
    <button type="submit" class="pure-button-primary pure-button" :disabled="!photo || isLoading">Upload</button>

    <!-- Loading animation (optional) -->
    <div v-if="isLoading" class="loading-animation">
      <svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="path" cx="12" cy="12" r="10" stroke="blue" stroke-width="10" stroke-linecap="round"></circle>
      </svg>
    </div>
  </form>
</template>

<style scoped>
form {
  position: relative; /* Add relative positioning to the form */
  background-color: rgba(0, 0, 0, 0);
  border-radius: 1em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em;
  width: 50%;
  max-width: 40em;
  margin: 1em auto;
}

.loading-animation {
  position: absolute; /* Position absolutely within the form */
  top: 70%;
  left: 50%;
  transform: translate(-50%, -50%); /* Perfectly center the loading spinner */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10; /* Ensure it's above other elements */
}

.spinner {
  animation: spin 1s linear infinite;
  width: 24px;
  height: 24px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* change 'choose file' style */
input[type="file"] {
  display: none; /* Hide the default file input */
}

.custom-file-upload {
  background-color: #4326ec;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: inline-block;
  text-align: center;
}

.custom-file-upload:hover {
  background-color: #341db9;
}

.custom-file-upload:disabled {
  background-color: #000000;
  cursor: not-allowed;
  opacity: 0.2;
}

textarea {
  font-family: inherit;
  font-size: inherit;
  height: 6em;
  padding: 0.5em;
  border-radius: 4px;
  resize: none;
}

button {
  background-color: #8cff00;
  color: black;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

button:disabled {
  background-color: #ffffff; /* Gray background */
  cursor: not-allowed; /* Indicate it's not clickable */
  opacity: 0;
}
</style>
