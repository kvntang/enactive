<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { fetchy } from "@/utils/fetchy";
import { storeToRefs } from "pinia";
import { onMounted, ref } from "vue";

interface ArchivedImage {
  _id: string;
  image: string;
  createdAt: string;
}

const { currentUserID } = storeToRefs(useUserStore());
const archivedImages = ref<ArchivedImage[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

async function fetchArchive() {
  if (!currentUserID.value) {
    error.value = "User not authenticated";
    console.log("No user ID available");
    return;
  }

  isLoading.value = true;
  try {
    const result = await fetchy(`/api/archive/${currentUserID.value}`, "GET");
    console.log("Archive fetch result:", result);

    const imageData = Array.isArray(result.archives) ? result.archives : [];
    archivedImages.value = imageData.map((img: ArchivedImage) => ({
      ...img,
      image: img.image.startsWith("data:image") ? img.image : `data:image/jpeg;base64,${img.image}`,
    }));
  } catch (err) {
    error.value = "Failed to load archive";
    console.error("Archive fetch error:", err);
  } finally {
    isLoading.value = false;
  }
}

const handleSaveCompleted = () => {
  fetchArchive();
};

onMounted(fetchArchive);
</script>

<template>
  <div class="archive-wrapper">
    <div class="archive-container">
      <h1 class="archive-title">My Archive</h1>

      <div v-if="isLoading" class="status-message">Loading...</div>
      <div v-else-if="error" class="status-message error">{{ error }}</div>
      <div v-else-if="archivedImages.length === 0" class="status-message">No archived images yet</div>

      <div v-else class="image-grid">
        <div v-for="image in archivedImages" :key="image._id" class="image-card">
          <div class="image-wrapper">
            <img :src="image.image" :alt="`Archive from ${formatDate(image.createdAt)}`" loading="lazy" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.archive-wrapper {
  width: 100%;
  min-height: 100vh;
  background: #fafafa;
  padding: 2rem 0;
  overflow-y: scroll;
  overscroll-behavior-y: contain;
}

.archive-container {
  max-width: 935px;
  margin: 0 auto;
  padding: 0 20px;
}

.archive-title {
  /* font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; */
  font-family: "Courier New", Courier, monospace;
  font-size: 1.75rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 2rem;
  color: #262626;
}

.status-message {
  text-align: center;
  padding: 2rem;
  color: #8e8e8e;
  font-size: 1.1rem;
}

.status-message.error {
  color: #ed4956;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
  margin: 0 auto;
}

.image-card {
  position: relative;
  width: 100%;
  background: #fff;
  max-width: 300px;
}

.image-wrapper {
  position: relative;
  padding-bottom: 100%;
  overflow: hidden;
  max-height: 300px;
}

.image-wrapper img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  max-width: 300px;
  max-height: 300px;
}

.image-wrapper:hover img {
  transform: scale(1.02);
}

@media (max-width: 935px) {
  .archive-container {
    padding: 0 15px;
  }

  .image-grid {
    gap: 3px;
  }
}

@media (max-width: 600px) {
  .archive-title {
    font-size: 1.5rem;
  }

  .archive-wrapper {
    padding: 1rem 0;
  }
}
</style>
