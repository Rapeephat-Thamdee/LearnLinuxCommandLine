<template>
  <div class="page">
    <div class="lesson-panel">
      <div class="header-box">
        <h1>🐧 Learn Linux Command Line</h1>
        
        <div class="progress-container">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" :style="{ width: percent + '%' }"></div>
          </div>
          <div class="progress-text">
            <span>ภารกิจ: <strong>{{ percent }}%</strong></span>
            <span>({{ progress.current }} / {{ progress.total }})</span>
          </div>
        </div>
      </div>

      <transition name="fade" mode="out-in">
        <div v-if="lesson" :key="lesson.id" class="lesson-card">
          <div class="lesson-badge">บทที่ {{ lessonIndex + 1 }}</div>
          <h2>{{ lesson.title }}</h2>
          
          <div class="instruction-box">
            <div class="content-text">{{ lesson.content }}</div>
            
            <div class="hint-box" v-if="lesson.command_hint">
               👉 ลองพิมพ์: <code>{{ lesson.command_hint }}</code>
            </div>
          </div>

          <transition name="bounce">
            <div v-if="passed" class="pass-notification">✅ เยี่ยมมาก! ผ่านแล้ว</div>
          </transition>
        </div>

        <div v-else-if="finished" class="finished-card">
          <div class="congrats-icon">🎉</div>
          <h2>ยินดีด้วย! เรียนครบแล้ว</h2>
          <div class="actions">
            <button class="btn-quiz" @click="goQuiz">📝 ทำแบบทดสอบ</button>
            <button class="btn-reset" @click="resetProgress">🔄 เริ่มใหม่</button>
          </div>
        </div>
      </transition>
    </div>

    <div class="terminal-wrapper">
      <div class="terminal-window" @click="focusInput">
        <div class="terminal-header">
          <div class="dots">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <div class="title">user@linux-lab:~</div>
        </div>

        <div ref="outputRef" class="output-area">
          <div class="welcome-msg">Welcome to Linux Lab Terminal v1.0</div>
          
          <div v-for="(line, i) in history" :key="i" class="line-item">
            <div class="cmd">
              <span class="prompt">user@linux:~$</span> {{ line.command }}
            </div>
            <pre class="out">{{ line.output }}</pre>
          </div>
        </div>

        <div class="input-area">
          <span class="prompt-input">user@linux:~$</span>
          <input
            ref="inputRef" 
            v-model="input"
            @keyup.enter="runCommand"
            class="cmd-input"
            placeholder="..."
            autofocus
            autocomplete="off"
            spellcheck="false"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "@/utils/axios";

const router = useRouter();
const route = useRoute();
const user = JSON.parse(localStorage.getItem("user"));
const userId = user?.id;
if (!userId) router.replace("/login");

const trackId = Number(route.query.track) || Number(localStorage.getItem("trackId")) || 1;

// STATE
const lessons = ref([]);
const lessonIndex = ref(0);
const lesson = ref(null);
const input = ref("");
const history = ref([]);
const outputRef = ref(null);
const inputRef = ref(null);
const passed = ref(false);
const finished = ref(false);
const progress = ref({ current: 0, total: 0 });

const percent = computed(() =>
  progress.value.total
    ? Math.floor((progress.value.current / progress.value.total) * 100)
    : 0
);

function focusInput() {
  if(inputRef.value) {
    inputRef.value.focus();
  }
}

function syncLesson() {
  lessonIndex.value = Number(progress.value.current || 0);
  if (lessonIndex.value >= lessons.value.length && lessons.value.length > 0) {
    finished.value = true;
    lesson.value = null;
  } else {
    finished.value = false;
    lesson.value = lessons.value[lessonIndex.value];
  }
  nextTick(() => focusInput());
}

function scrollToBottom() {
  nextTick(() => {
    if (outputRef.value) {
      outputRef.value.scrollTop = outputRef.value.scrollHeight;
    }
  });
}

onMounted(async () => {
  try {
    const lessonRes = await axios.get(`/lessons/${trackId}`);
    lessons.value = lessonRes.data;

    if (!lessons.value || lessons.value.length === 0) {
      console.warn("No lessons found");
      return;
    }

    const progressRes = await axios.get(`/terminal/progress/${userId}/${trackId}`);
    progress.value = {
      current: Number(progressRes.data.current || 0),
      total: lessons.value.length
    };

    syncLesson();
    focusInput();
  } catch (err) {
    console.error("❌ LOAD ERROR:", err);
  }
});

async function runCommand() {
  if (!input.value) return;
  const cmd = input.value;

  try {
    const res = await axios.post("/terminal/execute", {
      command: cmd,
      userId,
      trackId
    });

    history.value.push({
      command: cmd,
      output: res.data.output
    });

    progress.value = res.data.progress;
    scrollToBottom();

    if (res.data.pass) {
      passed.value = true;
      setTimeout(() => {
        passed.value = false;
        syncLesson();
      }, 1000);
    }
  } catch {
    history.value.push({ command: cmd, output: "❌ Server error" });
  }
  input.value = "";
  focusInput();
}

