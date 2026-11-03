// apps/web/app/page.js
"use client";

<<<<<<< HEAD
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function HomePage() {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả đồ uống');

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch('http://localhost:4000/api/v1/products');
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        setProducts([]);
=======
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

// Toggle flag: true = mock data (khi Task 2 backend chưa xong), false = gọi API NestJS thật
const USE_MOCK = true;

// ─── Color Tokens (khớp 100% Figma) ──────────────────────────
const C = {
  bg: "#f7f5ef",
  banner: "#285446",
  primary: "#285446",
  primaryHover: "#1f4337",
  primaryLight: "#eaf0e8",
  text: "#302b24",
  textMuted: "#78766c",
  border: "#dedcd2",
  white: "#fffefa",
  tagBeige: "#ede7dc",
};

// ─── Mock Data mẫu (chuẩn bị sẵn) ─────────────────────────────
const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Latte yến mạch",
    category: "Cà phê",
    price: 49000,
    description: "Espresso đậm, hậu vị hạt dịu êm",
    badge: "Được yêu thích",
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80",
  },
  {
    id: "2",
    name: "Cold Brew nguyên bản",
    category: "Cà phê",
    price: 45000,
    description: "Ủ lạnh 16 giờ, thanh mát tự nhiên",
    badge: null,
    image:
      "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&q=80",
  },
  {
    id: "3",
    name: "Matcha Latte",
    category: "Trà & Matcha",
    price: 55000,
    description: "Trà xanh Nhật Bản, sữa tươi béo nhẹ",
    badge: "Mới",
    image:
      "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&q=80",
  },
  {
    id: "4",
    name: "Espresso cam",
    category: "Đồ uống trái cây",
    price: 59000,
    description: "Espresso hòa cùng cam tươi mát lành",
    badge: null,
    image:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80",
  },
];

const CATEGORIES = [
  { id: "all", name: "Tất cả đồ uống" },
  { id: "Cà phê", name: "Cà phê" },
  { id: "Trà & Matcha", name: "Trà & Matcha" },
  { id: "Đồ uống trái cây", name: "Đồ uống trái cây" },
];

function fmt(n) {
  return n.toLocaleString("vi-VN") + " VNĐ";
}

export default function MenuPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bộ lọc & tìm kiếm
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  // ─── Fetch danh sách món ─────────────────────────────────────
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        if (USE_MOCK) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          setProducts(MOCK_PRODUCTS);
        } else {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
          const res = await fetch(`${apiUrl}/products`);
          if (!res.ok) throw new Error("Không thể tải danh sách sản phẩm");
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        setError(err.message || "Lỗi tải thực đơn");
>>>>>>> origin/main
      } finally {
        setLoading(false);
      }
    }
