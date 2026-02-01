<template>
  <div class="admin-dashboard">
    <nav class="navbar">
      <div class="logo"> 
        <span>LearnLinuxCommandLine</span>
      </div>
      
      <div class="admin-profile">
        <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="admin" class="nav-avatar" />
        <span class="admin-name">User Admin</span>
        
        <button @click="logout" class="logout-btn">
           Logout
        </button>
      </div>
    </nav>

    <div class="content-container">
      <div class="stats-row">
        <div class="stat-card">
          <h3>จำนวนผู้ใช้งาน</h3>
          <p class="stat-number">{{ users.length }}</p>
        </div>
        <div class="stat-card">
          <h3>จำนวนผู้ใช้งานใหม่</h3>
          <p class="stat-number">4</p>
        </div>
        <div class="stat-card">
          <h3>อัตราการเรียนจบเฉลี่ย</h3>
          <p class="stat-number">97%</p>
        </div>
      </div>

      <div class="search-section">
        <div class="search-bar">
          <input 
            v-model="search" 
            @input="fetchUsers" 
            placeholder="ค้นหา..." 
          />
          <button class="search-btn">🔍</button>
        </div>
      </div>

      <div v-if="loading" class="loading">Loading...</div>
      
      <div v-else class="user-grid">
        <div 
          v-for="user in users" 
          :key="user.id" 
          class="user-card"
          @click="viewUser(user.id)"
        >
          <div class="card-image">
            <img :src="getAvatar(user)" alt="avatar" />
          </div>
          <div class="card-footer">
            {{ user.username }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "@/utils/axios";
import { useRouter } from "vue-router";
import defaultUserIcon from '@/img/user_icon.png'; 

const users = ref([]);
const search = ref("");
const loading = ref(false);
const router = useRouter();

function logout() {
  if (confirm("ยืนยันการออกจากระบบ?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }
}

function getAvatar(user) {
  if (user.avatar_url && user.avatar_url.trim() !== "") {
    return user.avatar_url;
  }
  return defaultUserIcon;
}

async function fetchUsers() {
  loading.value = true;
  try {
    const res = await axios.get("/admin/users", {
      params: { search: search.value }
    });
    
    // กรอง admin ออกเหมือนเดิม
    users.value = res.data.filter(user => user.role !== 'admin');
    
  } catch (err) {
    console.error("Fetch Error:", err);
  } finally {
    loading.value = false;
  }
}

function viewUser(id) {
  router.push(`/admin/user/${id}`);
}

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
/* ธีมสีม่วง */
.admin-dashboard {
  min-height: 100vh;
  background-color: #D4C1EC; 
  font-family: 'Kanit', sans-serif;
  padding-bottom: 60px;
}

.navbar {
  background-color: #5D4970;
  color: white;
  padding: 15px 30px; /* เพิ่ม Padding Navbar */
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}

.logo span {
  font-size: 1.5rem; /* โลโก้ใหญ่ขึ้น */
}

.logo, .admin-profile {
  display: flex;
  align-items: center;
  gap: 15px;
  font-weight: bold;
  font-size: 1.1rem;
}

.nav-avatar {
  width: 50px; /* รูป admin มุมขวาใหญ่ขึ้น */
  height: 50px;
  border-radius: 50%;
  background: white;
  padding: 3px;
}

.logout-btn {
  margin-left: 20px;
  background-color: #ff6b6b;
  color: white;
  border: none;
  padding: 8px 18px; /* ปุ่มใหญ่ขึ้น */
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.2s;
}

.logout-btn:hover {
  background-color: #ee5253;
  transform: scale(1.05);
}

.content-container {
  padding: 30px 50px; /* ขอบข้างกว้างขึ้น */
}

.stats-row {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  background-color: #CE5BC2;
  color: black;
  padding: 30px; /* การ์ดสถิติใหญ่ขึ้น */
  border-radius: 20px;
  box-shadow: 0 6px 10px rgba(0,0,0,0.1);
  min-width: 250px;
}

.stat-card h3 {
  font-size: 1.2rem; /* หัวข้อสถิติใหญ่ขึ้น */
  margin-bottom: 10px;
}

.stat-number {
  font-size: 4rem; /* ตัวเลขสถิติใหญ่มาก */
  font-weight: bold;
  margin: 0;
}

.search-section {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 30px;
}

.search-bar {
  background: white;
  border-radius: 30px;
  padding: 10px 25px; /* ช่องค้นหาใหญ่ขึ้น */
  display: flex;
  align-items: center;
  width: 400px; /* กว้างขึ้น */
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.search-bar input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 1.2rem; /* ตัวหนังสือในช่องค้นหาใหญ่ขึ้น */
}

.search-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
}

/* 🔥 ปรับ Grid ให้ใหญ่สะใจ */
.user-grid {
  display: grid;
  /* minmax 300px คือการ์ดจะกว้างอย่างน้อย 300px */
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
  gap: 40px; /* ช่องว่างระหว่างการ์ดกว้างขึ้น */
}

.user-card {
  background: white;
  border-radius: 25px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);
}

.user-card:hover {
  transform: translateY(-10px);
}

/* 🔥 ปรับรูป Avatar ให้ใหญ่ */
.card-image {
  height: 250px; /* พื้นที่สีม่วงอ่อนสูงขึ้น */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f3e5f5;
}

.card-image img {
  width: 180px;  /* รูปใหญ่มาก */
  height: 180px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 6px 12px rgba(0,0,0,0.15);
}

/* 🔥 ปรับชื่อ User ด้านล่าง */
.card-footer {
  background-color: #B565A7;
  color: black;
  text-align: center;
  padding: 20px;
  font-weight: bold;
  font-size: 1.6rem; /* ตัวหนังสือชื่อใหญ่ชัดเจน */
}

.loading {
  text-align: center;
  font-size: 2rem;
  color: #5D4970;
  margin-top: 60px;
}
</style>