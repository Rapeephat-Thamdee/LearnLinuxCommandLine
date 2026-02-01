<template>
  <div class="page">
    <div class="quiz-container">
      
      <div v-if="loading" class="loading-box">
        <div class="spinner"></div>
        <p>กำลังโหลดข้อสอบ...</p>
      </div>

      <div v-else-if="result" class="result-card">
        <div class="mascot-wrapper">
          <img :src="getMascot(trackId)" class="mascot-img" />
        </div>
        
        <h2>🎯 ผลการทดสอบ</h2>
        
        <div class="score-circle">
          <span class="score">{{ result.score }}</span>
          <span class="divider">/</span>
          <span class="total">{{ result.total }}</span>
        </div>
        
        <p class="percent-text">
          คุณทำได้ <strong>{{ result.percent }}%</strong>
        </p>

        <button class="btn-back" @click="goBack">
          ⬅ กลับไปหน้าเลือกบทเรียน
        </button>
      </div>

      <div v-else-if="current" class="question-card">
        <div class="quiz-header">
          <div class="info">
            <span class="badge">ข้อที่ {{ currentIndex + 1 }}</span>
            <span class="total-badge">จาก {{ questions.length }}</span>
          </div>
          <div class="progress-bar-bg">
            <div 
              class="progress-bar-fill" 
              :style="{ width: ((currentIndex + 1) / questions.length) * 100 + '%' }"
            ></div>
          </div>
        </div>

        <h2 class="question-text">
          {{ current.question }}
        </h2>

        <div class="choices-grid">
          <div
            v-for="(choice, i) in current.choices"
            :key="i"
            class="choice-item"
            :class="{ 'selected': answers[current.id] === i }"
            @click="selectAnswer(current.id, i)"
          >
            <div class="choice-marker">{{ ['A', 'B', 'C', 'D'][i] }}</div>
            <div class="choice-text">{{ choice }}</div>
          </div>
        </div>

        <div class="footer-actions">
          <button
            class="btn-next"
            :disabled="answers[current.id] === undefined"
            @click="next"
          >
            {{ isLast ? "📤 ส่งคำตอบ" : "ข้อถัดไป ➡" }}
          </button>
        </div>
      </div>

      <div v-else class="error-box">
        <div class="error-icon">❌</div>
        <p>ไม่พบข้อมูลคำถาม</p>
        <p style="font-size: 0.8rem; color: #888;">(Track: {{ trackId }}, Mode: {{ difficulty }})</p>
        <button class="btn-back-small" @click="goBack">กลับหน้าหลัก</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "@/utils/axios";

// Import รูป Mascot
import imgBeginner from '@/img/Beginner.png';
import imgIntermediate from '@/img/intermediat.png';
import imgAdvanced from '@/img/advanced.png';

const route = useRoute();
const router = useRouter();

// ✅ 1. Load User Safely
let user = { id: 999, username: "Guest" };
try {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    user = JSON.parse(storedUser);
  }
} catch (e) {
  console.error("Error parsing user:", e);
}
const userId = user?.id;

/* =========================
   PARAMS & STATE
   ========================= */
const trackId = Number(route.query.track) || 1;

// ✅ 2. เพิ่ม Map Difficulty: เพื่อให้ Track 2 เลือกข้อสอบ Medium อัตโนมัติ
const difficultyMap = {
  1: "easy",
  2: "medium",
  3: "hard"
};
const difficulty = route.query.difficulty || difficultyMap[trackId] || "easy";

const questions = ref([]);
const currentIndex = ref(0);
const answers = ref({});
const loading = ref(true);
const result = ref(null);

/* =========================
   COMPUTED
   ========================= */
const current = computed(() => {
  if (!questions.value || questions.value.length === 0) return null;
  return questions.value[currentIndex.value];
});

const isLast = computed(() => {
  return questions.value && currentIndex.value === questions.value.length - 1;
});

/* =========================
   FUNCTIONS
   ========================= */
function getMascot(id) {
  if (id === 1) return imgBeginner;
  if (id === 2) return imgIntermediate;
  if (id === 3) return imgAdvanced;
  return imgBeginner;
}

function selectAnswer(questionId, choiceIndex) {
  answers.value[questionId] = choiceIndex;
}

onMounted(async () => {
  console.log(`🚀 Quiz Mounted. Track: ${trackId}, Diff: ${difficulty}`);
  
  try {
    // ส่ง difficulty ที่ถูกต้องไปดึงโจทย์
    const res = await axios.get(`/quiz/${trackId}?difficulty=${difficulty}`);
    
    if (Array.isArray(res.data) && res.data.length > 0) {
      questions.value = res.data;
    } else {
      console.warn("API returned empty data");
    }
  } catch (err) {
    console.warn("Fetch Error:", err);
    alert("ไม่สามารถโหลดข้อสอบได้");
  } finally {
    loading.value = false;
  }
});

