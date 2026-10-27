// apps/web/app/layout.js
import { Inter, Noto_Serif } from "next/font/google";

const inter = Inter({
  subsets: ["vietnamese", "latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSerif = Noto_Serif({
  subsets: ["vietnamese", "latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "BrewLite - Cà phê chuẩn gu",
  description: "Ứng dụng đặt và thưởng thức cà phê không tiền mặt BrewLite",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${inter.variable} ${notoSerif.variable}`}>
      <head>
        <style>{`
          *, *::before, *::after {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }
          .font-serif {
            font-family: var(--font-serif), Georgia, Cambria, "Times New Roman", Times, serif;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
