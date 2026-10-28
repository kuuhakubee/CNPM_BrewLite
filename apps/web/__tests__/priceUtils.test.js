// apps/web/__tests__/priceUtils.test.js
import { calcTotal } from "../app/product/[ID]/priceUtils";

const mockProduct = {
  price: 35000,
  sizes: [
    { code: "S", priceDelta: 0 },
    { code: "M", priceDelta: 4000 },
    { code: "L", priceDelta: 8000 },
  ],
  toppings: [
    { id: 1, name: "Trân châu", price: 5000 },
    { id: 2, name: "Kem phô mai", price: 7000 },
  ],
};

test("Giá khi chọn size M + 2 topping", () => {
  const total = calcTotal(mockProduct, "M", [1, 2]);
  // 35000 (base) + 4000 (M) + 5000 + 7000 = 51000
  expect(total).toBe(51000);
});

test("Giá khi chỉ chọn size S (giá gốc)", () => {
  const total = calcTotal(mockProduct, "S", []);
  expect(total).toBe(35000);
});