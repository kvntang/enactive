<script setup lang="ts">
import router from "@/router";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import UpdateUserForm from "../components/Setting/UpdateUserForm.vue";

const { currentUsername } = storeToRefs(useUserStore());
const { logoutUser, deleteUser } = useUserStore();

async function logout() {
  await logoutUser();
  void router.push({ name: "Home" });
}

async function delete_() {
  await deleteUser();
  void router.push({ name: "Home" });
}
</script>

<template>
  <main>
    <h1>Settings for {{ currentUsername }}</h1>
    <section>
      <div class="button-group">
        <button class="primary-button" @click="logout">Logout</button>
        <button class="error-button" @click="delete_">Delete User</button>
      </div>
      <UpdateUserForm />
    </section>
  </main>
</template>

<style scoped>
/* Global font and background color */
body {
  font-family: "Arial", sans-serif;
  margin: 0;
  padding: 0;
  background-color: #1a1a1a;
  color: white;
}

main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  background-color: #1a1a1a;
  color: white;
  padding: 20px;
}

h1 {
  text-align: center;
  margin: 20px 0;
}

section {
  width: 90%;
  max-width: 1200px;
  margin: 20px 0;
  padding: 20px;
  border-radius: 10px;
  background: #2b2b2b;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
}

.button-group {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px; /* Space between buttons */
  margin-bottom: 20px;
}

button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  margin: 0; /* Removed unnecessary margin here */
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  /* font-weight: bold; */
  cursor: pointer;
  transition: background 0.3s ease;
}

/* Button Variants */
.primary-button {
  background: #007bff;
  color: white;
}

.primary-button:hover {
  background: #0056b3;
}

.error-button {
  background: #b91c1c;
  color: white;
}

.error-button:hover {
  background: #991b1b;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  section {
    padding: 15px;
  }

  .button-group {
    flex-direction: column; /* Stack buttons vertically on small screens */
    gap: 15px; /* Space between buttons when stacked */
  }

  button {
    width: 100%; /* Full width buttons on small screens */
    justify-content: center;
  }
}
</style>
