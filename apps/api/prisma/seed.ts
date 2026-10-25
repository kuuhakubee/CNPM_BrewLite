/**
 * BrewLite – Seed dữ liệu mẫu (FR-16 / AC-16-2, AC-16-3)
 *
 * Chạy:  npx prisma db seed       (hoặc npm run prisma:seed)
 * Yêu cầu: đã áp dụng migration (prisma migrate deploy / dev)
 *
 * Idempotent (AC-16-3): chạy lại nhiều lần KHÔNG sinh dữ liệu trùng
 * nhờ upsert theo khóa unique (email, code, productId+code...).
 */
import { PrismaClient, DiscountType } from '@prisma/client';

const prisma = new PrismaClient();

// Băm bcrypt ở seed là không cần thiết cho user demo; mật khẩu "demo" chỉ để local.
// (bcrypt sẽ được dùng thật ở module auth – Task 5.1.)
const DEMO_PASSWORD_HASH =
  '$2b$10$EpIxXl1uYk0nJ9m4iF3zUuJ0S8Qq3sT1oK6yW1vX2zY4aB5cD6eF7gH';

async function main() {
  console.log('Seeding BrewLite data...');

  // ---------- 1. User demo ----------
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@brewlite.dev' },
    update: {},
    create: {
      email: 'demo@brewlite.dev',
      passwordHash: DEMO_PASSWORD_HASH,
      role: 'CUSTOMER',
      loyaltyPoints: 0,
    },
  });

  // ---------- 2. Sản phẩm + size + topping ----------
  // ≥ 8 sản phẩm (AC-16-2). Giá là Decimal VND.
  const products = [
    { name: 'Cà phê sữa', category: 'coffee', price: 35000, desc: 'Cà phê pha sữa đặc' },
    { name: 'Americano', category: 'coffee', price: 40000, desc: 'Cà phê đen đậm đà' },
    { name: 'Cappuccino', category: 'coffee', price: 45000, desc: 'Cà phê bọt sữa' },
    { name: 'Bạc xỉu', category: 'coffee', price: 38000, desc: 'Sữa nhiều, cà phê ít' },
    { name: 'Trà đào', category: 'tea', price: 39000, desc: 'Trà đào cam sả' },
    { name: 'Trà sữa trân châu', category: 'tea', price: 42000, desc: 'Trà sữa trân châu đường đen' },
    { name: 'Sinh tố bơ', category: 'smoothie', price: 45000, desc: 'Sinh tố bơ sữa' },
    { name: 'Nước ép cam', category: 'juice', price: 35000, desc: 'Nước ép cam tươi' },
  ];

  // 3 size: S / M / L với priceDelta khác nhau
  const sizeDefs = [
    { code: 'S', name: 'Nhỏ', delta: 0, isDefault: false },
    { code: 'M', name: 'Vừa', delta: 4000, isDefault: true },
    { code: 'L', name: 'Lớn', delta: 8000, isDefault: false },
  ];

  // ≥ 4 topping
  const toppingDefs = [
    { name: 'Trân châu', price: 5000 },
    { name: 'Kem phô mai', price: 7000 },
    { name: 'Thạch', price: 5000 },
    { name: 'Sữa tươi', price: 6000 },
  ];

  const toppings = [];
  for (const t of toppingDefs) {
    toppings.push(
      await prisma.topping.upsert({
        where: { id: await resolveToppingId(t.name) },
        update: { price: t.price },
        create: { name: t.name, price: t.price, isAvailable: true },
      }),
    );
  }

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { id: await resolveProductId(p.name) },
      update: { price: p.price, description: p.desc, category: p.category },
      create: {
        name: p.name,
        description: p.desc,
        category: p.category,
        price: p.price,
        imageUrl: '',
        stock: 100,
        isAvailable: true,
      },
    });

    // Size theo product (unique productId+code)
    for (const s of sizeDefs) {
      const existing = await prisma.productSize.findFirst({
        where: { productId: product.id, code: s.code },
      });
      if (!existing) {
        await prisma.productSize.create({
          data: {
            productId: product.id,
            code: s.code,
            name: s.name,
            priceDelta: s.delta,
            isDefault: s.isDefault,
          },
        });
      }
    }

    // Gán topping cho product (implicit m2m qua relation ProductAcceptsTopping)
    await prisma.product.update({
      where: { id: product.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { toppings: { set: toppings.map((t) => ({ id: t.id })) } } as any,
    });
  }

  // ---------- 3. Khuyến mãi (≥ 1) ----------
  await prisma.promotion.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: 'Giảm 10% cho khách mới',
      discountType: DiscountType.PERCENT,
      discountValue: 10,
      minOrderTotal: 0,
      usedCount: 0,
      startsAt: new Date('2026-01-01'),
      expiresAt: new Date('2027-12-31'),
      isActive: true,
    },
  });

  console.log(`Seed done. Demo user id=${demoUser.id}, products=${products.length}, toppings=${toppings.length}.`);
}

// Helpers: tìm id theo tên/email để upsert idempotent (schema không có @unique cho name)
async function resolveProductId(name: string): Promise<number> {
  const p = await prisma.product.findFirst({ where: { name } });
  return p?.id ?? -1; // -1 → không tồn tại → create
}

async function resolveToppingId(name: string): Promise<number> {
  const t = await prisma.topping.findFirst({ where: { name } });
  return t?.id ?? -1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