async function resetProgress() {
  if(!confirm("ยืนยันการเริ่มใหม่?")) return;
  await axios.post(`/terminal/reset/${userId}/${trackId}`);
  progress.value.current = 0;
  history.value = [];
  finished.value = false;
  syncLesson();
}

function goQuiz() {
  router.push(`/quiz?track=${trackId}`);
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Kanit:wght@300;400;600&display=swap');

.page {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  font-family: 'Kanit', sans-serif;
  background-color: #f0f2f5;
}

/* LEFT PANEL */
.lesson-panel {
  width: 40%;
  padding: 30px;
  background: linear-gradient(135deg, #D4C1EC 0%, #E6C8E0 100%);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  border-right: 1px solid rgba(0,0,0,0.1);
}
.header-box h1 { color: #5D4970; font-size: 1.8rem; margin-bottom: 20px; }
.progress-container { margin-bottom: 30px; background: rgba(255, 255, 255, 0.6); padding: 15px; border-radius: 12px; }
.progress-bar-bg { height: 10px; background: #e0e0e0; border-radius: 5px; overflow: hidden; margin-bottom: 8px; }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%); transition: width 0.5s; }
.progress-text { display: flex; justify-content: space-between; font-size: 0.9rem; color: #555; }
.lesson-card, .finished-card { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); position: relative; }
.lesson-badge { display: inline-block; background: #5D4970; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; margin-bottom: 10px; }

/* ✅ CSS สำหรับแสดง Content สวยๆ */
.instruction-box { 
  background: #f9f9f9; 
  padding: 20px; 
  border-left: 5px solid #5D4970; 
  border-radius: 8px; 
  color: #444; 
  margin-top: 15px;
}
.content-text {
  font-size: 1.1rem;
  line-height: 1.8;
  white-space: pre-wrap; /* ✅ สำคัญมาก: ทำให้ \n ขึ้นบรรทัดใหม่ */
}

/* ✅ CSS สำหรับ Hint */
.hint-box {
  margin-top: 20px;
  background: #eee;
  padding: 10px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #555;
  display: flex;
  align-items: center;
  gap: 10px;
}
.hint-box code {
  background: #333;
  color: #0f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Fira Code', monospace;
}

.pass-notification { margin-top: 20px; background: #d4edda; color: #155724; padding: 15px; border-radius: 10px; text-align: center; font-weight: bold; animation: bounceIn 0.5s; }
.actions { margin-top: 20px; display: flex; flex-direction: column; gap: 10px; }
.btn-quiz, .btn-reset { padding: 12px; border-radius: 10px; border: none; font-weight: bold; cursor: pointer; font-family: 'Kanit', sans-serif; }
.btn-quiz { background: #5D4970; color: white; }
.btn-reset { background: white; border: 2px solid #ddd; color: #666; }

/* RIGHT PANEL */
.terminal-wrapper {
  width: 60%;
  background: #282c34;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.terminal-window {
  width: 100%; height: 100%; background: #1e1e1e; border-radius: 10px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5); display: flex; flex-direction: column;
  overflow: hidden; font-family: 'Fira Code', monospace;
  cursor: text;
}
.terminal-header { background: #333; padding: 10px 15px; display: flex; align-items: center; position: relative; }
.dots { display: flex; gap: 8px; }
.dot { width: 12px; height: 12px; border-radius: 50%; }
.red { background: #ff5f56; } .yellow { background: #ffbd2e; } .green { background: #27c93f; }
.title { position: absolute; width: 100%; text-align: center; color: #999; font-size: 0.8rem; pointer-events: none; left: 0; }

.output-area { flex: 1; padding: 15px; overflow-y: auto; color: #f0f0f0; font-size: 1rem; }
.welcome-msg { color: #777; margin-bottom: 10px; }
.line-item { margin-bottom: 8px; }
.prompt { color: #27c93f; font-weight: bold; margin-right: 8px; }
.out { color: #ccc; margin-left: 0; margin-top: 4px; white-space: pre-wrap; font-family: 'Fira Code', monospace; }

.input-area { background: #1e1e1e; padding: 15px; display: flex; align-items: center; border-top: 1px solid #333; }
.prompt-input { color: #27c93f; font-weight: bold; margin-right: 10px; }
.cmd-input { background: transparent; border: none; color: #fff; font-family: 'Fira Code', monospace; font-size: 1rem; flex: 1; outline: none; }

/* Animation */
@keyframes bounceIn { 0% { transform: scale(0.9); opacity: 0; } 50% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>