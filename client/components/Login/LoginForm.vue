<script setup lang="ts">
import router from "@/router";
import { useUserStore } from "@/stores/user";
import { ref } from "vue";

const username = ref("");
const password = ref("");
const { loginUser, updateSession } = useUserStore();

async function login() {
  try {
    await loginUser(username.value, password.value);
    await updateSession();
    void router.push({ name: "Home" });
  } catch (error) {
    // Handle login error (optional)
    console.error("Login failed:", error);
  }
}
</script>

<template>
  <form @submit.prevent="login" class="form">
    <fieldset>
      <legend>Login</legend>
      <div class="form-group">
        <input
          type="text"
          placeholder="Username"
          v-model.trim="username"
          required
        />
        <input
          type="password"
          placeholder="Password"
          v-model.trim="password"
          required
        />
        <button type="submit" class="primary-button">Login</button>
      </div>
    </fieldset>
  </form>
</template>

<style scoped>


.form {
  font-family: 'Courier New', Courier, monospace;
  width: 100%;
  max-width: 400px;
  background: #ffffff;
  border-radius: 8px;
  padding: 25px;
  box-sizing: border-box;
}

fieldset {
  border: none;
  padding: 0;
  margin: 0;
}

legend {
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.4rem;
  margin-bottom: 15px;
  color: #000000;
  text-align: center;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

input {
  font-family: 'Courier New', Courier, monospace;
  padding: 12px 15px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  transition: border-color 0.3s ease;
}

input:focus {
  border-color: #007bff;
  outline: none;
}

.primary-button {
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
  transition: background 0.3s ease;
}

.primary-button:hover {
  background: #341db9;
}

@media (max-width: 480px) {
  .form {
    padding: 20px;
  }
}
</style>
