import { createRouter, createWebHistory } from "vue-router";

// Pages
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import Tracks from "../pages/Tracks.vue";
import Lesson from "../pages/Lesson.vue";
import Quiz from "../pages/Quiz.vue";
import TrackDetail from "../pages/TrackDetail.vue"; // ⚠️ ถ้ายังไม่มีไฟล์นี้ ให้ลบบรรทัดนี้ออกครับ
import Profile from "../pages/Profile.vue"; // ✅ เพิ่มหน้า Profile

// Admin Pages
import Admin from "../pages/Admin.vue";
import AdminUser from "../pages/AdminUser.vue";

const routes = [
  // --- Public ---
  { path: "/login", component: Login },
  { path: "/register", component: Register },

  // --- User General ---
  { path: "/tracks", component: Tracks },
  { path: "/track", component: TrackDetail },
  { path: "/lesson", component: Lesson },
  { path: "/quiz", component: Quiz },
  { path: "/profile", component: Profile }, // ✅ เพิ่ม Route นี้เพื่อให้เข้าหน้าโปรไฟล์ได้

  // --- Admin Zone ---
  { 
    path: "/admin/dashboard", 
    component: Admin,
    meta: { requiresAdmin: true } 
  },
  { 
    path: "/admin/user/:id", 
    component: AdminUser,
    meta: { requiresAdmin: true } 
  },

  // --- Redirects ---
  { path: "/", redirect: "/login" },
  { path: "/admin", redirect: "/admin/dashboard" }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

/* =========================
   AUTH GUARD (ระบบยามเฝ้าประตู)
   ========================= */
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  
  // ✅ ใช้ try-catch เพื่อป้องกันเว็บขาว ถ้าข้อมูลในเครื่องพัง
  let user = null;
  try {
    const userStr = localStorage.getItem("user");
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    console.error("User data corrupted, clearing...");
    localStorage.removeItem("user"); // ลบข้อมูลเสียทิ้ง
  }

  // 1. ถ้าไม่มี Token และพยายามเข้าหน้าอื่นที่ไม่ใช่ Login/Register -> เตะไป Login
  if (!token && !["/login", "/register"].includes(to.path)) {
    return next("/login");
  }

  // 2. ถ้ามี Token แล้ว แต่พยายามเข้าหน้า Login/Register -> เตะไปหน้าหลัก
  if (token && ["/login", "/register"].includes(to.path)) {
     if (user && user.role === 'admin') {
         return next("/admin/dashboard");
     }
    return next("/tracks");
  }

  // 3. เช็คสิทธิ์ Admin
  if (to.meta.requiresAdmin) {
    if (!user || user.role !== 'admin') {
      alert("⛔ คุณไม่มีสิทธิ์เข้าถึงหน้านี้!"); 
      return next("/tracks"); 
    }
  }

  next();
});

export default router;