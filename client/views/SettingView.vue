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
    <section>
      <div class="button-container">
        <button class="primary-button logout-button" @click="logout">Logout</button>
        <UpdateUserForm />
        <button class="error-button delete-button" @click="delete_">Delete User</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: white;
  color: rgb(0, 0, 0);
  padding: 20px;
}

.button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%;
  max-width: 400px;
  gap: 20px;
}

.logout-button {
  margin-top: auto;
  align-self: center;
}

.delete-button {
  margin-top: 180px;
  align-self: center;
}

button {
  font-family: 'Courier New', Courier, monospace;
  background-color: rgb(52, 29, 185);
  color: rgb(255, 255, 255);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
}

.primary-button {
  background: rgb(52, 29, 185);
}

.primary-button:hover {
  background: #341db9;
}

.error-button {
  background: #b91c1c;
  color: white;
}

.error-button:hover {
  background: #991b1b;
}

@media (max-width: 768px) {
  .logout-button {
    position: static;
    margin-bottom: 20px;
  }
}
</style>