<<<<<<< HEAD
    fetchMenu();
  }, []);

  const categories = [
    { name: 'Tất cả đồ uống', count: products.length },
    { name: 'Cà phê', count: products.filter((p) => p.category === 'coffee').length },
    { name: 'Trà & Matcha', count: products.filter((p) => p.category === 'tea').length },
    { name: 'Đồ uống trái cây', count: products.filter((p) => p.category === 'juice' || p.category === 'smoothie').length },
  ];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'Tất cả đồ uống' ||
      (selectedCategory === 'Cà phê' && p.category === 'coffee') ||
      (selectedCategory === 'Trà & Matcha' && p.category === 'tea') ||
      (selectedCategory === 'Đồ uống trái cây' && (p.category === 'juice' || p.category === 'smoothie'));
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5ef', fontFamily: 'Inter, sans-serif' }}>
        <p style={{ fontSize: '16px', color: '#78766c' }}>Đang tải thực đơn...</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f7f5ef', fontFamily: 'Inter, sans-serif' }}>
      {/* Banner */}
      <div
        style={{
          background: '#285446',
          color: '#ffffff',
          textAlign: 'center',
          padding: '12px 24px',
          fontSize: '11px',
          fontWeight: 400,
          letterSpacing: '0.05em',
        }}
      >
        BẢN THIẾT KẾ MVP • Nhận tại quầy • Thanh toán mẫu, không phát sinh giao dịch
      </div>

      {/* Header */}
      <header
        style={{
          height: '96px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 64px',
          background: '#f7f5ef',
          borderBottom: '1px solid #dedcd2',
        }}
      >
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#285446" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
          </svg>
          <span style={{ fontFamily: 'Noto Serif, Georgia, serif', fontSize: '30px', fontWeight: 600, color: '#302b24', letterSpacing: '-0.02em' }}>
            BrewLite
          </span>
        </a>
        <nav style={{ display: 'flex', gap: '32px', justifyContent: 'center', alignItems: 'center', padding: '0 24px', flex: 1 }}>
          <a href="/" style={{ fontSize: '14px', color: '#285446', fontWeight: 600, textDecoration: 'none', borderBottom: '2px solid #285446', paddingBottom: '2px' }}>
            Thực đơn
          </a>
          <a href="#" style={{ fontSize: '14px', color: '#78766c', textDecoration: 'none' }}>
            Cửa hàng
          </a>
          <a href="#" style={{ fontSize: '14px', color: '#78766c', textDecoration: 'none' }}>
            Lịch sử đơn
          </a>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', minWidth: '170px', justifyContent: 'flex-end' }}>
          <a href="/login" style={{ fontSize: '14px', color: '#302b24', fontWeight: 500, textDecoration: 'none' }}>
            {user ? user.name || user.email : 'Đăng nhập'}
          </a>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#eaf0e8', borderRadius: '8px', padding: '12px 16px', textDecoration: 'none', color: '#285446', fontWeight: 600, fontSize: '14px' }}>
            <span>Giỏ hàng · {itemCount || 0}</span>
          </a>
        </div>
      </header>

      {/* Store Info */}
      <section style={{ padding: '24px 64px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ fontSize: '13px', color: '#302b24', fontWeight: 500 }}>
          <span style={{ color: '#285446', fontWeight: 600 }}>Nhận tại</span> BrewLite Nguyễn Huệ · Quận 1
          <a href="#" style={{ color: '#78766c', textDecoration: 'underline', marginLeft: '8px', fontWeight: 400 }}>Thay đổi ↗</a>
        </div>
        <div style={{ fontSize: '13px', color: '#78766c' }}>
          Nhận tại quầy · 15-20 phút
        </div>
      </section>

      {/* Main Content */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 64px 80px', display: 'flex', gap: '60px' }}>
        {/* Sidebar - Categories */}
        <aside style={{ width: '240px', flexShrink: 0 }}>
          <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#285446', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '16px' }}>
            DANH MỤC
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name === selectedCategory ? 'Tất cả đồ uống' : cat.name)}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  border: 'none',
                  background: cat.name === selectedCategory ? '#eaf0e8' : 'transparent',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: cat.name === selectedCategory ? '#285446' : '#78766c',
                  fontWeight: cat.name === selectedCategory ? 600 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <span>{cat.name}</span>
                <span style={{ fontSize: '12px', color: '#b5b09c', fontWeight: 500 }}>{cat.count}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Area */}
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontFamily: 'Noto Serif, Georgia, serif',
              fontSize: '48px',
              fontWeight: 500,
              color: '#302b24',
              marginBottom: '4px',
              letterSpacing: '-0.02em',
