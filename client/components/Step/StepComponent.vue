<script setup lang="ts">
import { ref } from "vue";
import { useUserStore } from "@/stores/user";

// Create a ref for the step size, initialized to a default value (e.g., 5)
const stepSize = ref(5);

const { updateUserStep, updateSession } = useUserStore();

async function updateStep() {
  // Convert stepSize to a string before passing it to the store function
  await updateUserStep(String(stepSize.value));
  await updateSession();
}
</script>

<template>
  <div class="slider-container">
    <!-- Trigger updateStep on slider change -->
    <input id="step-slider" type="range" min="1" max="10" v-model="stepSize" @input="updateStep" />
  </div>
</template>

<style scoped>
h2 {
  color: #eeeeee;
}

.slider-container {
  border-radius: 1em;
  padding: 0em;
  width: 90%;
  max-width: 100em;
  margin: 1em auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
}

input[type="range"] {
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  height: 12px;
  background: linear-gradient(90deg, #cae2ec, #4b627a);
  border-radius: 5px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

/* For WebKit browsers (Chrome, Safari) */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 50px; /* Adjust width */
  height: 50px; /* Adjust height */
  background: #ffffff; /* Change to your desired color */
  border-radius: 50%;
  box-shadow: 10 10 5px rgba(0, 0, 0, 1);
  cursor: pointer;
}

/* For Firefox */
input[type="range"]::-moz-range-thumb {
  width: 24px; /* Adjust width */
  height: 24px; /* Adjust height */
  background: #ffffff; /* Change to your desired color */
  border-radius: 50%;
  box-shadow: 10 10 5px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

input[type="range"]:hover {
  opacity: 1;
}

@media (max-width: 600px) {
  .slider-container {
    width: 95%;
  }

  input[type="range"]::-webkit-slider-thumb,
  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
  }
}
</style>
