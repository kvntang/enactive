<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { fetchy } from "../../utils/fetchy";

const emit = defineEmits(["deleteAll"]);

const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const { currentUserID } = storeToRefs(useUserStore());

const deleteAllImages = async () => {
  if (!currentUserID.value) {
    errorMessage.value = "User is not logged in.";
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    await fetchy(`/api/images/author/${currentUserID.value}`, "DELETE");
    // successMessage.value = "All iamges deleted.";
    emit("deleteAll");
  } catch (error) {
    console.error("Error deleting images:", error);
    errorMessage.value = "Failed to delete images. Please try again.";
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <button @click="deleteAllImages" :disabled="isLoading" class="delete-button" :class="{ 'button-loading': isLoading }">
    <svg
      v-if="!isLoading"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      class="trash-icon"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
    <svg
      v-else
      class="spinner"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="path"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
        stroke-linecap="round"
      ></circle>
    </svg>
  </button>
</template>

<style scoped>
.delete-button {
  background-color: transparent;
  border: 1.5px solid #b91c1c;
  color: #b91c1c;
  padding: 0.75rem;
  border-radius: 50%;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-button:hover:not(:disabled) {
  background-color: #b91c1c;
  color: white;
  transform: translateY(-1px);
}

.delete-button:disabled {
  background-color: #ffffff;
  cursor: not-allowed;
  opacity: 0.7;
}

.trash-icon {
  width: 24px;
  height: 24px;
}

.spinner {
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

.path {
  stroke: currentColor;
}

.button-loading {
  opacity: 0.8;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>