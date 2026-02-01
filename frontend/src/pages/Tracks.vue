<template>
  <div class="page">
    <header class="header">
      <div class="header-left">
        <div class="logo-box">🐧</div>
        <div class="header-text">
          <h1>เลือกระดับการเรียนรู้</h1>
          <p>เส้นทางสู่การเป็นจอมยุทธ์เซียน Linux</p>
        </div>
      </div>

      <div class="header-right">
        <div class="profile-box" @click="goToProfile" title="แก้ไขโปรไฟล์">
          <div class="avatar-wrapper">
            <img 
              :src="user.avatar_url || defaultAvatar" 
              class="avatar-img" 
              alt="Profile"
              @error="handleImageError"
            />
            <div class="edit-icon">✏️</div>
          </div>
          <div class="user-info">
            <span class="username">{{ user.username || 'Guest' }}</span>
            <span class="role-badge">{{ user.role || 'Member' }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <button class="logout-btn" @click="logout">
           ออกจากระบบ
        </button>
      </div>
    </header>

    <main class="tracks-container">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        กำลังโหลดข้อมูล...
      </div>

      <div v-else class="tracks-grid">
        <div
          v-for="t in tracks"
          :key="t.id"
          class="track-card"
          @click="selectTrack(t)"
        >
          <img :src="getTrackImage(t.id)" class="card-img" />
          
          <div class="hover-overlay">
            <span>เข้าสู่บทเรียน</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "@/utils/axios";
import { useRouter } from "vue-router";

// Import รูปภาพ Tracks
import imgBeginner from '@/img/Beginner.png';      
import imgIntermediate from '@/img/intermediat.png'; 
import imgAdvanced from '@/img/advanced.png';      

const tracks = ref([]);
const loading = ref(true);
const user = ref({});
const router = useRouter();
const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

// ✅ ฟังก์ชันกันรูปแตก: ถ้าโหลดรูปจริงไม่ได้ ให้ใช้รูป Default แทน
function handleImageError(e) {
  e.target.src = defaultAvatar;
}

// ฟังก์ชันเลือกรูปภาพตาม ID
function getTrackImage(id) {
  if (id === 1) return imgBeginner;
  if (id === 2) return imgIntermediate;
  if (id === 3) return imgAdvanced;
  return imgBeginner;
}

onMounted(async () => {
  // 1. Load User from LocalStorage
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser);
    } catch (e) {
      console.error("Parse user error", e);
    }
  }

  // 2. Load Tracks
  try {
    const res = await axios.get("/tracks");
    tracks.value = res.data;
  } catch (err) {
    console.error("Load tracks error:", err);
  } finally {
    loading.value = false;
  }
});

function selectTrack(track) {
  localStorage.setItem("trackId", track.id);
  // เช็คว่าเคยเรียนถึงไหนแล้ว (Optional) หรือไปหน้า Track เลย
  router.push(`/track?track=${track.id}`);
}

function goToProfile() {
  router.push("/profile"); // ไปหน้าแก้ไขโปรไฟล์
}

function logout() {
  if(confirm("ต้องการออกจากระบบหรือไม่?")) {
      localStorage.clear();
      router.push("/login");
  }
}
</script>

<style scoped>
/* Font & Page Setup */
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600&display=swap');

.page {
  padding: 30px 40px;
  min-height: 100vh;
  background: linear-gradient(135deg, #D4C1EC 0%, #F3E5F5 100%);
  display: flex;
  flex-direction: column;
  font-family: 'Kanit', sans-serif;
}

/* HEADER STYLE */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  padding: 15px 30px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(93, 73, 112, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo-box {
  font-size: 2.5rem;
  background: #F3E5F5;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.header-text h1 {
  margin: 0;
  color: #5D4970;
  font-size: 1.8rem;
  line-height: 1.2;
}

.header-text p {
  margin: 0;
  color: #888;
  font-size: 0.95rem;
}

/* Header Right: Profile & Logout */
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-box {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 12px;
  transition: background 0.2s;
}

.profile-box:hover {
  background: rgba(93, 73, 112, 0.05);
}

.avatar-wrapper {
  position: relative;
  width: 50px;
  height: 50px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #D4C1EC;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.edit-icon {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: white;
  border-radius: 50%;
  font-size: 0.7rem;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.role-badge {
  font-size: 0.75rem;
  color: #5D4970;
  background: #E6C8E0;
  padding: 2px 8px;
  border-radius: 10px;
  align-self: flex-start;
}

.divider {
  width: 1px;
  height: 40px;
  background: #DDD;
}

.logout-btn {
  background: transparent;
  color: #ff6b6b;
  border: 2px solid #ff6b6b;
  padding: 8px 20px;
  cursor: pointer;
  border-radius: 30px;
  font-weight: bold;
  font-size: 0.95rem;
  transition: all 0.2s;
  font-family: 'Kanit', sans-serif;
}

.logout-btn:hover {
  background: #ff6b6b;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(255, 107, 107, 0.2);
}

/* TRACKS CONTAINER */
.tracks-container {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading {
  text-align: center;
  color: #5D4970;
  font-size: 1.2rem;
  font-weight: 500;
}
.spinner {
  width: 40px; height: 40px;
  border: 4px solid #D4C1EC;
  border-top-color: #5D4970;
  border-radius: 50%;
  margin: 0 auto 15px;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* GRID */
.tracks-grid {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}

/* CARD STYLES */
.track-card {
  width: 320px; 
  height: 450px;
  cursor: pointer;
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(93, 73, 112, 0.15);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  background: white;
}

.track-card:hover {
  transform: translateY(-15px) scale(1.02);
  box-shadow: 0 20px 50px rgba(93, 73, 112, 0.25);
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Hover Overlay */
.hover-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(93, 73, 112, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
  backdrop-filter: blur(2px);
}

.track-card:hover .hover-overlay {
  opacity: 1;
}

.hover-overlay span {
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  padding: 12px 25px;
  border: 2px solid white;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}
</style>