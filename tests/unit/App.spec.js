import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import App from "../../src/App.vue";

describe("App.vue Component Tests", () => {
  beforeEach(() => {
    // Mock global fetch
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("เรนเดอร์โครงสร้างพื้นฐานและหัวข้อถูกต้อง", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "success",
        message: "https://images.dog.ceo/breeds/corgi/corgi1.jpg",
      }),
    });

    const wrapper = mount(App);
    expect(wrapper.find("h1").text()).toContain("สุ่มรูปน้องหมา");
    expect(wrapper.find(".btn-primary").text()).toContain("เปลี่ยนรูปน้องหมา");
  });

  it("ดึงข้อมูลรูปภาพและแสดงผลสายพันธุ์เมื่อ fetch สำเร็จ", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "success",
        message: "https://images.dog.ceo/breeds/beagle/dog.jpg",
      }),
    });

    const wrapper = mount(App);
    await flushPromises();

    // ต้องแสดงรูปภาพพร้อม src ที่ถูกต้อง
    const img = wrapper.find("img.dog-image");
    expect(img.exists()).toBe(true);
    expect(img.attributes("src")).toBe(
      "https://images.dog.ceo/breeds/beagle/dog.jpg"
    );

    // ต้องแสดง badge สายพันธุ์
    const breedBadge = wrapper.find(".breed-badge");
    expect(breedBadge.exists()).toBe(true);
    expect(breedBadge.text()).toContain("Beagle");
  });

  it("แสดงกล่องข้อความ Error เมื่อ fetch ล้มเหลว", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ status: "error", message: "Server error" }),
    });

    const wrapper = mount(App);
    await flushPromises();

    const errorBox = wrapper.find(".error-box");
    expect(errorBox.exists()).toBe(true);
    expect(errorBox.text()).toContain("โหลดไม่สำเร็จ");
    expect(wrapper.find("button.btn-secondary").text()).toContain("ลองใหม่อีกครั้ง");
  });
});