=======

    fetchProducts();
  }, []);

  // ─── Lọc theo danh mục và từ khóa tìm kiếm ───────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchCat =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchTerm.toLowerCase().trim()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Đếm số lượng món theo từng danh mục
  const countByCategory = useMemo(() => {
    const counts = { all: products.length };
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  return (
    <div
      style={{
        flex: 1,
        padding: "36px 64px 60px",
        display: "flex",
        flexDirection: "column",
        gap: "30px",
        maxWidth: "1440px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Bối cảnh nhận hàng (Figma) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21c-4.418-5.333-7-9.5-7-13a7 7 0 1114 0c0 3.5-2.582 7.667-7 13z"
              stroke={C.primary}
              strokeWidth="1.5"
            />
            <circle cx="12" cy="8" r="2.5" stroke={C.primary} strokeWidth="1.5" />
          </svg>
          <span style={{ fontSize: "13px", color: C.text }}>
            Nhận tại BrewLite An Dương Vương · Phường Chợ Quán
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: C.primary,
              cursor: "pointer",
            }}
          >
            Thay đổi ↗
          </span>
        </div>

        <div
          style={{
            background: C.primaryLight,
            borderRadius: "100px",
            padding: "5px 12px",
            fontSize: "12px",
            fontWeight: 600,
            color: C.primary,
          }}
        >
          Nhận tại quầy · 15–20 phút
        </div>
      </div>

      {/* Tiêu đề trang & Thanh tìm kiếm */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "48px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "11px",
              fontWeight: 700,
              color: C.primary,
              letterSpacing: "0.06em",
            }}
          >
            01 / THỰC ĐƠN
          </p>
          <h1
            className="font-serif"
            style={{
              margin: "0 0 10px",
              fontSize: "38px",
              fontWeight: 500,
              color: C.text,
              lineHeight: "49.4px",
>>>>>>> origin/main
            }}
          >
            Hôm nay, bạn uống gì?
          </h1>
<<<<<<< HEAD
          <p style={{ fontSize: '16px', color: '#78766c', marginBottom: '28px' }}>
            Chọn một món yêu thích. Tùy chỉnh theo đúng gu của bạn.
          </p>

          {/* Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#fff',
              border: '1px solid #dedcd2',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '32px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#78766c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên đồ uống..."
              style={{
                border: 'none',
                outline: 'none',
                flex: 1,
                fontSize: '14px',
                color: '#302b24',
                fontFamily: 'Inter, sans-serif',
                background: 'transparent',
              }}
            />
            <span style={{ fontSize: '13px', color: '#b5b09c' }}>⌘ K</span>
          </div>

          {/* Product Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '28px',
            }}
          >
            {filteredProducts.map((p) => (
              <a
                key={p.id}
                href={`/product/${p.id}`}
                style={{
                  textDecoration: 'none',
                  background: '#fff',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid #e9ecef',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  display: 'block',
                  color: '#302b24',
                }}
              >
                <img
                  src={p.imageUrl || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80'}
                  alt={p.name}
                  style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block' }}
                />
                <div style={{ padding: '20px 24px 24px' }}>
                  <h2
                    style={{
                      fontFamily: 'Noto Serif, Georgia, serif',
                      fontSize: '24px',
                      fontWeight: 500,
                      color: '#302b24',
                      margin: '0 0 6px',
                      lineHeight: '30px',
                    }}
                  >
                    {p.name}
                  </h2>
                  <p style={{ fontSize: '14px', color: '#78766c', margin: '0 0 14px', lineHeight: '21.7px', minHeight: '42px' }}>
                    {p.description || 'Thức uống thơm ngon từ BrewLite.'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '22px', fontWeight: 600, color: '#285446' }}>
                      {Number(p.price).toLocaleString('vi-VN')}đ
                    </span>
                    <span style={{ fontSize: '13px', color: '#6c757d', fontWeight: 500 }}>
                      {p.category || 'coffee'}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '24px 64px',
          borderTop: '1px solid #dedcd2',
          background: '#f7f5ef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '12px', color: '#78766c' }}>
          BrewLite / Một chút chậm, một ngày thật ngon.
        </span>
        <span style={{ fontSize: '12px', color: '#78766c' }}>
          Hỗ trợ &nbsp;•&nbsp; Điều khoản &nbsp;•&nbsp; Quyền riêng tư
        </span>
      </footer>
    </main>
=======
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              color: C.textMuted,
              lineHeight: "23.3px",
            }}
          >
            Chọn một món yêu thích. Tùy chỉnh theo đúng gu của bạn.
          </p>
        </div>

        {/* Ô tìm kiếm */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            padding: "0 16px",
            width: "360px",
            height: "50px",
            boxSizing: "border-box",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke={C.textMuted} strokeWidth="1.5" />
            <line
              x1="16.5"
              y1="16.5"
              x2="21"
              y2="21"
              stroke={C.textMuted}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Tìm tên đồ uống..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "14px",
              color: C.text,
              width: "100%",
              fontFamily: "var(--font-sans), sans-serif",
            }}
          />
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: C.textMuted,
                fontSize: "14px",
                padding: 0,
              }}
            >
              ✕
            </button>
          ) : (
            <span
              style={{
                fontSize: "11px",
                color: C.textMuted,
                background: "#eeebe3",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              ⌘ K
            </span>
          )}
        </div>
      </div>

      {/* ── Bộ lọc danh mục & Lưới sản phẩm ── */}
      <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
        {/* Cột trái: Sidebar danh mục */}
        <aside
          style={{
            width: "208px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              fontSize: "11px",
              fontWeight: 600,
              color: C.textMuted,
              letterSpacing: "0.05em",
            }}
          >
            DANH MỤC
          </p>

          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            const isHovered = hoveredCategory === cat.id && !active;
            const count = countByCategory[cat.id] ?? 0;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                onMouseEnter={() => setHoveredCategory(cat.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: active
                    ? C.primary
                    : isHovered
                    ? "#eeebe2"
                    : C.bg,
                  color: active ? "#ffffff" : C.text,
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: active ? 600 : 400,
                  textAlign: "left",
                  transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                  transform: isHovered ? "translateX(4px)" : "none",
                }}
              >
                <span>{cat.name}</span>
                <span
                  style={{
                    fontSize: "12px",
                    color: active ? "#ffffff" : C.textMuted,
                    background: active ? "rgba(255,255,255,0.2)" : "transparent",
                    padding: active ? "2px 6px" : 0,
                    borderRadius: "10px",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Ghi chú menu (theo Figma) */}
          <div
            style={{
              background: C.tagBeige,
              borderRadius: "16px",
              padding: "18px",
              marginTop: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 22v-9M12 13a5 5 0 015-5c0 0 1 4-5 5zM12 13a5 5 0 00-5-5c0 0-1 4 5 5z"
                stroke={C.primary}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                fontWeight: 600,
                color: C.text,
              }}
            >
              Pha theo cách của bạn
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: C.textMuted,
                lineHeight: "18.6px",
              }}
            >
              Size, đường, đá và topping được chọn ở bước tiếp theo.
            </p>
          </div>
        </aside>

        {/* Cột phải: Danh sách món */}
        <section style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Header kết quả */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: 600,
                color: C.text,
              }}
            >
              {CATEGORIES.find((c) => c.id === selectedCategory)?.name || "Thực đơn"}
            </h2>
            <span style={{ fontSize: "12px", color: C.textMuted }}>
              {filteredProducts.length} món · Giá từ size nhỏ
            </span>
          </div>

          {/* ── State 1: LOADING STATE ── */}
          {loading && (
            <div
              style={{
                padding: "60px 0",
                textAlign: "center",
                color: C.textMuted,
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  width: "32px",
                  height: "32px",
                  border: `3px solid ${C.border}`,
                  borderTopColor: C.primary,
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <p style={{ marginTop: "12px", fontSize: "14px" }}>
                Đang tải danh sách đồ uống...
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── State 2: ERROR STATE ── */}
          {error && (
            <div
              style={{
                padding: "24px",
                background: "#fde8e8",
                border: "1px solid #f8b4b4",
                borderRadius: "8px",
                color: "#9b1c1c",
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              <p style={{ margin: "0 0 8px", fontWeight: 600 }}>
                Không thể kết nối đến máy chủ!
              </p>
              <p style={{ margin: 0, fontSize: "13px" }}>{error}</p>
            </div>
          )}

          {/* ── State 3: EMPTY STATE ── */}
          {!loading && !error && filteredProducts.length === 0 && (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: "16px",
              }}
            >
              <p style={{ fontSize: "36px", margin: "0 0 12px" }}>☕</p>
              <h3
                style={{
                  margin: "0 0 6px",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: C.text,
                }}
              >
                Không tìm thấy đồ uống phù hợp
              </h3>
              <p
                style={{
                  margin: "0 0 16px",
                  fontSize: "13px",
                  color: C.textMuted,
                }}
              >
                Hãy thử tìm kiếm với từ khóa khác hoặc chọn danh mục "Tất cả đồ uống".
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                style={{
                  background: C.primary,
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Xem tất cả món
              </button>
            </div>
          )}

          {/* ── State 4: LƯỚI SẢN PHẨM (PRODUCT GRID) ── */}
          {!loading && !error && filteredProducts.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "22px",
              }}
            >
              {filteredProducts.map((p) => {
                const isHovered = hoveredCardId === p.id;
                return (
                  <div
                    key={p.id}
                    onMouseEnter={() => setHoveredCardId(p.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                    style={{
                      background: C.white,
                      border: `1px solid ${isHovered ? "#c5c0b0" : C.border}`,
                      borderRadius: "16px",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      transform: isHovered ? "translateY(-6px)" : "translateY(0)",
                      boxShadow: isHovered
                        ? "0 16px 32px -8px rgba(40, 84, 70, 0.16)"
                        : "0 2px 8px rgba(0, 0, 0, 0.02)",
                      transition:
                        "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease",
                    }}
                  >
                    {/* Ảnh sản phẩm + Zoom nhẹ khi Hover */}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "222px",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          transform: isHovered ? "scale(1.06)" : "scale(1)",
                          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                      />
                      {p.badge && (
                        <div
                          style={{
                            position: "absolute",
                            top: "12px",
                            left: "12px",
                            background: C.primaryLight,
                            color: C.primary,
                            borderRadius: "100px",
                            padding: "4px 10px",
                            fontSize: "11px",
                            fontWeight: 600,
                            boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                          }}
                        >
                          {p.badge}
                        </div>
                      )}
                    </div>

                    {/* Thông tin sản phẩm */}
                    <div
                      style={{
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        flex: 1,
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          fontWeight: 600,
                          color: C.text,
                        }}
                      >
                        {p.name}
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: C.textMuted,
                          lineHeight: "18.6px",
                          flex: 1,
                        }}
                      >
                        {p.description}
                      </p>

                      {/* Giá và nút chọn món -> link sang Task 4 */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "8px",
                          paddingTop: "12px",
                          borderTop: `1px solid ${C.border}`,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: 600,
                            color: C.primary,
                          }}
                        >
                          {fmt(p.price)}
                        </span>

                        <Link
                          href={`/product/${p.id}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            background: isHovered ? C.primaryHover : C.primary,
                            color: "#ffffff",
                            padding: "8px 14px",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: 600,
                            textDecoration: "none",
                            transform: isHovered ? "scale(1.04)" : "scale(1)",
                            boxShadow: isHovered
                              ? "0 4px 12px rgba(40, 84, 70, 0.25)"
                              : "none",
                            transition:
                              "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        >
                          <span>Chọn món</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <line
                              x1="12"
                              y1="5"
                              x2="12"
                              y2="19"
                              stroke="#ffffff"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <line
                              x1="5"
                              y1="12"
                              x2="19"
                              y2="12"
                              stroke="#ffffff"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
>>>>>>> origin/main
  );
}
