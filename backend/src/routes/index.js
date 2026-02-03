import { createRouter, createWebHistory } from "vue-router";


// 1. นำเข้า Component (หน้าเว็บต่างๆ)
// กลุ่ม Pages ทั่วไป (User ใช้งาน)
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import Tracks from "../pages/Tracks.vue";
import Lesson from "../pages/Lesson.vue";
import Profile from "../pages/Profile.vue"; 
import Quiz from "../pages/Quiz.vue";       

// กลุ่ม Admin Pages (เฉพาะผู้ดูแลระบบ)
//ตรงนี้ชี้ไปที่โฟลเดอร์ pages โดยตรงตามโครงสร้างไฟล์จริง
import AdminDashboard from "../pages/Admin.vue";       
import AdminUserDetail from "../pages/AdminUser.vue";  


// 2. กำหนดเส้นทาง 
const routes = [
  // --- Public Zone (ใครก็เข้าได้ แต่ถ้าล็อกอินแล้วจะถูกดีดออก) ---
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  
  // --- User Zone (ต้องล็อกอินถึงจะเข้าได้) ---
  { path: "/tracks", component: Tracks },
  { path: "/lesson", component: Lesson },
  { path: "/profile", component: Profile }, 
  { path: "/quiz", component: Quiz },

  // --- Admin Zone (ต้องเป็น Admin เท่านั้น) ---
  { 
    path: "/admin/dashboard", 
    component: AdminDashboard,
    // meta: คือข้อมูลพิเศษที่เราแปะไว้บอก Router ว่า "หน้านี้มีความลับนะ"
    // เราจะเอาค่า requiresAdmin ไปเช็คใน router.beforeEach ด้านล่าง
    meta: { requiresAdmin: true } 
  },
  { 
    path: "/admin/user/:id", 
    component: AdminUserDetail,
    meta: { requiresAdmin: true } //ล็อกสิทธิ์เหมือนกัน
  },

  // --- Redirect Logic ---
  // ถ้าเข้าหน้าแรก (/) ให้ส่งไปหน้า Login ก่อน
  { path: "/", redirect: "/login" },
  // กันคนพิมพ์ /admin เฉยๆ แล้วไม่รู้จะไปไหน ให้ดีดเข้า dashboard
  { path: "/admin", redirect: "/admin/dashboard" }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});


// 3. Navigation Guard (ด่านตรวจคนเข้าเมือง) 
// ฟังก์ชันนี้จะทำงาน **ทุกครั้ง** ก่อนที่จะมีการเปลี่ยนหน้า (User คลิก Link หรือพิมพ์ URL)
// to = จะไปไหน, from = มาจากไหน, next = อนุญาตให้ไปต่อ หรือสั่งเปลี่ยนเส้นทาง
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token"); // บัตรผ่าน (Token)
  
  // Safe Parse User Data: พยายามแกะข้อมูล User จาก LocalStorage
  // ต้องใช้ try-catch เพราะถ้าข้อมูลพัง (เช่น userที่เป็นจามยุทธเก่าจากแดนไกล ไปแก้เล่น) เว็บจะได้ไม่ขาวโพลน (Crash)
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user")) || {};
  } catch (e) {
    user = {};
  }

  // Case 1 คนแปลกหน้า (ไม่มี Token) พยายามเข้าหน้าข้างใน
  // ถ้าไม่มี Token และหน้าที่พยายามจะไป ไม่ใช่หน้า Login หรือ Register
  // -> ดีดกลับไป Login เดี๋ยวนี้! ออกไป๊
  if (!token && !["/login", "/register"].includes(to.path)) {
    return next("/login");
  }


  // Case 2 คนใน (มี Token แล้ว) พยายามเข้าหน้า Login/Register ซ้ำ
  // ถ้าล็อกอินอยู่แล้ว ไม่ควรเห็นหน้า Login อีก
  // -> ให้ดีดไปหน้าหลักของแต่ละ Role แทน ออกไป๊
  if (token && ["/login", "/register"].includes(to.path)) {
    if (user.role === 'admin') {
      return next("/admin/dashboard"); // แอดมินไปหลังบ้าน
    } else {
      return next("/tracks");          // ยูสเซอร์ไปหน้าบทเรียน
    }
  }

  // Case 3 การตรวจสอบสิทธิ์ Admin จอมยุทธระดับเซียนเท่านั้น
  // เช็คจาก meta ที่เราแปะไว้ตอนประกาศ routes ข้างบน
  if (to.meta.requiresAdmin) {
    // ถ้า role ไม่ใช่ admin
    if (user.role !== 'admin') {
      alert(" คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
      return next("/tracks"); // ดีดกลับไปที่ชอบที่ชอบ
    }
  }

  //  ผ่านทุกด่าน: อนุญาตให้เข้าหน้านั้นได้
  next();
});

export default router;