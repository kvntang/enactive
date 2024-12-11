<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { ref } from "vue";

let username = ref(""); 
let currentPassword = ref(""); 
let newPassword = ref("");

const { updateUserUsername, updateUserPassword, updateSession } = useUserStore();

async function updateUsername() {
  await updateUserUsername(username.value);
  await updateSession();
  username.value = "";
}

async function updatePassword() {
  await updateUserPassword(currentPassword.value, newPassword.value);
  await updateSession();
  currentPassword.value = newPassword.value = "";
}
</script>

<template>
  <main class="container">
    <div class="content">
      <!-- <h2 class="page-title">Update User Details</h2> -->
      
      <!-- <form @submit.prevent="updateUsername" class="form">
        <fieldset>
          <legend>Change Username</legend>
          <div class="form-group">
            <input 
              type="text" 
              placeholder="New username" 
              v-model="username" 
              required 
            />
            <button type="submit" class="submit-button">Update Username</button>
          </div>
        </fieldset>
      </form> -->

      <form @submit.prevent="updatePassword" class="form">
        <fieldset>
          <legend>Change Password</legend>
          <div class="form-group">
            <input 
              type="password" 
              placeholder="Current password" 
              v-model="currentPassword" 
              required 
            />
            <input 
              type="password" 
              placeholder="New password" 
              v-model="newPassword" 
              required 
            />
            <button type="submit" class="submit-button">Update Password</button>
          </div>
        </fieldset>
      </form>
    </div>
  </main>
</template>

<style scoped>
h2 {
  font-family: 'Courier New', Courier, monospace;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 20vh;
  padding: 10px;
  background-color: white;
}

.content {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-title {
  text-align: center;
  margin-bottom: 20px;
  color: rgb(52, 29, 185);
}

.form {
  width: 100%;
  margin-bottom: 20px;
}

fieldset {
  border: none;
  padding: 0;
  margin: 0;
  width: 100%;
}

legend {
  font-family: 'Courier New', Courier, monospace;
  font-size: 1rem;
  margin-bottom: 10px;
  text-align: left;
  width: 100%;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
}

input {
  width: 100%;
  padding: 10px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.submit-button {
  font-family: 'Courier New', Courier, monospace;
  background-color: rgb(52, 29, 185);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s ease;
  width: 100%;
  max-width: 200px;
}

.submit-button:hover {
  background: #341db9;
}

@media (max-width: 768px) {
  .content {
    width: 90%;
    padding: 20px;
  }
}
</style>