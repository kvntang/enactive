<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { fetchy } from "@/utils/fetchy";
import { storeToRefs } from "pinia";
import { ref } from "vue";

// const props = defineProps<{
//   selectedImageString: string | null
// }>();

const emit = defineEmits(["saveSelected"]);

const isLoading = ref(false);
// const errorMessage = ref<string | null>(null);
// const successMessage = ref<string | null>(null);

// const { currentUserID } = storeToRefs(useUserStore());

const saveSelected = async () => {
  emit("saveSelected");
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
      class="save-icon"
      aria-hidden="true"
    >
      <!-- <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M19 3v4M5 21v-4M19 21v-4M12 5v14m0 0l-6-6m6 6l6-6" /> -->
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      
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
  background-color: transparent;
  border: 1.5px solid #4caf50;
  color: #4caf50;
  padding: 0.8rem;
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
  background-color: #4caf50;
  color: white;
  transform: translateY(-1px);
}

.save-button:disabled {
  background-color: #ffffff;
  cursor: not-allowed;
  opacity: 0.7;
}

.save-icon {
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
