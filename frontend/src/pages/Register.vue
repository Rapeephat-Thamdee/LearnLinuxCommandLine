<template>
  <div class="register-page">
    <div class="register-card">
      <div class="header-section">
        <div class="logo-circle">
          <span class="logo-icon">📝</span>
        </div>
        <h1>สร้างบัญชีใหม่</h1>
        <p class="subtitle">เข้าร่วมกับเราเพื่อเรียนรู้ Linux CLI</p>
      </div>

      <form @submit.prevent="register" class="register-form">
        
        <div class="input-group">
          <label>ชื่อผู้ใช้ (Username)</label>
          <input 
            v-model="username" 
            placeholder="ตั้งชื่อผู้ใช้ของคุณ" 
            class="input-field"
            required
          />
        </div>

        <div class="input-group">
          <label>อีเมล (Email)</label>
          <input 
            v-model="email" 
            type="email" 
            placeholder="example@email.com" 
            class="input-field"
            required
          />
        </div>

        <div class="input-row">
          <div class="input-group">
            <label>รหัสผ่าน</label>
            <input 
              v-model="password" 
              type="password" 
              placeholder="******" 
              class="input-field"
              required
            />
          </div>

          <div class="input-group">
            <label>ยืนยันรหัสผ่าน</label>
            <input 
              v-model="confirmPassword" 
              type="password" 
              placeholder="******" 
              class="input-field"
              required
            />
          </div>
        </div>

        <button type="submit" class="btn-register" :disabled="isLoading">
          <span v-if="!isLoading">สมัครสมาชิก</span>
          <span v-else class="spinner"></span>
        </button>
      </form>

      <transition name="shake">
        <p v-if="error" class="error-msg">
          ⚠️ {{ error }}
        </p>
      </transition>

      <div class="card-footer">
        <p>มีบัญชีอยู่แล้วใช่ไหม?</p>
        <span class="login-link" @click="goLogin">เข้าสู่ระบบ</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "@/utils/axios";
import { useRouter } from "vue-router";

const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref("");
const isLoading = ref(false);
const router = useRouter();

async function register() {
  error.value = "";
  
  // 1. Validation เบื้องต้น
  if (!username.value || !email.value || !password.value) {
    error.value = "กรุณากรอกข้อมูลให้ครบถ้วน";
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = "รหัสผ่านไม่ตรงกัน";
    return;
  }

  if (password.value.length < 6) {
    error.value = "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร";
    return;
  }

  isLoading.value = true;

  try {
    // 2. ส่งข้อมูลไป Backend
    await axios.post("/auth/register", {
      username: username.value,
      email: email.value,
      password: password.value
    });

    // สมัครสำเร็จ -> ไปหน้า Login
    // อาจจะเพิ่ม Alert แจ้งเตือนความสำเร็จก่อนเปลี่ยนหน้าก็ได้
    alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
    router.push("/login");

  } catch (err) {
    error.value = err.response?.data?.error || "สมัครไม่สำเร็จ โปรดลองอีกครั้ง";
  } finally {
    isLoading.value = false;
  }
}

function goLogin() {
  router.push("/login");
}
</script>

<style scoped>
/* Font */
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600&display=swap');

.register-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #D4C1EC 0%, #F3E5F5 100%);
  font-family: 'Kanit', sans-serif;
  padding: 20px;
}

.register-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 40px;
  width: 100%;
  max-width: 450px;
  border-radius: 24px;
  box-shadow: 0 15px 35px rgba(93, 73, 112, 0.15);
  backdrop-filter: blur(10px);
  animation: slideUp 0.5s ease-out;
}

/* Header */
.header-section {
  text-align: center;
  margin-bottom: 30px;
}

.logo-circle {
  width: 70px;
  height: 70px;
  background: #F3E5F5;
  border-radius: 50%;
  margin: 0 auto 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 35px;
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
  font-size: 0.9rem;
}

/* Form */
.register-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-row {
  display: flex;
  gap: 15px;
}
.input-row .input-group {
  flex: 1;
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
  font-size: 0.95rem;
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

/* Button */
.btn-register {
  margin-top: 10px;
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

.btn-register:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(93, 73, 112, 0.4);
}

.btn-register:disabled {
  opacity: 0.7;
  cursor: wait;
}

/* Footer (✅ แก้ไขส่วนนี้เพื่อให้ตรงกัน) */
.card-footer {
  margin-top: 25px;
  text-align: center;
  font-size: 0.9rem;
  color: #666;
  display: flex;
  justify-content: center;
  align-items: center; /* 🔥 จัดกึ่งกลางแนวตั้ง */
  gap: 6px;
}

.card-footer p {
  margin: 0; /* 🔥 ลบ Margin ที่ทำให้เบี้ยวออก */
}

.login-link {
  color: #5D4970;
  font-weight: bold;
  cursor: pointer;
  transition: color 0.2s;
  white-space: nowrap; /* กันข้อความตกบรรทัด */
}

.login-link:hover {
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
  font-size: 0.85rem;
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

/* Mobile Responsive */
@media (max-width: 480px) {
  .input-row {
    flex-direction: column;
    gap: 15px;
  }
}
</style>