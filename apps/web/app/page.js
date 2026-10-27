// apps/web/app/page.js
"use client";

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

// ─── Mock Data mẫu ───────────────────────────────────────────
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
          await new Promise((resolve) => setTimeout(resolve, 350));
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
      } finally {
        setLoading(false);
      }
    }

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
        fontFamily: "var(--font-inter), sans-serif",
        background: C.bg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── 1. Top Banner ── */}
      <div
        style={{
          background: C.banner,
          color: "#ffffff",
          textAlign: "center",
          height: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: 400,
          letterSpacing: "0.02em",
        }}
      >
        BẢN THIẾT KẾ MVP &nbsp;•&nbsp; Nhận tại quầy &nbsp;•&nbsp; Thanh toán mẫu, không phát sinh giao dịch
      </div>

      {/* ── 2. Navbar ── */}
      <nav
        style={{
          height: "96px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 64px",
          background: C.bg,
          borderBottom: `1px solid ${C.border}`,
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <svg width="29" height="29" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 9h18M3 9c0-2 1.5-6 9-6s9 4 9 6M3 9v9a2 2 0 002 2h14a2 2 0 002-2V9"
              stroke={C.primary}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M8 15c0 1.1.9 2 2 2h4a2 2 0 000-4h-4a2 2 0 00-2 2z"
              stroke={C.primary}
              strokeWidth="1.5"
            />
          </svg>
          <span
            className="font-serif"
            style={{
              fontSize: "29px",
              fontWeight: 600,
              color: C.text,
              lineHeight: "39.5px",
            }}
          >
            BrewLite
          </span>
        </Link>

        {/* Links */}
        <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          {[
            { label: "Thực đơn", active: true },
            { label: "Cửa hàng", active: false },
            { label: "Lịch sử đơn", active: false },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: item.active ? 600 : 400,
                  color: item.active ? C.primary : C.textMuted,
                  lineHeight: "16.9px",
                  transition: "color 0.2s ease",
                }}
              >
                {item.label}
              </span>
              {item.active && (
                <div
                  style={{
                    height: "2px",
                    background: C.primary,
                    borderRadius: "1px",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Account + Cart */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke={C.text} strokeWidth="1.5" />
              <path
                d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                stroke={C.text}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span style={{ fontSize: "14px", color: C.text }}>Đăng nhập</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: C.primaryLight,
              borderRadius: "8px",
              padding: "12px 16px",
              cursor: "pointer",
              transition: "transform 0.15s ease, background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.background = "#dfebd9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.background = C.primaryLight;
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                stroke={C.primary}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="3"
                y1="6"
                x2="21"
                y2="6"
                stroke={C.primary}
                strokeWidth="1.5"
              />
              <path
                d="M16 10a4 4 0 01-8 0"
                stroke={C.primary}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: C.primary,
                lineHeight: "21.7px",
              }}
            >
              Giỏ hàng · 1
            </span>
          </div>
        </div>
      </nav>

      {/* ── 3. Nội dung thực đơn ── */}
      <main
        style={{
          flex: 1,
          padding: "36px 64px 48px",
          display: "flex",
          flexDirection: "column",
          gap: "30px",
          maxWidth: "1440px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Bối cảnh nhận hàng (Cập nhật đúng từ Figma mới) */}
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
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
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
              }}
            >
              Hôm nay, bạn uống gì?
            </h1>
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

          {/* Ô tìm kiếm có hiệu ứng focus mượt mà */}
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
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(40, 84, 70, 0.12)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = "none";
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
                fontFamily: "var(--font-inter), sans-serif",
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

        {/* ── 4. Bộ lọc danh mục & Lưới sản phẩm ── */}
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
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Xem tất cả món
                </button>
              </div>
            )}

            {/* ── State 4: LƯỚI SẢN PHẨM (PRODUCT GRID) VỚI ANIMATION HOVER ── */}
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
                      {/* Ảnh sản phẩm + Hiệu ứng Zoom nhẹ khi Hover */}
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
                            transition: "color 0.2s",
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
      </main>

      {/* ── 5. Footer ── */}
      <footer
        style={{
          height: "75px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 64px",
          borderTop: `1px solid ${C.border}`,
          background: C.bg,
        }}
      >
        <span style={{ fontSize: "12px", color: C.textMuted, lineHeight: "18.6px" }}>
          BrewLite / Một chút chậm, một ngày thật ngon.
        </span>
        <span style={{ fontSize: "12px", color: C.textMuted, lineHeight: "18.6px" }}>
          Hỗ trợ &nbsp;•&nbsp; Điều khoản &nbsp;•&nbsp; Quyền riêng tư
        </span>
      </footer>
    </div>
  );
}
