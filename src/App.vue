<template>
  <div class="container">
    <div class="card">
      <header class="header">
        <h1>🐶 สุ่มรูปน้องหมา</h1>
        <p class="subtitle">ตัวอย่างโปรเจกต์ Vue 3 ดึงข้อมูลจาก Dog CEO API อย่างง่าย</p>
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
          <button class="btn btn-secondary" @click="fetchDogImage">ลองใหม่อีกครั้ง</button>
        </div>

        <!-- แสดงรูปภาพเมื่อโหลดเสร็จ -->
        <div v-else class="image-wrapper">
          <img :src="imageUrl" alt="Random Dog" class="dog-image" @error="handleImageError" />
          <div v-if="breedName" class="breed-badge">
            สายพันธุ์: <strong>{{ breedName }}</strong>
          </div>
        </div>

        <!-- ปุ่มกดสุ่มรูปภาพ -->
        <div class="action-area">
          <button class="btn btn-primary" :disabled="loading" @click="fetchDogImage">
            <span v-if="loading">กำลังโหลด...</span>
            <span v-else>เปลี่ยนรูปน้องหมา 🐾</span>
          </button>
        </div>
      </div>

      <footer class="footer">
        Powered by <a href="https://dog.ceo/dog-api/" target="_blank" rel="noopener">Dog CEO API</a>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const imageUrl = ref('')
const breedName = ref('')
const loading = ref(false)
const error = ref('')

// ฟังก์ชันแกะชื่อสายพันธุ์จาก URL ของ Dog CEO API
const extractBreed = (url) => {
  try {
    const parts = url.split('/breeds/')[1]
    if (!parts) return ''
    const breedSlug = parts.split('/')[0]
    // แปลง sub-breed หรือชื่อ เช่น "hound-afghan" -> "Afghan Hound"
    const subParts = breedSlug.split('-')
    if (subParts.length > 1) {
      return `${capitalize(subParts[1])} ${capitalize(subParts[0])}`
    }
    return capitalize(breedSlug)
  } catch {
    return ''
  }
}

const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ฟังก์ชันดึงรูปสุนัขจาก Dog CEO API
const fetchDogImage = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch('https://dog.ceo/api/breeds/image/random')
    if (!response.ok) {
      throw new Error(`โหลดไม่สำเร็จ (Status: ${response.status})`)
    }
    const data = await response.json()
    if (data.status === 'success') {
      imageUrl.value = data.message
      breedName.value = extractBreed(data.message)
    } else {
      throw new Error('ไม่สามารถดึงรูปภาพได้')
    }
  } catch (err) {
    error.value = err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'
  } finally {
    loading.value = false
  }
}

const handleImageError = () => {
  error.value = 'ไม่สามารถแสดงรูปภาพได้ โปรดกดสุ่มใหม่'
}

// เรียกดึงรูปทันทีเมื่อเปิดเว็บ
onMounted(() => {
  fetchDogImage()
})
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Kanit', -apple-system, BlinkMacSystemFont, sans-serif;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  color: #1f2937;
}

.container {
  width: 100%;
  max-width: 480px;
}

.card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  padding: 24px;
  text-align: center;
}

.header h1 {
  font-size: 1.6rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 6px;
}

.subtitle {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 20px;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.image-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.dog-image {
  width: 100%;
  height: 320px;
  object-fit: cover;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
}

.dog-image:hover {
  transform: scale(1.01);
}

.breed-badge {
  background: #eff6ff;
  color: #1d4ed8;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 0.88rem;
  display: inline-block;
  border: 1px solid #bfdbfe;
}

.loading-box,
.error-box {
  height: 320px;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #f9fafb;
  border-radius: 14px;
  border: 2px dashed #e5e7eb;
  padding: 20px;
  gap: 14px;
}

.error-box {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.spinner {
  width: 44px;
  height: 44px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.action-area {
  width: 100%;
  margin-top: 6px;
}

.btn {
  width: 100%;
  padding: 12px 20px;
  font-size: 1rem;
  font-family: inherit;
  font-weight: 500;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
  width: auto;
  padding: 8px 16px;
  font-size: 0.9rem;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.footer {
  margin-top: 24px;
  font-size: 0.8rem;
  color: #9ca3af;
}

.footer a {
  color: #6b7280;
  text-decoration: underline;
}
</style>
