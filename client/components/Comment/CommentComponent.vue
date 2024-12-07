<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { fetchy } from "@/utils/fetchy";

// Define props to accept the comment object from the parent component
const props = defineProps(["comment"]);
const { currentUsername } = storeToRefs(useUserStore());

// Emit events to the parent component
const emit = defineEmits(["refreshComments"]);

// Function to delete the comment
const deleteComment = async () => {
  try {
    await fetchy(`/api/comments/${props.comment._id}`, "DELETE");
    console.log(`deleting ${props.comment._id}`);
    // Emit refresh event to reload comments (assuming the parent listens for it)
    emit("refreshComments");
  } catch (error) {
    console.error("Error deleting comment:", error);
  }
};
</script>

<template>
  <div class="comment-container">
    <!-- Display the comment content, author, and delete button in the same row -->
    <div class="comment-content">
      <span class="comment-author">{{ props.comment.author }}</span>
      <p>{{ props.comment.content }}</p>

      <!-- Show delete button if the current user is the comment author -->
      <menu v-if="props.comment.author === currentUsername" class="action-buttons">
        <button class="button-error btn-small pure-button" @click="deleteComment">Delete</button>
      </menu>
    </div>
  </div>
</template>

<style scoped>
.comment-container {
  background-color: #f5f5f5;
  padding: 1em;
  border-radius: 8px;
  margin-bottom: 1em;
}

.comment-content {
  display: flex;
  justify-content: space-between; /* Space out content and button */
  align-items: center; /* Vertically center the text and button */
  gap: 10px;
}

.comment-content p {
  flex-grow: 1; /* Ensure the comment text takes up available space */
  margin: 0;
}

.comment-author {
  font-weight: bold;
}

.action-buttons {
  margin-left: auto; /* Ensure the delete button is positioned at the far right */
}
</style>
