<template>
  <div class="login-page">
    <div class="login-card">
      <div class="logo-section">
        <div class="logo-circle">
          <span class="logo-icon">🐧</span> 
        </div>
        <h1>Learn Linux CLI</h1>
        <p class="subtitle">ยินดีต้อนรับสู่โลกแห่ง Command Line</p>
      </div>

      <form @submit.prevent="login" class="login-form">
        <div class="input-group">
          <label>บัญชีผู้ใช้</label>
          <input
            v-model="identifier"
            placeholder="Username หรือ Email"
            autocomplete="username"
            class="input-field"
            required
          />
        </div>

        <div class="input-group">
          <label>รหัสผ่าน</label>
          <input
            v-model="password"
            type="password"
            placeholder="กรอกรหัสผ่านของคุณ"
            autocomplete="current-password"
            class="input-field"
            required
          />
        </div>

        <div class="actions">
          <a href="#" class="forgot-pass">ลืมรหัสผ่าน?</a>
        </div>

        <button type="submit" class="btn-login" :disabled="isLoading">
          <span v-if="!isLoading">เข้าสู่ระบบ</span>
          <span v-else class="spinner"></span>
        </button>
      </form>

      <transition name="shake">
        <p v-if="error" class="error-msg">
          ⚠️ {{ error }}
        </p>
      </transition>

      <div class="card-footer">
        <p>ยังไม่มีบัญชีใช่ไหม?</p>
        <span class="register-link" @click="goRegister">สมัครสมาชิกใหม่</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "@/utils/axios";
import { useRouter } from "vue-router";

const identifier = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);

const router = useRouter();

async function login() {
  if (!identifier.value || !password.value) return;

  isLoading.value = true;
  error.value = "";

  try {
    const res = await axios.post("/auth/login", {
      identifier: identifier.value,
      password: password.value
    });

    // 1. เก็บ token และ user
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    // 2. เช็ค Role
    const userRole = res.data.user.role;
    
    // หน่วงเวลาเล็กน้อยให้ User เห็นว่า Login สำเร็จ (Optional)
    setTimeout(() => {
      if (userRole === 'admin') {
        router.push("/admin/dashboard"); 
      } else {
        router.push("/tracks");
      }
    }, 500);

  } catch (err) {
    error.value = err.response?.data?.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
    console.error("Login Error:", err);
    isLoading.value = false; // หยุดโหลดเฉพาะตอน Error
  }
}

function goRegister() {
  router.push("/register");
}
</script>

<style scoped>
/* Font */
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600&display=swap');

.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  /* Gradient ม่วงแบบเดียวกับหน้าอื่นๆ */
  background: linear-gradient(135deg, #D4C1EC 0%, #F3E5F5 100%);
  font-family: 'Kanit', sans-serif;
  padding: 20px;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 40px;
  width: 100%;
  max-width: 400px;
  border-radius: 24px;
  box-shadow: 0 15px 35px rgba(93, 73, 112, 0.15);
  backdrop-filter: blur(10px);
  animation: slideUp 0.5s ease-out;
}

/* Logo Section */
.logo-section {
  text-align: center;
  margin-bottom: 30px;
}

.logo-circle {
  width: 80px;
  height: 80px;
  background: #F3E5F5;
  border-radius: 50%;
  margin: 0 auto 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 40px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

h1 {
  margin: 0;
  color: #5D4970;
  font-size: 1.8rem;
  font-weight: 600;
}

.subtitle {
  margin: 5px 0 0;
  color: #888;
  font-size: 0.95rem;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 0.9rem;
  color: #555;
  font-weight: 500;
  margin-left: 5px;
}

.input-field {
  padding: 12px 16px;
  border: 2px solid #EEE;
  border-radius: 12px;
  font-size: 1rem;
  background: #FAFAFA;
  transition: all 0.2s;
  outline: none;
  font-family: 'Kanit', sans-serif;
}

.input-field:focus {
  border-color: #5D4970;
  background: white;
  box-shadow: 0 0 0 3px rgba(93, 73, 112, 0.1);
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.forgot-pass {
  font-size: 0.85rem;
  color: #5D4970;
  text-decoration: none;
  font-weight: 500;
}
.forgot-pass:hover {
  text-decoration: underline;
}

/* Button */
.btn-login {
  padding: 14px;
  background: linear-gradient(135deg, #5D4970 0%, #4a3b59 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 15px rgba(93, 73, 112, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(93, 73, 112, 0.4);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: wait;
}

/* Footer */
.card-footer {
  margin-top: 30px;
  text-align: center;
  font-size: 0.95rem;
  color: #666;
}

.register-link {
  color: #5D4970;
  font-weight: bold;
  cursor: pointer;
  margin-left: 5px;
  transition: color 0.2s;
}

.register-link:hover {
  color: #8E24AA;
  text-decoration: underline;
}

/* Error */
.error-msg {
  margin-top: 15px;
  padding: 10px;
  background: #FFEBEE;
  color: #D32F2F;
  border-radius: 8px;
  text-align: center;
  font-size: 0.9rem;
  border: 1px solid #FFCDD2;
}

/* Animation */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>