async function next() {
  if (!isLast.value) {
    currentIndex.value++;
    return;
  }

  // เริ่มกระบวนการส่งคำตอบ
  loading.value = true;
  
  try {
    // ✅ 3. ดึง Token เพื่อแก้ปัญหา Invalid Token
    const token = localStorage.getItem("token");
    if (!token) {
      alert("กรุณาเข้าสู่ระบบก่อนส่งคำตอบ");
      router.push("/login");
      return;
    }

    const payload = {
      trackId, 
      difficulty, // ส่ง difficulty ไปด้วย
      userId: user.id,
      answers: Object.entries(answers.value).map(([id, choice]) => ({
        id: Number(id), 
        choice: Number(choice)
      }))
    };

    // ✅ 4. แนบ Header Authorization
    const res = await axios.post("/quiz/submit", payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    result.value = res.data;

  } catch (err) {
    console.error("Submit Error:", err);
    // แสดง Error ที่ชัดเจนขึ้น
    const msg = err.response?.data?.error || "ส่งคำตอบไม่สำเร็จ";
    alert(`เกิดข้อผิดพลาด: ${msg}`);

    // ถ้า Token หมดอายุ ให้เด้งไป Login
    if (err.response?.status === 401 || err.response?.status === 403) {
      router.push("/login");
    }
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push("/tracks");
}
</script>

<style scoped>
/* พื้นหลังม่วง Theme หลัก */
.page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #D4C1EC 0%, #F3E5F5 100%);
  padding: 20px;
  font-family: 'Kanit', sans-serif;
}

.quiz-container {
  width: 100%;
  max-width: 600px;
}

/* --- QUESTION CARD --- */
.question-card {
  background: white;
  border-radius: 24px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  animation: slideUp 0.4s ease-out;
}

.quiz-header {
  margin-bottom: 25px;
}

.info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: bold;
  color: #5D4970;
}

.badge {
  background: #E6C8E0;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
}

.progress-bar-bg {
  height: 8px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #5D4970;
  transition: width 0.3s ease;
}

.question-text {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 30px;
  line-height: 1.4;
}

/* Choices */
.choices-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: #f9f9f9;
  border: 2px solid transparent;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.choice-item:hover {
  background: #fff;
  border-color: #D4C1EC;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

.choice-item.selected {
  background: #5D4970;
  border-color: #5D4970;
  color: white;
  transform: scale(1.02);
}

.choice-marker {
  width: 30px;
  height: 30px;
  background: rgba(0,0,0,0.1);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 15px;
  font-weight: bold;
  font-size: 0.9rem;
}

.choice-item.selected .choice-marker {
  background: rgba(255,255,255,0.2);
  color: white;
}

/* Buttons */
.footer-actions {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
}

.btn-next {
  background: #5D4970;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(93, 73, 112, 0.3);
}

.btn-next:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-next:hover:not(:disabled) {
  transform: translateY(-2px);
  background: #4a3b59;
}

/* --- RESULT CARD --- */
.result-card {
  background: white;
  border-radius: 30px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 15px 50px rgba(0,0,0,0.15);
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.mascot-wrapper {
  margin-bottom: 20px;
}
.mascot-img {
  height: 150px;
  object-fit: contain;
}

.score-circle {
  width: 150px;
  height: 150px;
  background: #5D4970;
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px auto;
  box-shadow: 0 10px 20px rgba(93, 73, 112, 0.4);
}

.score { font-size: 3.5rem; font-weight: bold; }
.divider { font-size: 2rem; margin: 0 5px; opacity: 0.7; }
.total { font-size: 1.5rem; opacity: 0.7; }

.percent-text {
  font-size: 1.2rem;
  margin-bottom: 30px;
  color: #555;
}

.btn-back {
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

/* ERROR BOX */
.error-box {
  text-align: center;
  color: #5D4970;
  font-weight: bold;
}
.error-icon {
    font-size: 3rem;
    margin-bottom: 10px;
}
.btn-back-small {
  margin-top: 15px;
  padding: 8px 20px;
  background: #ddd;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  color: #555;
  transition: 0.2s;
}
.btn-back-small:hover {
    background: #ccc;
}

/* Loading */
.loading-box {
  text-align: center;
  color: #5D4970;
  font-size: 1.2rem;
  font-weight: bold;
}
.spinner {
  width: 40px; height: 40px;
  border: 4px solid #E6C8E0;
  border-top: 4px solid #5D4970;
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 1s linear infinite;
}

/* Animations */
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes popIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
</style>