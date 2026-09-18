<template>
  <div class="container">
    <div class="card">
      <header class="header">
        <h1>🐶 สุ่มรูปน้องหมา</h1>
        <p class="subtitle">
          ตัวอย่างโปรเจกต์ Vue 3 ดึงข้อมูลจาก Dog CEO API อย่างง่าย
        </p>
      </header>

      <div class="content">
        <!-- สถานะกำลังโหลด -->
        <div v-if="loading" class="loading-box">
          <div class="spinner"></div>
          <p>กำลังค้นหาน้องหมาาาา...</p>
        </div>

        <!-- สถานะเกิดข้อผิดพลาด -->
        <div v-else-if="error" class="error-box">
          <p>⚠️ {{ error }}</p>
          <button class="btn btn-secondary" @click="fetchDogImage">
            ลองใหม่อีกครั้ง
          </button>
        </div>

        <!-- แสดงรูปภาพเมื่อโหลดเสร็จ -->
        <div v-else class="image-wrapper">
          <img
            :src="imageUrl"
            alt="Random Dog"
            class="dog-image"
            @error="handleImageError"
          />
          <div v-if="breedName" class="breed-badge">
            สายพันธุ์: <strong>{{ breedName }}</strong>
          </div>
        </div>

        <!-- ปุ่มกดสุ่มรูปภาพ -->
        <div class="action-area">
          <button
            class="btn btn-primary"
            :disabled="loading"
            @click="fetchDogImage"
          >
            <span v-if="loading">กำลังโหลด...</span>
            <span v-else>เปลี่ยนรูปน้องหมา 🐾</span>
          </button>
        </div>
      </div>
      <footer class="footer">
        Powered by
        <a href="https://dog.ceo/dog-api/" target="_blank" rel="noopener"
          >Dog CEO API</a
        >
      </footer>
      <footer class="footer">
        Powered by
        <a href="https://dog.ceo/dog-api/" target="_blank" rel="noopener"
          >Dog CEO API</a
        >
      </footer>
      <footer class="footer">
        Powered by
        <a href="https://dog.ceo/dog-api/" target="_blank" rel="noopener"
          >Dog CEO API</a
        >
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const imageUrl = ref("");
const breedName = ref("");
const loading = ref(false);
const error = ref("");

// ฟังก์ชันแกะชื่อสายพันธุ์จาก URL ของ Dog CEO API
const extractBreed = (url) => {
  try {
    const parts = url.split("/breeds/")[1];
    if (!parts) return "";
    const breedSlug = parts.split("/")[0];
    // แปลง sub-breed หรือชื่อ เช่น "hound-afghan" -> "Afghan Hound"
    const subParts = breedSlug.split("-");
    if (subParts.length > 1) {
      return `${capitalize(subParts[1])} ${capitalize(subParts[0])}`;
    }
    return capitalize(breedSlug);
  } catch {
    return "";
  }
};

const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// ฟังก์ชันดึงรูปสุนัขจาก Dog CEO API
const fetchDogImage = async () => {
  loading.value = true;
  error.value = "";
  try {
    const response = await fetch("https://dog.ceo/api/breeds/image/random");
    if (!response.ok) {
      throw new Error(`โหลดไม่สำเร็จ (Status: ${response.status})`);
    }
    const data = await response.json();
    if (data.status === "success") {
      imageUrl.value = data.message;
      breedName.value = extractBreed(data.message);
    } else {
      throw new Error("ไม่สามารถดึงรูปภาพได้");
    }
  } catch (err) {
    error.value = err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ";
  } finally {
    loading.value = false;
  }
};

const handleImageError = () => {
  error.value = "ไม่สามารถแสดงรูปภาพได้ โปรดกดสุ่มใหม่";
};

// เรียกดึงรูปทันทีเมื่อเปิดเว็บ
onMounted(() => {
  fetchDogImage();
});
</script>
