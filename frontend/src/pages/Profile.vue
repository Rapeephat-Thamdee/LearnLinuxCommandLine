<template>
  <div class="profile-page">
    <div class="profile-card">
      <h1>โปรไฟล์ของฉัน</h1>

      <div class="avatar-wrapper">
        <img 
          :src="user.avatar_url || defaultAvatar" 
          class="avatar-img" 
        />
        
        <div class="camera-icon" @click="triggerUpload">
          📷
        </div>
        
        <input 
          type="file" 
          ref="fileInput" 
          class="hidden-input" 
          accept="image/*"
          @change="handleFileUpload"
        />
      </div>

      <div class="info-group">
        <label>ชื่อผู้ใช้</label>
        <div class="info-box">{{ user.username }}</div>
      </div>

      <div class="info-group">
        <label>อีเมล</label>
        <div class="info-box">{{ user.email }}</div>
      </div>

      <button class="btn-back" @click="$router.push('/tracks')">
        กลับหน้าหลัก
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "@/utils/axios";

// รูป Default กรณีไม่มีรูป
const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png"; 

const user = ref({});
const fileInput = ref(null);

onMounted(() => {
  // ดึงข้อมูล User จาก LocalStorage (หรือจะยิง API /me ก็ได้)
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    user.value = JSON.parse(storedUser);
  }
});

// 1. กดปุ่มกล้อง -> สั่งคลิก input file
function triggerUpload() {
  fileInput.value.click();
}

// 2. เมื่อเลือกไฟล์เสร็จ -> ยิง API
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // เตรียม FormData
  const formData = new FormData();
  formData.append("avatar", file);

  try {
    const res = await axios.post("/users/upload-avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    // อัปเดตหน้าจอทันที
    user.value.avatar_url = res.data.avatar_url;
    
    // อัปเดต LocalStorage ด้วย (เพื่อให้หน้าอื่นเห็นรูปใหม่)
    localStorage.setItem("user", JSON.stringify(user.value));

    alert("เปลี่ยนรูปโปรไฟล์สำเร็จ! 🎉");

  } catch (err) {
    console.error("Upload Error:", err);
    alert("อัปโหลดไม่สำเร็จ");
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #D4C1EC 0%, #F3E5F5 100%);
  font-family: 'Kanit', sans-serif;
  padding: 20px;
}

.profile-card {
  background: white;
  width: 100%;
  max-width: 400px;
  padding: 40px;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

h1 {
  color: #5D4970;
  margin-bottom: 30px;
}

/* Avatar Styling */
.avatar-wrapper {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0 auto 30px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 4px solid #F3E5F5;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.camera-icon {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: #5D4970;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border: 3px solid white;
  transition: transform 0.2s;
  font-size: 1.2rem;
}

.camera-icon:hover {
  transform: scale(1.1);
  background: #8E24AA;
}

.hidden-input {
  display: none;
}

/* Info Styling */
.info-group {
  text-align: left;
  margin-bottom: 15px;
}

label {
  font-size: 0.9rem;
  color: #888;
  margin-left: 5px;
}

.info-box {
  background: #FAFAFA;
  padding: 12px 15px;
  border-radius: 12px;
  font-size: 1.1rem;
  color: #333;
  border: 1px solid #EEE;
  margin-top: 5px;
}

.btn-back {
  margin-top: 20px;
  background: transparent;
  border: 2px solid #5D4970;
  color: #5D4970;
  padding: 10px 25px;
  border-radius: 30px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
}

.btn-back:hover {
  background: #5D4970;
  color: white;
}
</style>