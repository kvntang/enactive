<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { fetchy } from "@/utils/fetchy";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref } from "vue";

interface ArchivedImage {
  _id: string;
  image: string;
  createdAt: string;
  showDelete?: boolean;
}

const { currentUserID } = storeToRefs(useUserStore());
const archivedImages = ref<ArchivedImage[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

const formatDate = (dateString: string) => {
  if (!dateString) return "Unknown Date";
  try {
    const date = new Date(dateString);
    if (!isFinite(date.getTime())) return "Unknown Date";
    
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long", 
      day: "numeric"
    });
  } catch {
    return "Unknown Date";
  }
};

const groupedImages = computed(() => {
  const groups: Record<string, ArchivedImage[]> = {};
  archivedImages.value.forEach(img => {
    const dateKey = formatDate(img.createdAt);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(img);
  });
  return groups;
});

const toggleDelete = (image: ArchivedImage) => {
  image.showDelete = !image.showDelete;
};

const deleteImage = async (imageId: string) => {
  try {
    const response = await fetchy(`/api/archiving/${imageId}`, "DELETE");
    if (response.msg === "Archive deleted successfully!") {
      archivedImages.value = archivedImages.value.filter(img => img._id !== imageId);
    } else {
      error.value = "Failed to delete image";
    }
  } catch (err) {
    error.value = "Failed to delete image";
    console.error("Delete error:", err);
  }
};

async function fetchArchive() {
  if (!currentUserID.value) {
    error.value = "User not authenticated";
    return;
  }

  isLoading.value = true;
  try {
    const result = await fetchy(`/api/archive/${currentUserID.value}`, "GET");
    const imageData = Array.isArray(result.archives) ? result.archives : [];
    archivedImages.value = imageData.map((img: ArchivedImage) => ({
      ...img,
      image: img.image.startsWith("data:image") ? img.image : `data:image/jpeg;base64,${img.image}`,
      showDelete: false
    }));
  } catch (err) {
    error.value = "Failed to load archive";
    console.error("Archive fetch error:", err);
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchArchive);
</script>

<template>
  <div class="archive-wrapper">
    <div class="archive-container">
      <h1 class="archive-title">My Archive</h1>

      <div v-if="isLoading" class="status-message">Loading...</div>
      <div v-else-if="error" class="status-message error">{{ error }}</div>
      <div v-else-if="archivedImages.length === 0" class="status-message">No archived images yet</div>

      <template v-else>
        <div v-for="(images, date) in groupedImages" :key="date" class="date-group">
          <h2 class="date-header">{{ date }}</h2>
          <div class="image-grid">
            <div v-for="image in images" :key="image._id" class="image-card">
              <div class="image-wrapper" @dblclick="toggleDelete(image)">
                <img :src="image.image" :alt="`Archive from ${formatDate(image.createdAt)}`" loading="lazy" />
                <button v-if="image.showDelete" 
                        @click="deleteImage(image._id)"
                        class="delete-button">
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.date-group {
  margin-bottom: 2rem;
}

.date-header {
  font-family: "Courier New", Courier, monospace;
  font-size: 1.25rem;
  margin: 1rem 0;
  color: #262626;
}

.delete-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 0, 0, 0.8);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.archive-wrapper {
  width: 100%;
  min-height: 100vh;
  background: white;
  padding: 2rem 0;
  margin-top: 40px;
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

}
</style>