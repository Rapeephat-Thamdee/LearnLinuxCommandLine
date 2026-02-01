import { createRouter, createWebHistory } from "vue-router";

// Pages General
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import Tracks from "../pages/Tracks.vue";
import Lesson from "../pages/Lesson.vue";
import Profile from "../pages/Profile.vue"; // ✅ หน้า Profile
import Quiz from "../pages/Quiz.vue";       // ✅ หน้า Quiz

// Admin Pages
// ⚠️ แก้ Path ตรงนี้: ให้ชี้ไปที่ไฟล์ Admin.vue และ AdminUser.vue ในโฟลเดอร์ pages โดยตรง
import AdminDashboard from "../pages/Admin.vue";       
import AdminUserDetail from "../pages/AdminUser.vue";  

const routes = [
  // --- Public ---
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  
  // --- User General ---
  { path: "/tracks", component: Tracks },
  { path: "/lesson", component: Lesson },
  { path: "/profile", component: Profile }, 
  { path: "/quiz", component: Quiz },

  // --- Admin Zone ---
  { 
    path: "/admin/dashboard", 
    component: AdminDashboard,
    meta: { requiresAdmin: true } // 🔒 ต้องเป็น Admin
  },
  { 
    path: "/admin/user/:id", 
    component: AdminUserDetail,
    meta: { requiresAdmin: true } 
  },

  // Default Redirect
  { path: "/", redirect: "/login" },
  // กันคนพิมพ์ /admin เล่นๆ ให้ดีดไป dashboard
  { path: "/admin", redirect: "/admin/dashboard" }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 🛡️ Navigation Guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  
  // Safe Parse User Data
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user")) || {};
  } catch (e) {
    user = {};
  }

  // 1. ไม่มี Token และพยายามเข้าหน้าอื่นที่ไม่ใช่ Login/Register -> ไป Login
  if (!token && !["/login", "/register"].includes(to.path)) {
    return next("/login");
  }

  // 2. มี Token แล้ว แต่อยากกลับไป Login/Register -> ดีดไปหน้าหลัก
  if (token && ["/login", "/register"].includes(to.path)) {
    if (user.role === 'admin') {
      return next("/admin/dashboard");
    } else {
      return next("/tracks");
    }
  }

  // 3. เช็คสิทธิ์ Admin
  if (to.meta.requiresAdmin) {
    if (user.role !== 'admin') {
      alert("⛔ คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
      return next("/tracks");
    }
  }

  // ผ่าน ✅
  next();
});

export default router;