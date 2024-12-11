<script setup lang="ts">
import LoginForm from "@/components/Login/LoginForm.vue";
import RegisterForm from "@/components/Login/RegisterForm.vue";
</script>

<template>
  <main class="main-container">
    <h1>Please Login or Register</h1>
    <section class="forms-section">
      <div class="form-container">
        <LoginForm />
        <RegisterForm />
      </div>
    </section>
  </main>
</template>

<style scoped>
body {
  font-family: 'Courier New', Courier, monospace;
  background-color: #f0f0f0;
  margin: 0;
  padding: 0;
}

.main-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  background-color: #ffffff;
  color: white;
  padding: 20px;
}

h1 {
  font-family: 'Courier New', Courier, monospace;
  text-align: center;
  margin: 20px 0;
}

.forms-section {
  font-family: 'Courier New', Courier, monospace;
  width: 100%;
  max-width: 900px;
  display: flex;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
  box-sizing: border-box;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
}


@media (min-width: 768px) {
  .form-container {
    flex-direction: row;
    justify-content: center;
    gap: 40px;
  }

  .forms-section {
    display: flex;
    justify-content: center;
  }

  .form {
    flex: 1;
    max-width: 400px;
  }
}

@media (max-width: 480px) {
  .forms-section {
    padding: 10px;
  }

  h1 {
    font-size: 1.5rem;
  }
}
</style>
