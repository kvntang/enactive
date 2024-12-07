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
    successMessage.value = "All images have been successfully deleted.";
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
  <div class="delete-button-container">
    <button @click="deleteAllImages" :disabled="isLoading" class="delete-button" :class="{ 'button-loading': isLoading }">
      <span class="button-text">{{ isLoading ? "Deleting..." : "Delete All Images" }}</span>
    </button>

    <div class="message-container">
      <p v-if="errorMessage" class="error-message" role="alert">
        {{ errorMessage }}
      </p>
      <p v-if="successMessage" class="success-message" role="alert">
        {{ successMessage }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.delete-button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
  height: 50px;
}

.delete-button {
  background-color: #dc2626;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  min-width: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-button:hover:not(:disabled) {
  background-color: #b91c1c;
  transform: translateY(-1px);
}

.delete-button:disabled {
  background-color: #6b7280;
  cursor: not-allowed;
  opacity: 0.7;
}

.button-loading {
  position: relative;
  opacity: 0.8;
}

.message-container {
  min-height: 24px;
  text-align: center;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  margin: 0;
  animation: fadeIn 0.3s ease-in-out;
}

.success-message {
  color: #10b981;
  font-size: 0.875rem;
  margin: 0;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
