// apps/web/app/product/[id]/priceUtils.js

/**
 * Tính giá cuối cùng cho một sản phẩm.
 *
 * @param {Object} product        // Đối tượng trả về từ API
 * @param {string} sizeCode      // Mã size hiện tại (S / M / L)
 * @param {Array<number>} toppingIds // Mảng ID topping người dùng đã chọn
 * @returns {number} total price in VND
 */
export function calcTotal(product, sizeCode, toppingIds) {
  if (!product) return 0;

  const basePrice = product.basePrice ?? product.price ?? 0; // giá gốc (size S)
  const sizeDelta =
    product.sizes.find((s) => s.code === sizeCode)?.priceDelta ?? 0;

  const toppingSum = product.toppings
    .filter((t) => toppingIds.includes(t.id))
    .reduce((sum, t) => sum + t.price, 0);

  return basePrice + sizeDelta + toppingSum;
}