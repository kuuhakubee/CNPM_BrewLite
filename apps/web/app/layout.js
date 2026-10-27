import './globals.css';
import AppLayout from '../components/layout/AppLayout';

export const metadata = {
  title: 'BrewLite – Cà phê chuẩn vị, đặt trước nhận ngay',
  description: 'Bản thiết kế MVP BrewLite - Nhận tại quầy, thanh toán mẫu không phát sinh giao dịch.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/manifest.svg" />
      </head>
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
