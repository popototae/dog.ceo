import { describe, it, expect } from "vitest";
import { capitalize, extractBreed } from "../../src/utils/dog.js";

describe("Dog Utils: capitalize", () => {
  it("แปลงตัวอักษรแรกให้เป็นตัวพิมพ์ใหญ่", () => {
    expect(capitalize("hound")).toBe("Hound");
    expect(capitalize("beagle")).toBe("Beagle");
  });

  it("คงค่าตัวพิมพ์ใหญ่เดิมไว้ถ้าขึ้นต้นด้วยตัวพิมพ์ใหญ่อยู่แล้ว", () => {
    expect(capitalize("Husky")).toBe("Husky");
  });

  it("ส่งกลับสตริงว่างเมื่อค่าที่ส่งเข้ามาเป็นค่าว่าง หรือไม่ใช่ string", () => {
    expect(capitalize("")).toBe("");
    expect(capitalize(null)).toBe("");
    expect(capitalize(undefined)).toBe("");
  });
});

describe("Dog Utils: extractBreed", () => {
  it("สามารถสกัดชื่อสายพันธุ์เดี่ยวจาก URL ได้ถูกต้อง", () => {
    const url = "https://images.dog.ceo/breeds/beagle/n02088364_11105.jpg";
    expect(extractBreed(url)).toBe("Beagle");
  });

  it("สามารถสกัดชื่อสายพันธุ์ย่อยที่มีขีดคั่น (Sub-breed) และสลับคำได้ถูกต้อง", () => {
    // เช่น hound-afghan ต้องได้ Afghan Hound
    const url1 = "https://images.dog.ceo/breeds/hound-afghan/n02098105_154.jpg";
    expect(extractBreed(url1)).toBe("Afghan Hound");

    // เช่น retriever-golden ต้องได้ Golden Retriever
    const url2 = "https://images.dog.ceo/breeds/retriever-golden/n02099601_100.jpg";
    expect(extractBreed(url2)).toBe("Golden Retriever");
  });

  it("ส่งกลับสตริงว่างเมื่อ URL ไม่มีโครงสร้าง /breeds/", () => {
    expect(extractBreed("https://example.com/images/dog.jpg")).toBe("");
  });

  it("ส่งกลับสตริงว่างเมื่อพารามิเตอร์เป็นค่าว่าง หรือไม่ใช่ string", () => {
    expect(extractBreed("")).toBe("");
    expect(extractBreed(null)).toBe("");
    expect(extractBreed(undefined)).toBe("");
  });
});
