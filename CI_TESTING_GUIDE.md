# 📘 คู่มือเตรียมตัว CI/CD, Unit Test, Trivy & Docker Architecture
> **สำหรับ:** โปเต้ (ใช้ทบทวนและเตรียมนำเสนอพี่เลี้ยงในวันพุธ เวลา 15:00 น.)  
> **โปรเจกต์:** Simple Dog Vue (`simple-dog-vue`)  
> **สถานะปัจจุบัน:** ติดตั้ง Unit Test, ผูกใน CI Pipeline และเพิ่ม Trivy Security Scan ในระบบจริงเรียบร้อยแล้ว ✅

---

## สารบัญ
1. [ภาพรวมของ CI/CD Pipeline ทั้งหมดในโปรเจกต์เราตอนนี้](#1-ภาพรวมของ-cicd-pipeline-ทั้งหมดในโปรเจกต์เราตอนนี้)
2. [ส่วนที่ 1: ระบบ Unit Test ที่ติดตั้งในโปรเจกต์](#ส่วนที่-1-ระบบ-unit-test-ที่ติดตั้งในโปรเจกต์)
3. [ส่วนที่ 2: การทำงานของ GitHub Actions CI ที่อัปเดตใหม่](#ส่วนที่-2-การทำงานของ-github-actions-ci-ที่อัปเดตใหม่)
4. [ส่วนที่ 3: เครื่องมือสแกนความปลอดภัย Trivy (สิ่งที่เพิ่งเพิ่มเข้าไป)](#ส่วนที่-3-เครื่องมือสแกนความปลอดภัย-trivy-สิ่งที่เพิ่งเพิ่มเข้าไป)
5. [ส่วนที่ 4: ไขข้อข้องใจเรื่อง Docker Platform (ARM64 vs x86)](#ส่วนที่-4-ไขข้อข้องใจเรื่อง-docker-platform-arm64-vs-x86)
6. [ส่วนที่ 5: สรุปหลักการ CI Best Practices](#ส่วนที่-5-สรุปหลักการ-ci-best-practices)
7. [🎯 สคริปต์ถาม-ตอบ: ซ้อมพูดกับพี่เลี้ยงวันพุธ บ่าย 3](#-สคริปต์ถาม-ตอบ-ซ้อมพูดกับพี่เลี้ยงวันพุธ-บ่าย-3)

---

## 1. ภาพรวมของ CI/CD Pipeline ทั้งหมดในโปรเจกต์เราตอนนี้

ในไฟล์ [`.github/workflows/deploy.yml`](file:///d:/Work/docker-ci-cd/.github/workflows/deploy.yml) ปัจจุบันถูกแบ่งกระบวนการออกเป็น **3 Jobs ชัดเจนตามหลักการสากล**:

```text
[ Push โค้ดเข้า GitHub ]
          │
          ▼
┌──────────────────────────────────────────────┐
│  Job 1: test                                 │
│  - ติดตั้ง Node.js 22 + npm ci               │
│  - รัน npm test (Vitest: 10 เคส)             │
└──────────────────────────────────────────────┘
          │ (ถ้าเทสผ่าน ✅)
          ▼
┌──────────────────────────────────────────────┐
│  Job 2: build (needs: test)                  │
│  - เซ็ตอัป Docker Buildx (รองรับ Cross-arch) │
│  - ล็อกอิน GitHub Container Registry (GHCR) │
│  - บิลด์ Docker Image สำหรับ linux/arm64      │
│  - Push Image ขึ้น GHCR                      │
│  - 🔍 [NEW] รัน Trivy สแกนช่องโหว่ใน Image   │
└──────────────────────────────────────────────┘
          │ (ถ้าบิลด์ผ่าน ✅)
          ▼
┌──────────────────────────────────────────────┐
│  Job 3: deploy (needs: build)                │
│  - SSH ไปยัง Oracle Cloud VPS                │
│  - docker compose pull & docker compose up   │
│  - เคลียร์ Image เก่า (prune) และเช็กสถานะ   │
└──────────────────────────────────────────────┘
```

> **หัวใจสำคัญ:** หากขั้นตอนใดขั้นตอนหนึ่งไม่ผ่าน (เช่น โค้ดพังใน Job 1 หรือบิลด์ไม่ผ่านใน Job 2) ระบบจะ **หยุดทันทีก่อนถึงขั้นตอน Deploy** เพื่อไม่ให้โค้ดที่มีปัญหาขึ้นสู่เครื่อง Production จริง

---

## ส่วนที่ 1: ระบบ Unit Test ที่ติดตั้งในโปรเจกต์

### 1.1 ทำไมต้องเลือก Vitest?
* **Vitest** เป็น Testing Framework ยุคใหม่ที่เกิดมาคู่กับ **Vite**
* อ่านไฟล์ config ร่วมกับ Vite ได้เลย ไม่ต้องเซ็ตอัป Babel/Jest ให้ปวดหัว
* มีความเร็วสูงมาก และมีคำสั่ง Hot-reload เมื่อแก้ไขโค้ด

### 1.2 โครงสร้างไฟล์ทดสอบที่สร้างขึ้น
```text
├── src/
│   ├── utils/
│   │   └── dog.js          <-- แยก Pure Functions ออกมาเพื่อให้เทสง่าย (Testable Code)
│   └── App.vue             <-- เรียกใช้ฟังก์ชันจาก utils/dog.js
└── tests/
    └── unit/
        ├── dog.spec.js     <-- เทสฟังก์ชัน Logic (7 เคส)
        └── App.spec.js     <-- เทส Vue Component (3 เคส)
```

### 1.3 ชุดทดสอบที่เขียนไว้ (10 Test Cases)
1. **[`tests/unit/dog.spec.js`](file:///d:/Work/docker-ci-cd/tests/unit/dog.spec.js)** (ทดสอบ Pure Functions):
   * `capitalize(str)`: ตรวจสอบการแปลงตัวพิมพ์ใหญ่ตัวแรก, ป้องกัน error เมื่อส่งค่าว่างหรือ `null`
   * `extractBreed(url)`: 
     * สกัดชื่อสายพันธุ์เดี่ยว เช่น `/breeds/beagle/...` -> `"Beagle"`
     * สกัดสายพันธุ์ย่อยที่มีขีดคั่น เช่น `/breeds/hound-afghan/...` -> `"Afghan Hound"`
     * ป้องกัน error เมื่อส่ง URL ผิดโครงสร้าง
2. **[`tests/unit/App.spec.js`](file:///d:/Work/docker-ci-cd/tests/unit/App.spec.js)** (ทดสอบ Vue Component ด้วย `@vue/test-utils`):
   * ทดสอบว่าหน้าเว็บเรนเดอร์หัวข้อ 🐶 และปุ่มกดถูกต้อง
   * จำลอง (Mock) Dog API ตอบกลับสำเร็จ: แสดงรูปและ Badge สายพันธุ์
   * จำลองเมื่อ API พัง (500): แสดงกล่อง Error พร้อมปุ่มกดลองใหม่

### 1.4 คำสั่งรันการทดสอบในเครื่อง
```bash
# โหมดรันรอบเดียวจบ (สำหรับ CI):
npm test

# โหมดรันแบบ Real-time (สำหรับตอนนั่งเขียนโค้ด):
npm run test:watch
```

---

## ส่วนที่ 2: การทำงานของ GitHub Actions CI ที่อัปเดตใหม่

### 2.1 โครงสร้าง Job `test` ใน [`.github/workflows/deploy.yml`](file:///d:/Work/docker-ci-cd/.github/workflows/deploy.yml)
```yaml
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run Unit Tests
        run: npm test
```

### 2.2 การผูกความสัมพันธ์ด้วย `needs: test`
ใน Job `build` เราได้ใส่:
```yaml
  build:
    needs: test
    runs-on: ubuntu-latest
```
* **ความหมาย:** ถ้า Job `test` ล้มเหลว (มี Test พังแม้แต่เคสเดียว) Job `build` จะถูกยกเลิกทันที ไม่มีการบิลด์ Docker Image และไม่มีการ Deploy

---

## ส่วนที่ 3: เครื่องมือสแกนความปลอดภัย Trivy (สิ่งที่เพิ่งเพิ่มเข้าไป)

### 3.1 Trivy คืออะไร?
* **Trivy** (พัฒนาโดย Aqua Security) คือ Open-source All-in-one Security Scanner ที่ใช้สแกนหาช่องโหว่ความปลอดภัยใน Container Image, Git Repository และ Kubernetes
* เป็น Tool ยอดนิยมในโลก DevOps เพราะทำงานได้เร็ว ฐานข้อมูลช่องโหว่ (Vulnerability DB) อัปเดตตลอดเวลา และสแกนได้ละเอียดลงไปถึงแต่ละ Layer ของ Docker

### 3.2 Trivy ใน Pipeline ของเราทำงานอย่างไร?
ใน Job `build` หลังจาก Push Docker Image ขึ้น GHCR จะมี Step นี้ทำงาน:
```yaml
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@0.29.0
        env:
          TRIVY_USERNAME: ${{ github.actor }}
          TRIVY_PASSWORD: ${{ secrets.GITHUB_TOKEN }}
        with:
          image-ref: ${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: "table"
          exit-code: "0"
          ignore-unfixed: true
          vuln-type: "os,library"
          severity: "CRITICAL,HIGH"
```

### 3.3 อธิบายค่า Configuration ของ Trivy ในโปรเจกต์เรา:
* **`image-ref`**: ระบุพิกัด Image บน GHCR ที่ต้องการสแกน (ใช้ Tag ตาม Git Commit SHA เพื่อความแม่นยำ)
* **`env: TRIVY_USERNAME & PASSWORD`**: ส่ง Credential ของ GitHub Token เพื่อให้ Trivy มีสิทธิ์ดึง Image ส่วนตัวจาก GHCR มาวิเคราะห์ได้
* **`vuln-type: "os,library"`**:
  * `os`: สแกนแพ็กเกจระดับระบบปฏิบัติการของ Container (เช่น Alpine Linux ใน Base image)
  * `library`: สแกน Node.js / NPM libraries ที่เราติดตั้ง
* **`severity: "CRITICAL,HIGH"`**: กรองแสดงเฉพาะช่องโหว่ที่ร้ายแรงระดับวิกฤต (Critical) และระดับสูง (High) เพื่อไม่ให้ Log รกเกินไปด้วยข้อความระดับ Low/Medium
* **`ignore-unfixed: true`**: ซ่อนช่องโหว่ที่ต้นทางผู้พัฒนาแพ็กเกจยังไม่มี Patch แก้ไขออกมา (ช่วยลด False Alarms)
* **`format: "table"`**: แสดงผลลัพธ์เป็นตารางอ่านง่ายในหน้า Log ของ GitHub Actions
* **`exit-code: "0"`**: 
  * ให้ส่งสถานะสำเร็จเสมอ เพื่อให้เห็นรายงานใน Log แต่ไม่ขัดขวางการ Deploy
  * *(เกร็ดความรู้ตอบพี่)*: ในทีมที่มีนโยบายความปลอดภัยเข้มงวด (Strict Security Gating) จะเปลี่ยนเป็น `exit-code: "1"` เพื่อให้ Pipeline สั่ง Fail ทันทีหากตรวจพบช่องโหว่ระดับ Critical

---

## ส่วนที่ 4: ไขข้อข้องใจเรื่อง Docker Platform (ARM64 vs x86)

> **คำถามที่พี่เลี้ยงถาม:**
> 1. ทำไมใน workflow ถึงต้องระบุ `platforms: linux/arm64`?
> 2. ถ้าไม่ระบุจะเกิดอะไรขึ้น?
> 3. ไหน Docker บอกว่า *"Build once, run anywhere"* ทำไมข้ามเครื่องแล้วยังมีปัญหา?

### 4.1 ความแตกต่างของสถาปัตยกรรม CPU (CPU Architecture)
* **GitHub Actions Runner:** ทำงานบนเครื่อง Server สถาปัตยกรรม **x86_64 (AMD64)** ซึ่งเป็นมาตรฐานคอมพิวเตอร์ทั่วไป
* **VPS ของเรา (Oracle Cloud Always Free):** ใช้ชิปประมวลผล **Ampere A1 (ARM64)** ซึ่งใช้ชุดคำสั่ง CPU คนละภาษา
* **ถ้าไม่ระบุ `platforms: linux/arm64`:**
  * Docker บน GitHub Actions จะบิลด์ Image เป็น **linux/amd64** ตามเครื่อง Runner อัตโนมัติ
  * เมื่อ Image ถูกดึงไปรันบน VPS (ARM64) จะเกิด Error:
    ```text
    exec /docker-entrypoint.sh: exec format error
    ```
    เซิร์ฟเวอร์ ARM อ่าน Machine Code ของ x86 ไม่ออก จึงรัน Container ไม่ได้

### 4.2 ทำไม Docker บอก "Build once, run anywhere" แต่เคสนี้ไม่ Anywhere?
* คำว่า *"Run anywhere"* ของ Docker หมายถึง: **"ไม่ต้องแคร์ OS หรือ Dependency ภายใน ไม่ว่าเครื่องไหนก็รันได้ ตราบใดที่ CPU Architecture เข้ากันได้"**
* Docker เป็นเพียง Containerization (แชร์ Kernel กับ Host) **ไม่ได้มีตัวแปลงภาษา CPU (No Hardware Emulation)** เหมือน Virtual Machine ตัวเต็ม
* **วิธีแก้:** ต้องใช้ **Docker Buildx + QEMU** (ซึ่งใน workflow เรามี `setup-buildx-action`) เข้ามาช่วยจำลองการคอมไพล์ Machine code ให้เป็น `linux/arm64` ตั้งแต่อยู่บน GitHub Actions Runner

---

## ส่วนที่ 5: สรุปหลักการ CI Best Practices

เวลาพี่เลี้ยงถาม ให้ตอบเน้น **"คุณค่าและการทำงานร่วมกันของทีม"**:

1. **Continuous Integration (การรวมโค้ดอย่างต่อเนื่อง):**
   * นักพัฒนาต้องส่งโค้ดเข้าส่วนกลางบ่อยๆ (วันละหลายครั้ง) ไม่ดอง Branch ไว้นาน เพื่อลด Merge Conflict
2. **Automate the Build & Test (สร้างและทดสอบอัตโนมัติ):**
   * ทุกครั้งที่รวมโค้ด ระบบต้องรัน Compile, Unit Test และ Security Scan อัตโนมัติ ปราศจาก Human Error
3. **Fast Feedback Loop (รู้ข้อผิดพลาดทันที):**
   * ถ้าโค้ดใครทำพัง CI ต้องแดงภายใน 5-10 นาที เพื่อให้เจ้าของโค้ดแก้ได้ทันทีตอนที่ยังจำโค้ดได้
4. **Self-Testing Code (โค้ดต้องทดสอบตัวเองได้):**
   * ทุกฟีเจอร์ต้องมี Unit Test ควบคู่ ไม่พึ่งพาการคลิกหน้าเว็บด้วยมือเพียงอย่างเดียว

---

## 🎯 สคริปต์ถาม-ตอบ: ซ้อมพูดกับพี่เลี้ยงวันพุธ บ่าย 3

> ลองอ่านชุดนี้ให้คล่อง แล้วนำไปพูดตามสไตล์ของตัวเองได้เลยครับ:

### 💬 คำถาม 1: "ตอนนี้ CI/CD ของเราทำอะไรบ้าง เล่า Pipeline ให้ฟังหน่อย?"
* **แนวคำตอบ:**  
  *"ตอนนี้ใน GitHub Actions ผมแบ่งเป็น 3 Jobs ครับพี่:*  
  *1. **Job Test:** จะเช็กเอาต์โค้ดมาลง Node 22 แล้วรัน Vitest Unit Test ทั้ง 10 เคสก่อนเลย ถ้าเทสไม่ผ่านจะหยุดทันที*  
  *2. **Job Build:** จะทำงานก็ต่อเมื่อเทสผ่าน โดยใช้ Docker Buildx บิลด์ Image เป็น `linux/arm64` แล้ว Push ขึ้น GHCR และผมได้ใส่ **Trivy** เข้ามาสแกนช่องโหว่ความปลอดภัยระดับ Critical/High ของ Image ด้วยครับ*  
  *3. **Job Deploy:** จะ SSH เข้าไปที่ Oracle Cloud VPS เพื่อดึง Image ใหม่มารันผ่าน Docker Compose ครับ"*

### 💬 คำถาม 2: "ทำไมถึงเลือกเขียน Unit Test ด้วย Vitest? แล้วเทสอะไรไปบ้าง?"
* **แนวคำตอบ:**  
  *"โปรเจกต์เราใช้ Vite อยู่แล้วครับ Vitest เลยเข้ากันได้ดีที่สุด เร็วและไม่ต้องคอนฟิกเพิ่ม ผมได้แยก Pure function อย่างฟังก์ชันแกะชื่อสายพันธุ์ `extractBreed` กับ `capitalize` ออกมาไว้ที่ `src/utils/dog.js` เพื่อให้เขียน Unit Test ได้ 100% และเขียนเทส Component `App.vue` โดยใช้ `@vue/test-utils` จำลองทั้งตอน API โหลดสำเร็จและตอน API พังครับ"*

### 💬 คำถาม 3: "ทำไมใน Workflow ต้องระบุ `platforms: linux/arm64`? ถ้าไม่ระบุจะเกิดอะไรขึ้น?"
* **แนวคำตอบ:**  
  *"เพราะเครื่อง GitHub Actions Runner มันเป็น CPU x86_64 ครับ แต่ VPS ของเราบน Oracle Cloud Free Tier มันเป็นชิป Ampere ซึ่งเป็น ARM64 ถ้าเราไม่ระบุ platform ตัว Docker จะบิลด์เป็น x86 ตามเครื่อง Runner แล้วพอนำไปรันบน VPS มันจะสตาร์ทไม่ติดและฟ้อง `exec format error` ครับ เราเลยต้องใช้ Docker Buildx กำหนดเป็น `linux/arm64` ครับ"*

### 💬 คำถาม 4: "แล้วที่เขาว่า Docker 'Build once, run anywhere' ทำไมเคสนี้ถึงรันไม่ได้ล่ะ?"
* **แนวคำตอบ:**  
  *"เพราะ Docker เป็น Container ที่แชร์ Kernel กับ CPU ของเครื่อง Host ครับ มันไม่ได้จำลอง Hardware หรือแปลชุดคำสั่ง Instruction Set ของ CPU ให้เหมือนพวก Virtual Machine คำว่า Run anywhere ของ Docker เลยหมายถึง Anywhere บน CPU Architecture เดียวกันครับ ถ้าข้ามสถาปัตยกรรม ต้องใช้ Buildx หรือทำ Multi-arch ครับ"*

### 💬 คำถาม 5: "Trivy ที่ใส่มา มันช่วยอะไรใน CI?"
* **แนวคำตอบ:**  
  *"Trivy เป็น All-in-one Container Security Scanner ครับ ใน CI มันจะคอยดึง Image ที่เราเพิ่งบิลด์เสร็จมาสแกนดูแต่ละ Layer ว่า Base image ของ Alpine หรือ Library ใน `package.json` มีช่องโหว่ CVEs ระดับ High หรือ Critical มั้ย ทำให้เรารู้ล่วงหน้าเรื่องความปลอดภัยก่อนที่อิมเมจจะถูกดีพลอยขึ้นเซิร์ฟเวอร์จริงครับ"*
