<template>
  <div class="user-detail-page">
    <nav class="navbar">
      <div class="logo">
        <span>LearnLinuxCommandLine</span>
      </div>
      <div class="admin-profile">
        <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="admin" class="nav-avatar" />
        <span>User Admin</span>
      </div>
    </nav>

    <div class="detail-container" v-if="user">
      <div class="left-col">
        <div class="profile-card">
          <img 
            :src="user.avatar_url || 'https://i.pinimg.com/736x/c3/d5/e0/c3d5e0aa14fc6434e3eeba1f777041bd.jpg'" 
            class="profile-img" 
          />
          <div class="profile-name-bar">{{ user.username }}</div>
        </div>
      </div>

      <div class="right-col">
        <div class="info-text">
          <h2>name: <span>{{ user.username }}</span></h2>
          <h2>email: <span>{{ user.email }}</span></h2>
        </div>

        <div class="stats-table">
          <h3>ระดับการเรียน</h3>
          
          <div class="stat-row">
            <span class="level-badge">Beginner</span>
            <div class="stat-data">
              <span>คะแนนสูงสุด: <strong>{{ getScore(1) }}</strong></span>
            </div>
          </div>

          <div class="stat-row">
            <span class="level-badge">Intermediate</span>
            <div class="stat-data">
              <span>คะแนนสูงสุด: <strong>{{ getScore(2) }}</strong></span>
            </div>
          </div>

          <div class="stat-row">
            <span class="level-badge">Advanced</span>
            <div class="stat-data">
              <span>คะแนนสูงสุด: <strong>{{ getScore(3) }}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="action-buttons">
      <button class="btn-back" @click="router.push('/admin/dashboard')">กลับ</button>
      <button class="btn-delete" @click="deleteUser">Delete account</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "@/utils/axios";

const route = useRoute();
const router = useRouter();
const user = ref(null);
const results = ref([]);

onMounted(async () => {
  try {
    const res = await axios.get(`/admin/users/${route.params.id}`);
    user.value = res.data.user;
    results.value = res.data.results;
  } catch (err) {
    console.error(err);
  }
});

function getScore(trackId) {
  if (!results.value) return 0; // กัน error ถ้า results ยังไม่มา
  const result = results.value.find(r => r.track_id === trackId);
  return result ? result.bestScore : 0;
}

async function deleteUser() {
  if(confirm("ยืนยันลบ Account นี้?")) {
    try {
      await axios.delete(`/admin/users/${route.params.id}`);
      router.push('/admin/dashboard');
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการลบ");
    }
  }
}
</script>

<style scoped>
/* --- 1. โครงสร้างหลัก (Main Layout) --- */
.user-detail-page {
  min-height: 100vh;
  background-color: #D4C1EC; /* สีม่วงอ่อนตามธีม */
  font-family: 'Kanit', sans-serif;
  padding-bottom: 80px; /* เว้นที่ให้ปุ่มด้านล่าง */
}

/* --- 2. แถบเมนูด้านบน (Navbar) --- */
.navbar {
  background-color: #5D4970; /* สีม่วงเข้ม */
  color: white;
  padding: 10px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
}

.logo, .admin-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: bold;
  font-size: 1.1rem;
}

.nav-icon, .nav-avatar {
  width: 35px;
  height: 35px;
  background: white;
  border-radius: 50%;
  padding: 3px;
}

/* --- 3. กล่องเนื้อหา (Content Container) --- */
.detail-container {
  display: flex; /* 🔥 สำคัญ: ทำให้แบ่งซ้ายขวา */
  gap: 40px;
  padding: 40px;
  max-width: 1000px;
  margin: 0 auto;
  align-items: flex-start;
}

/* --- 4. ฝั่งซ้าย (Profile Image) --- */
.left-col {
  flex: 0 0 250px; /* ล็อกความกว้างไว้ที่ 250px */
}

.profile-card {
  background: #B565A7; /* สีชมพูเข้ม */
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  text-align: center;
}

.profile-img {
  width: 100%;
  height: 250px;
  object-fit: cover; /* ให้รูปเต็มกรอบสวยๆ */
  background-color: white;
  display: block;
}

.profile-name-bar {
  background-color: #9C4D88;
  color: white;
  padding: 12px;
  font-weight: bold;
  font-size: 1.2rem;
}

/* --- 5. ฝั่งขวา (Info & Stats) --- */
.right-col {
  flex: 1; /* ขยายเต็มพื้นที่ที่เหลือ */
}

.info-text h2 {
  margin: 0 0 10px 0;
  font-size: 1.5rem;
  color: #2c3e50;
  font-weight: normal;
}
.info-text h2 span {
  font-weight: bold;
}

.stats-table {
  background-color: rgba(255, 255, 255, 0.4); /* พื้นหลังโปร่งใสจางๆ */
  border-radius: 15px;
  padding: 25px;
  margin-top: 20px;
}

.stats-table h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.3rem;
  font-weight: bold;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #E6C8E0; /* สีพื้นหลังแถวชมพูอ่อน */
  padding: 15px 20px;
  margin-bottom: 12px;
  border-radius: 10px;
  font-size: 1.1rem;
  color: #333;
}

.level-badge {
  font-weight: bold;
  min-width: 120px;
}

.stat-data {
  display: flex;
  gap: 30px;
}

/* --- 6. ปุ่มด้านล่าง (Action Buttons) --- */
/* --- 6. ปุ่มด้านล่าง (Action Buttons) --- */
.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  
  /* ✅ เพิ่มบรรทัดนี้ครับ: เพื่อให้ padding ไม่ดันความกว้างเกิน 100% */
  box-sizing: border-box; 
  
  background: rgba(255, 255, 255, 0.9);
  padding: 15px 40px;
  display: flex;
  justify-content: space-between;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  
  /* เพิ่ม z-index เพื่อให้แน่ใจว่าปุ่มลอยอยู่เหนือ content อื่น */
  z-index: 10; 
}

.btn-back {
  background-color: #7f8c8d;
  color: white;
  border: none;
  padding: 10px 40px;
  border-radius: 30px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: transform 0.2s;
}

.btn-delete {
  background-color: #c0392b; /* สีแดงเข้ม */
  color: white;
  border: none;
  padding: 10px 40px;
  border-radius: 30px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: transform 0.2s;
}

.btn-back:hover, .btn-delete:hover {
  transform: scale(1.05);
}

/* Responsive: ปรับสำหรับมือถือ */
@media (max-width: 768px) {
  .detail-container {
    flex-direction: column;
    align-items: center;
  }
  .left-col, .right-col {
    width: 100%;
  }
  .stat-row {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  .stat-data {
    flex-direction: column;
    gap: 5px;
  }
}
</style>