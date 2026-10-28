// apps/web/app/product/[id]/page.js
"use client";

import { useEffect, useState } from "react";

const USE_MOCK = true;

// ─── Color Tokens (từ Figma) ────────────────────────────────
const C = {
  bg: "#f7f5ef",
  banner: "#285446",
  primary: "#285446",
  primaryLight: "#eaf0e8",
  text: "#302b24",
  textMuted: "#78766c",
  border: "#dedcd2",
  white: "#fffefa",
  tagBeige: "#ede7dc",
  price: "#285446",
};

// ─── Mock Data ───────────────────────────────────────────────
const MOCK_PRODUCT = {
  id: "1",
  step: "02 / TÙY CHỌN ĐỒ UỐNG",
  name: "Latte yến mạch",
  basePrice: 49000,
  baseSizeLabel: "Giá gốc size S · Chưa thêm tùy chọn",
  image:
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80",
  tags: [
    { label: "Espresso rang vừa", color: C.primaryLight, textColor: C.primary },
    { label: "Có caffeine", color: C.tagBeige, textColor: C.textMuted },
  ],
  tagline: "Đậm một chút, êm thật lâu.",
  description:
    "Espresso thơm hương hạt hòa cùng sữa mịn. Chọn sữa yến mạch để thêm vị béo dịu và hậu vị ngọt tự nhiên.",
  allergyNote:
    "Có thể chứa sữa và yến mạch. Vui lòng kiểm tra trước khi đặt.",
  sizes: [
    { code: "S", label: "S · +0 VNĐ", priceDelta: 0 },
    { code: "M", label: "M · +6.000 VNĐ", priceDelta: 6000 },
    { code: "L", label: "L · +12.000 VNĐ", priceDelta: 12000 },
  ],
  sugarLevels: [
    { code: "0", label: "0%" },
    { code: "30", label: "30%" },
    { code: "50", label: "50%" },
    { code: "100", label: "100%" },
  ],
  iceLevels: [
    { code: "none", label: "Không đá" },
    { code: "less", label: "Ít đá" },
    { code: "normal", label: "Đá thường" },
  ],
  toppings: [
    { id: 1, name: "Sữa yến mạch", price: 10000 },
    { id: 2, name: "Thêm một shot espresso", price: 15000 },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────
function fmt(n) {
  return n.toLocaleString("vi-VN") + " VNĐ";
}

function fmtShort(n) {
  return n.toLocaleString("vi-VN");
}

function calcPerCup(product, sizeCode, selectedToppings) {
  const size = product.sizes.find((s) => s.code === sizeCode);
  const toppingTotal = product.toppings
    .filter((t) => selectedToppings.includes(t.id))
    .reduce((sum, t) => sum + t.price, 0);
  return product.basePrice + (size?.priceDelta || 0) + toppingTotal;
}

// ─── Option Button ────────────────────────────────────────────
function OptionBtn({ selected, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        height: "45px",
        border: selected ? `1.5px solid ${C.primary}` : `1px solid ${C.border}`,
        borderRadius: "8px",
        background: selected ? C.primaryLight : C.white,
        color: C.text,
        fontWeight: selected ? 600 : 400,
        fontSize: "14px",
        cursor: "pointer",
        fontFamily: "var(--font-sans), sans-serif",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

// ─── Option Group ─────────────────────────────────────────────
function OptionGroup({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <p
        style={{
          margin: 0,
          fontSize: "14px",
          fontWeight: 600,
          color: C.text,
          lineHeight: "21.7px",
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", gap: "10px" }}>{children}</div>
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────
function Divider() {
  return (
    <div
      style={{ width: "100%", height: "1px", background: C.border, margin: "0" }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function ProductDetail({ params }) {
  const { id } = params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sizeCode, setSizeCode] = useState("S");
  const [sugarCode, setSugarCode] = useState("50");
  const [iceCode, setIceCode] = useState("less");
  const [selectedToppings, setSelectedToppings] = useState([1]);
  const [qty, setQty] = useState(2);

  useEffect(() => {
    async function fetchProduct() {
      try {
        if (USE_MOCK) {
          setProduct(MOCK_PRODUCT);
        } else {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${id}`
          );
          if (!res.ok) throw new Error("Network error");
          const data = await res.json();
          setProduct(data);
          setSizeCode(data.sizes[0].code);
          setSugarCode(data.sugarLevels[2]?.code ?? data.sugarLevels[0].code);
          setIceCode(data.iceLevels[1]?.code ?? data.iceLevels[0].code);
          setSelectedToppings([data.toppings[0]?.id].filter(Boolean));
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const toggleTopping = (toppingId) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingId)
        ? prev.filter((i) => i !== toppingId)
        : [...prev, toppingId]
    );
  };

  if (loading) return <p style={{ padding: "3rem", textAlign: "center" }}>Đang tải...</p>;
  if (error) return <p style={{ padding: "3rem", color: "red", textAlign: "center" }}>Lỗi: {error}</p>;
  if (!product) return null;

  const pricePerCup = calcPerCup(product, sizeCode, selectedToppings);
  const totalPrice = pricePerCup * qty;

  // Breakdown string: 49.000 + 6.000 + 10.000 VNĐ
  const selectedSize = product.sizes.find((s) => s.code === sizeCode);
  const breakdownParts = [fmtShort(product.basePrice)];
  if (selectedSize?.priceDelta > 0) breakdownParts.push(fmtShort(selectedSize.priceDelta));
  product.toppings
    .filter((t) => selectedToppings.includes(t.id))
    .forEach((t) => breakdownParts.push(fmtShort(t.price)));
  const breakdown = breakdownParts.join(" + ") + " VNĐ";

  return (
    <div
      style={{
        maxWidth: "1440px",
        margin: "0 auto",
        width: "100%",
        padding: "30px 64px 60px",
        display: "flex",
        flexDirection: "column",
        gap: "26px",
        boxSizing: "border-box",
      }}
    >
      {/* Breadcrumb */}
      <p style={{ margin: 0, fontSize: "13px", color: C.textMuted, lineHeight: "20.1px" }}>
        Thực đơn / Cà phê / {product.name}
      </p>

      {/* Two-column layout */}
      <div style={{ display: "flex", gap: "64px", alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* ── Left: Product Story ── */}
        <div
          style={{
            flex: "0 0 580px",
            maxWidth: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "22px",
          }}
        >
          {/* Product image */}
          <img
            src={product.image}
            alt={product.name}
            style={{
              width: "100%",
              height: "540px",
              objectFit: "cover",
              borderRadius: "16px",
              display: "block",
            }}
          />

          {/* Tags */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {product.tags.map((tag) => (
              <span
                key={tag.label}
                style={{
                  background: tag.color,
                  borderRadius: "100px",
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: tag.textColor,
                  lineHeight: "14.5px",
                }}
              >
                {tag.label}
              </span>
            ))}
          </div>

          {/* Tagline */}
          <p
            className="font-serif"
            style={{
              margin: 0,
              fontSize: "25px",
              fontWeight: 500,
              color: C.text,
              lineHeight: "32.5px",
            }}
          >
            {product.tagline}
          </p>

          {/* Description */}
          <p style={{ margin: 0, fontSize: "14px", color: C.textMuted, lineHeight: "21.7px" }}>
            {product.description}
          </p>

          {/* Allergy note */}
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}>
              <circle cx="12" cy="12" r="10" stroke={C.textMuted} strokeWidth="1.5"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="12" cy="16" r="0.5" fill={C.textMuted} stroke={C.textMuted} strokeWidth="1"/>
            </svg>
            <p style={{ margin: 0, fontSize: "12px", color: C.textMuted, lineHeight: "18.6px" }}>
              {product.allergyNote}
            </p>
          </div>
        </div>

        {/* ── Right: Options ── */}
        <div
          style={{
            flex: 1,
            minWidth: "320px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Step label */}
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              fontWeight: 700,
              color: C.primary,
              letterSpacing: "0.05em",
              lineHeight: "13.3px",
            }}
          >
            {product.step}
          </p>

          {/* Product name */}
          <h1
            className="font-serif"
            style={{
              margin: 0,
              fontSize: "40px",
              fontWeight: 500,
              color: C.text,
              lineHeight: "52px",
            }}
          >
            {product.name}
          </h1>

          {/* Base price */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span
              style={{
                fontSize: "24px",
                fontWeight: 600,
                color: C.price,
                lineHeight: "37.2px",
              }}
            >
              {fmt(product.basePrice)}
            </span>
            <span style={{ fontSize: "13px", color: C.textMuted, lineHeight: "20.1px" }}>
              {product.baseSizeLabel}
            </span>
          </div>

          <Divider />

          {/* Size */}
          <OptionGroup label="Kích cỡ · Bắt buộc">
            {product.sizes.map((s) => (
              <OptionBtn
                key={s.code}
                selected={sizeCode === s.code}
                onClick={() => setSizeCode(s.code)}
              >
                {s.label}
              </OptionBtn>
            ))}
          </OptionGroup>

          {/* Sugar */}
          <OptionGroup label="Mức đường · Bắt buộc">
            {product.sugarLevels.map((s) => (
              <OptionBtn
                key={s.code}
                selected={sugarCode === s.code}
                onClick={() => setSugarCode(s.code)}
              >
                {s.label}
              </OptionBtn>
            ))}
          </OptionGroup>

          {/* Ice */}
          <OptionGroup label="Mức đá · Bắt buộc">
            {product.iceLevels.map((s) => (
              <OptionBtn
                key={s.code}
                selected={iceCode === s.code}
                onClick={() => setIceCode(s.code)}
              >
                {s.label}
              </OptionBtn>
            ))}
          </OptionGroup>

          {/* Toppings */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: 600,
                color: C.text,
                lineHeight: "21.7px",
              }}
            >
              Thêm theo gu · Không bắt buộc
            </p>
            {product.toppings.map((t) => {
              const checked = selectedToppings.includes(t.id);
              return (
                <div
                  key={t.id}
                  onClick={() => toggleTopping(t.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px",
                    border: checked
                      ? `1px solid ${C.primary}`
                      : `1px solid ${C.border}`,
                    borderRadius: "8px",
                    background: checked ? C.primaryLight : C.white,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {/* Custom checkbox */}
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "4px",
                      border: checked
                        ? `1px solid ${C.primary}`
                        : `1px solid ${C.border}`,
                      background: checked ? C.primary : C.white,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {checked && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span
                    style={{
                      flex: 1,
                      fontSize: "13px",
                      color: C.text,
                      lineHeight: "20.1px",
                    }}
                  >
                    {t.name}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: C.text,
                      lineHeight: "20.1px",
                      minWidth: "82px",
                      textAlign: "right",
                    }}
                  >
                    +{fmt(t.price)}
                  </span>
                </div>
              );
            })}
          </div>

          <Divider />

          {/* Quantity + price per cup */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Quantity control */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "22px",
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                padding: "9px 16px",
                width: "109px",
                boxSizing: "border-box",
              }}
            >
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  color: C.text,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <line x1="5" y1="12" x2="19" y2="12" stroke={C.text} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: C.text,
                  lineHeight: "21.7px",
                  minWidth: "9px",
                  textAlign: "center",
                }}
              >
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  color: C.text,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <line x1="12" y1="5" x2="12" y2="19" stroke={C.text} strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="5" y1="12" x2="19" y2="12" stroke={C.text} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Price per cup */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "right" }}>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: C.text,
                  lineHeight: "27.9px",
                }}
              >
                {fmt(pricePerCup)} / ly
              </span>
              <span style={{ fontSize: "11px", color: C.textMuted, lineHeight: "17px" }}>
                {breakdown}
              </span>
            </div>
          </div>

          {/* Add to cart button */}
          <button
            onClick={() =>
              alert(`Đã thêm ${qty} ly ${product.name} vào giỏ hàng!`)
            }
            style={{
              width: "100%",
              height: "50px",
              background: C.primary,
              border: `1px solid ${C.primary}`,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <span
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#ffffff",
                lineHeight: "18.2px",
              }}
            >
              Thêm {qty} ly vào giỏ &nbsp;·&nbsp; {fmt(totalPrice)}
            </span>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="3" y1="6" x2="21" y2="6" stroke="#fff" strokeWidth="1.5"/>
              <path d="M16 10a4 4 0 01-8 0" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Note */}
          <p style={{ margin: 0, fontSize: "12px", color: C.textMuted, lineHeight: "18.6px" }}>
            Bạn có thể thay đổi tùy chọn trong giỏ hàng trước khi thanh toán.
          </p>
        </div>
      </div>
    </div>
  );
}
