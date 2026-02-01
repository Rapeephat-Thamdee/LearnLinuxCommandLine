<template>
  <router-view />
</template>

<script setup>
</script>

<style>
/* Reset ค่าพื้นฐานของ Browser */
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  min-height: 100vh;
}

/* สั่งให้ App ของเรายืดเต็มจอแน่นอน */
#app {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  display: block; /* สำคัญ: ป้องกันไม่ให้มันจัดกลางแบบ Flex */
}
</style>