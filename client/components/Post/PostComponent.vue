<script setup lang="ts">
import { ref, onMounted, onBeforeMount } from "vue";
import CommentComponent from "@/components/Comment/CommentComponent.vue";
import CommentPostForm from "@/components/Comment/CommentPostForm.vue";
import { useUserStore } from "@/stores/user";
import { formatDate } from "@/utils/formatDate";
import { storeToRefs } from "pinia";
import { fetchy } from "../../utils/fetchy";

const props = defineProps(["post"]);
const emit = defineEmits(["editPost", "refreshPosts"]);
const { currentUsername } = storeToRefs(useUserStore());
const userStore = useUserStore();
const { isLoggedIn } = storeToRefs(userStore);
const loaded = ref(false);

const comments = ref<Array<Record<string, string>>>([]);

async function getComments(postId?: string) {
  let query: Record<string, string> = postId !== undefined ? { postId } : {};
  let commentResults;
  try {
    commentResults = await fetchy("api/comments", "GET", { query });
    console.log("refreshing comments");
  } catch (_) {
    return;
  }
  comments.value = commentResults;
}

onBeforeMount(async () => {
  if (props.post._id) {
    await getComments(props.post._id); // Pass postId
  }
  loaded.value = true;
});

const deletePost = async () => {
  try {
    await fetchy(`/api/posts/${props.post._id}`, "DELETE");
  } catch {
    return;
  }
  emit("refreshPosts");
};

// Compute the image source from the base64 string
const imageSrc = ref<string | null>(null);
// Function to handle the base64 image creation
async function createImageFromBase64(base64ImageData: string): Promise<string | null> {
  if (!base64ImageData) return null;

  if (!base64ImageData.startsWith("data:image")) {
    base64ImageData = `data:image/jpeg;base64,${base64ImageData}`;
  }

  const img = new Image();
  img.src = base64ImageData;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (error) => reject(error);
  });

  return base64ImageData;
}

onMounted(async () => {
  if (props.post.photo) {
    try {
      imageSrc.value = await createImageFromBase64(props.post.photo);
    } catch (error) {
      console.error("Error setting image source:", error);
    }
  }
});
</script>

<template>
  <!-- Author and Edit/Delete buttons in the same row -->
  <div class="post-header">
    <p class="author">{{ props.post.author }}</p>

    <menu v-if="props.post.author == currentUsername" class="action-buttons">
      <li><button class="btn-small pure-button" @click="emit('editPost', props.post._id)">Edit</button></li>
      <li><button class="button-error btn-small pure-button" @click="deletePost">Delete</button></li>
    </menu>
  </div>

  <!-- Post content -->
  <p>{{ props.post.content }}</p>

  <!-- Lazy load the image -->
  <div v-if="imageSrc">
    <img :src="imageSrc" alt="Uploaded Image" loading="lazy" class="responsive-image" />
  </div>
  <p v-else>No photo available.</p>

  <!-- Timestamp under the image -->
  <article class="timestamp">
    <p v-if="props.post.dateCreated !== props.post.dateUpdated">Edited on: {{ formatDate(props.post.dateUpdated) }}</p>
    <p v-else>Created on: {{ formatDate(props.post.dateCreated) }}</p>
  </article>

  <!-- Commenting -->
  <div>
    <!-- Display comments if they exist -->
    <section class="comments" v-if="loaded && comments.length !== 0">
      <div v-for="comment in comments" :key="comment._id">
        <CommentComponent :comment="comment" @refreshComments="getComments(props.post._id)" />
      </div>
    </section>

    <!-- Display "No comments yet" message if loaded and no comments exist -->
    <p v-else-if="loaded">No comments yet</p>
    <p v-else>Loading...</p>

    <!-- Show CommentPostForm only if the user is logged in -->
    <div v-if="isLoggedIn">
      <CommentPostForm :postId="props.post._id" @refreshComments="getComments(props.post._id)" />
    </div>
    <div v-else>
      <p>You need to be logged in to add a comment.</p>
      <!-- Optional message when not logged in -->
    </div>
  </div>
</template>

<style scoped>
.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1em;
}

.action-buttons {
  list-style-type: none;
  display: flex;
  gap: 0.5em; /* Space between Edit and Delete buttons */
  padding: 0;
  margin: 0;
}

.responsive-image {
  display: block;
  margin: 0 auto;
  width: 100%; /* Ensure it takes up full width of the container */
  max-width: 500px; /* Set maximum width */
  height: 300px; /* Set a fixed height for all images */
  object-fit: cover; /* Crop the image to fit within the container */
  border-radius: 8px; /* Optional: Add rounded corners */
}

p {
  margin: 0em;
}

.author {
  font-weight: bold;
  font-size: 1.5em;
}

menu {
  list-style-type: none;
  display: flex;
  flex-direction: row;
  gap: 1em;
  padding: 0;
  margin: 0;
}

.commentbox {
  background-color: #d7dfe1;
  padding: 0.5em;
  color: #eeeeee;
  border-radius: 8px;
}

.timestamp {
  display: flex;
  justify-content: flex-end;
  font-size: 0.9em;
  font-style: italic;
}

.base {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.base article:only-child {
  margin-left: auto;
}
</style>
