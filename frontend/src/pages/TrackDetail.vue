<template>
  <div class="page">
    <div class="card" v-if="track">
      <div class="image-container">
        <img :src="getTrackImage(track.id)" class="mascot-img" />
      </div>

      <div class="content">
        <h1 class="title">{{ track.title }}</h1>

        <div class="desc-box">
          <p>{{ track.description }}</p>
        </div>

        <div class="level-info">
          <div class="info-item">
            <span class="icon"></span>
            <span>จำนวนบทเรียน: <strong>{{ lessonCount }} บท</strong></span>
          </div>
          <div class="info-item">
            <span class="icon">⏱️</span>
            <span>เวลาเรียนโดยประมาณ: <strong>15 นาที</strong></span>
          </div>
        </div>

        <div class="actions">
          <button class="btn-back" @click="goBack">
            ⬅ กลับ
          </button>

          <button class="btn-start" @click="startLearning">
            เริ่มเรียนเลย!
          </button>
        </div>
      </div>
    </div>

    <div v-else class="loading-container">
      <div class="loading-text"> กำลังโหลดข้อมูล...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "@/utils/axios";

// ✅ Import รูปภาพ (ใช้ path เดียวกับหน้า Tracks)
import imgBeginner from '@/img/Beginner.png';
import imgIntermediate from '@/img/intermediat.png';
import imgAdvanced from '@/img/advanced.png';

const route = useRoute();
const router = useRouter();
const trackId = Number(route.query.track);

const track = ref(null);
const lessonCount = ref(0);

// ฟังก์ชันเลือกรูปภาพ
function getTrackImage(id) {
  if (id === 1) return imgBeginner;
  if (id === 2) return imgIntermediate;
  if (id === 3) return imgAdvanced;
  return imgBeginner;
}

/* =========================
   LOAD DATA
   ========================= */
onMounted(async () => {
  try {
    const trackRes = await axios.get("/tracks");
    track.value = trackRes.data.find(t => t.id === trackId);

    const lessonRes = await axios.get(`/lessons/${trackId}`);
    lessonCount.value = lessonRes.data.length;
  } catch (err) {
    console.error("LOAD TRACK DETAIL ERROR:", err);
  }
});

/* =========================
   ACTIONS
   ========================= */
function startLearning() {
  router.push(`/lesson?track=${trackId}`);
}

function goBack() {
  router.push("/tracks");
}
</script>

<style scoped>
/* พื้นหลังธีมสีม่วง */
.page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #D4C1EC 0%, #F3E5F5 100%);
  padding: 20px;
}

/* การ์ดหลัก */
.card {
  background: white;
  width: 100%;
  /* 🔥 ปรับให้ใหญ่ขึ้นเป็น 600px */
  max-width: 600px; 
  border-radius: 30px;
  box-shadow: 0 15px 40px rgba(0,0,0,0.15);
  overflow: hidden;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* ส่วนรูปภาพ */
.image-container {
  background: rgba(0,0,0,0.03);
  padding: 40px; /* เพิ่ม Padding */
  display: flex;
  justify-content: center;
  align-items: center;
}

.mascot-img {
  /* 🔥 ขยายรูปให้ใหญ่ขึ้น */
  height: 250px; 
  object-fit: contain;
  filter: drop-shadow(0 8px 20px rgba(0,0,0,0.1));
  transition: transform 0.3s;
}

.card:hover .mascot-img {
  transform: scale(1.05) rotate(-3deg);
}

/* ส่วนเนื้อหา */
.content {
  padding: 40px; /* เพิ่ม Padding เนื้อหา */
  text-align: center;
}

.title {
  margin: 0 0 20px;
  color: #5D4970;
  /* 🔥 เพิ่มขนาดฟอนต์หัวข้อ */
  font-size: 2.5rem; 
  text-transform: uppercase;
}

.desc-box {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 25px;
}

.desc-box p {
  margin: 0;
  /* 🔥 เพิ่มขนาดฟอนต์เนื้อหา */
  font-size: 1.1rem; 
  color: #555;
  line-height: 1.7;
}

/* ข้อมูลสถิติ */
.level-info {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 35px;
  font-size: 1.1rem; /* เพิ่มขนาดฟอนต์ */
  color: #777;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item strong {
  color: #5D4970;
}

/* ปุ่มกด */
.actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.btn-back {
  padding: 15px 30px; /* ปุ่มใหญ่ขึ้น */
  border: 2px solid #ddd;
  background: white;
  color: #777;
  border-radius: 40px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.1rem;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f0f0f0;
  border-color: #ccc;
}

.btn-start {
  padding: 15px 40px; /* ปุ่มใหญ่ขึ้น */
  background: #5D4970; /* สีม่วงธีมหลัก */
  color: white;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.1rem;
  box-shadow: 0 4px 15px rgba(93, 73, 112, 0.4);
  transition: all 0.2s;
  flex-grow: 1; /* ให้ปุ่มเริ่มเรียนยาวกว่า */
}

.btn-start:hover {
  background: #4a3b59;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(93, 73, 112, 0.6);
}

/* Loading */
.loading-container {
  text-align: center;
}
.loading-text {
  font-size: 1.8rem;
  font-weight: bold;
  color: #5D4970;
}
</style>