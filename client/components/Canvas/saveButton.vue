<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { fetchy } from "../../utils/fetchy";

const emit = defineEmits(["saveSelected"]);

const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const { currentUserID } = storeToRefs(useUserStore());

const saveSelected = async () => {
  emit("saveSelected");
//   if (!currentUserID.value) {
//     errorMessage.value = "User is not logged in.";
//     return;
//   }

//   isLoading.value = true;
//   errorMessage.value = null;
//   successMessage.value = null;

//   try {
//     await fetchy(`/api/images/author/${currentUserID.value}`, "DELETE");
//     // successMessage.value = "All iamges deleted.";
//     emit("deleteAll");
//   } catch (error) {
//     console.error("Error deleting images:", error);
//     errorMessage.value = "Failed to delete images. Please try again.";
//   } finally {
//     isLoading.value = false;
//   }
};
</script>

<template>
  <button @click="saveSelected" :disabled="isLoading" class="save-button" :class="{ 'button-loading': isLoading }">
    <svg
      v-if="!isLoading"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      class="disk-icon"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 2v16a2 2 0 002 2h8a2 2 0 002-2V6l-6-4H8a2 2 0 00-2 2z" />
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
.save-button {
  background-color: #4caf50;
  border: none;
  color: white;
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

.save-button:hover:not(:disabled) {
  background-color: #45a049;
}

.save-button:disabled {
  background-color: #e0e0e0;
  cursor: not-allowed;
  opacity: 0.7;
}

.disk-icon {
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