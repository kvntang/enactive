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
  <h2>Update user details</h2>
  <form @submit.prevent="updateUsername" class="pure-form">
    <fieldset>
      <legend>Change your username</legend>
      <div class="form-group">
        <input type="text" placeholder="New username" v-model="username" required />
        <button type="submit" class="pure-button pure-button-primary">Update username</button>
      </div>
    </fieldset>
  </form>

  <form @submit.prevent="updatePassword" class="pure-form">
    <fieldset>
      <legend>Change your password</legend>
      <div class="form-group">
        <input type="password" placeholder="Old password" v-model="currentPassword" required />
        <input type="password" placeholder="New password" v-model="newPassword" required />
        <button type="submit" class="pure-button pure-button-primary">Update password</button>
      </div>
    </fieldset>
  </form>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f9f9f9;
}

.content {
  max-width: 600px;
  width: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

fieldset {
  border: none;
  padding: 0;
  margin: 0;
}

legend {
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: white;
}

.form-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

input {
  flex: 1;
  padding: 10px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  margin: 0;
  border: none;
  border-radius: 4px;
  background: #007BFF;
  color: #fff;
  font-size: 1rem;
  /* font-weight: bold; */
  cursor: pointer;
  transition: background 0.3s ease;
}

button:hover {
  background: #0056b3;
}

@media (max-width: 768px) {
  .content {
    padding: 15px;
  }

  .form-group {
    flex-direction: column;
    gap: 15px;
  }

  button {
    width: 100%;
  }
}
</style>
