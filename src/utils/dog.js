/**
 * ปรับตัวอักษรแรกของคำให้เป็นตัวพิมพ์ใหญ่
 * @param {string} str
 * @returns {string}
 */
export const capitalize = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * แกะชื่อสายพันธุ์สุนัขจาก URL รูปภาพของ Dog CEO API
 * ตัวอย่าง URL:
 * - https://images.dog.ceo/breeds/hound-afghan/n02098105_154.jpg -> Afghan Hound
 * - https://images.dog.ceo/breeds/beagle/n02088364_11105.jpg -> Beagle
 *
 * @param {string} url
 * @returns {string}
 */
export const extractBreed = (url) => {
  if (!url || typeof url !== "string") return "";
  try {
    const parts = url.split("/breeds/")[1];
    if (!parts) return "";
    const breedSlug = parts.split("/")[0];
    if (!breedSlug) return "";

    // แปลง sub-breed เช่น "hound-afghan" -> "Afghan Hound"
    const subParts = breedSlug.split("-");
    if (subParts.length > 1) {
      return `${capitalize(subParts[1])} ${capitalize(subParts[0])}`;
    }
    return capitalize(breedSlug);
  } catch {
    return "";
  }
};
