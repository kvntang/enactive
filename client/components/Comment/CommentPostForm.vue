<script setup lang="ts">
import { ref } from "vue";
import { fetchy } from "../../utils/fetchy";

// Props
const props = defineProps({
  postId: {
    type: String,
    required: true,
  },
});
const comment = ref("");
const emit = defineEmits(["refreshComments"]);
const showForm = ref(false); // State to toggle form visibility

// Function to toggle the form visibility
const toggleForm = () => {
  showForm.value = !showForm.value;
};

// Function to create a comment
const createComment = async () => {
  if (!comment.value) {
    console.error("Comment is empty.");
    return;
  }

  try {
    await fetchy("/api/comments", "POST", {
      body: {
        postId: props.postId,
        content: comment.value,
      },
    });

    // Emit an event to trigger comment refresh after successful submission
    emit("refreshComments");

    // Reset the form
    emptyForm();
  } catch (error) {
    console.error("Error creating comment:", error);
  }
};

// Function to reset the form fields
const emptyForm = () => {
  comment.value = "";
};
</script>

<template>
  <button @click="toggleForm" class="toggle-button">
    {{ showForm ? "Hide Comment Form" : "Add Comment" }}
  </button>

  <!-- Comment form visibility controlled by showForm -->
  <transition name="fade">
    <form v-if="showForm" @submit.prevent="createComment">
      <label for="comment">Write a comment:</label>
      <textarea id="comment" v-model="comment" placeholder="Add your comment" required></textarea>

      <button type="submit" class="pure-button-primary pure-button">Comment</button>
    </form>
  </transition>
</template>

<style scoped>
form {
  background-color: #eeeeee;
  border-radius: 0.5em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 0.5em;
  width: 80%;
  max-width: 30em;
  margin: 1em auto;
}

textarea {
  font-family: inherit;
  font-size: inherit;
  height: 4em;
  padding: 0.3em;
  border-radius: 4px;
  resize: none;
}

.toggle-button {
  margin-bottom: 1em;
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5em 1em;
  border-radius: 5px;
  cursor: pointer;
}

.toggle-button:hover {
  background-color: #0056b3;
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.5s ease,
    max-height 0.5s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}
</style>
