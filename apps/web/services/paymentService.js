/**
 * paymentService.js
 * ─────────────────
 * Hỗ trợ tạo liên kết thanh toán VNPay Sandbox và xác thực kết quả thanh toán.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const DEFAULT_VNP_SECRET =
  process.env.NEXT_PUBLIC_VNP_HASH_SECRET ||
  'HABLURPFVBZMHOSDENDDTBDKNDGZDHCT';
const DEFAULT_VNP_TMN =
  process.env.NEXT_PUBLIC_VNP_TMN_CODE || 'HHLAZKIO';
const DEFAULT_VNP_URL =
  process.env.NEXT_PUBLIC_VNP_URL ||
  'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

/**
 * Sinh UUID v4 tương thích với mọi môi trường (Node + Browser).
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Fallback sinh URL VNPay Sandbox trực tiếp bằng SubtleCrypto HMAC-SHA512
 * khi backend chưa chạy hoặc phiên đăng nhập ở chế độ cục bộ.
 */
async function generateVnpayClientUrl({
  orderId,
  amount,
  bankCode = '',
  returnUrl = 'http://localhost:3000/checkout/confirmation',
}) {
  const now = new Date();
  const tzOffset = 7 * 60;
  const vnDate = new Date(
    now.getTime() + (tzOffset + now.getTimezoneOffset()) * 60000,
  );
  const pad = (n) => String(n).padStart(2, '0');
  const createDate = `${vnDate.getFullYear()}${pad(vnDate.getMonth() + 1)}${pad(vnDate.getDate())}${pad(vnDate.getHours())}${pad(vnDate.getMinutes())}${pad(vnDate.getSeconds())}`;
  const txnRef = `${orderId}_${Date.now()}`;

  const vnpParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: DEFAULT_VNP_TMN,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: `Thanh toan don hang #${orderId}`,
    vnp_OrderType: 'other',
    vnp_Amount: Math.round(Number(amount) * 100),
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: '127.0.0.1',
    vnp_CreateDate: createDate,
  };

  if (bankCode) {
    vnpParams.vnp_BankCode = bankCode;
  }

  const sortedKeys = Object.keys(vnpParams).sort();
  const signData = sortedKeys
    .map(
      (k) =>
        `${k}=${encodeURIComponent(String(vnpParams[k])).replace(/%20/g, '+')}`,
    )
    .join('&');

  const enc = new TextEncoder();
  const cryptoObj =
    typeof window !== 'undefined'
      ? window.crypto
      : require('crypto').webcrypto;
  const key = await cryptoObj.subtle.importKey(
    'raw',
    enc.encode(DEFAULT_VNP_SECRET),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  );
  const sig = await cryptoObj.subtle.sign('HMAC', key, enc.encode(signData));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${DEFAULT_VNP_URL}?${signData}&vnp_SecureHash=${hex}`;
}

/**
 * Fallback kiểm tra chữ ký VNPay phía Client
 */
async function verifyVnpayClientReturn(queryString) {
  const params = new URLSearchParams(queryString);
  const secureHash = params.get('vnp_SecureHash');
  const responseCode = params.get('vnp_ResponseCode');
  const txnRef = params.get('vnp_TxnRef') || '';
  const transactionNo = params.get('vnp_TransactionNo') || 'VNPAY-TEST';
  const orderId = txnRef.split('_')[0];

  if (!secureHash) {
    return { success: false, message: 'Thiếu mã băm bảo mật vnp_SecureHash' };
  }

  const obj = {};
  params.forEach((val, key) => {
    if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType') {
      obj[key] = val;
    }
  });

  const sortedKeys = Object.keys(obj).sort();
  const signData = sortedKeys
    .map(
      (k) => `${k}=${encodeURIComponent(String(obj[k])).replace(/%20/g, '+')}`,
    )
    .join('&');

  const enc = new TextEncoder();
  const cryptoObj =
    typeof window !== 'undefined'
      ? window.crypto
      : require('crypto').webcrypto;
  const key = await cryptoObj.subtle.importKey(
    'raw',
    enc.encode(DEFAULT_VNP_SECRET),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  );
  const sig = await cryptoObj.subtle.sign('HMAC', key, enc.encode(signData));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const isValid = hex.toLowerCase() === secureHash.toLowerCase();
  const isSuccess = responseCode === '00';

  return {
    success: isValid && isSuccess,
    orderId,
    orderCode: `#${orderId}`,
    orderStatus: isValid && isSuccess ? 'PAID' : 'PAYMENT_FAILED',
    transactionRef: transactionNo,
    message: !isValid
      ? 'Chữ ký không hợp lệ (Fail Checksum)'
      : isSuccess
        ? 'Thanh toán thành công'
        : `Giao dịch không thành công (Mã lỗi ${responseCode})`,
  };
}

export const paymentService = {
  /**
   * Khởi tạo URL thanh toán VNPay Sandbox
   */
  async createVnpayUrl(orderId, accessToken, bankCode = '', amount = 50000) {
    // 1. Thử gọi backend API nếu có token thật
    if (accessToken && !accessToken.startsWith('mock-jwt-token-')) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/payments/create-url`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ orderId, bankCode }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data?.paymentUrl) return data;
        }
      } catch (err) {
        console.warn('Backend API create-url failed, falling back to client generation:', err);
      }
    }

    // 2. Tự sinh URL VNPay Sandbox hợp lệ 100% kèm chữ ký HMAC-SHA512
    const paymentUrl = await generateVnpayClientUrl({
      orderId,
      amount,
      bankCode,
    });

    return {
      message: 'Khởi tạo cổng VNPay Sandbox thành công',
      paymentUrl,
      orderId,
      orderCode: `#${orderId}`,
      amount,
    };
  },

  /**
   * Xác thực và đồng bộ kết quả trả về từ VNPay Return URL
   */
  async verifyVnpayReturn(queryString) {
    // 1. Thử gọi qua Backend verify
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/payments/vnpay-return${queryString}`,
        { method: 'GET' },
      );

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.warn('Backend API vnpay-return failed, verifying locally:', err);
    }

    // 2. Xác thực chữ ký HMAC-SHA512 trực tiếp
    return verifyVnpayClientReturn(queryString);
  },

  /**
   * Phương thức thanh toán Mock cũ (fallback)
   */
  async pay({ orderId, amount, method, idempotencyKey }, accessToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ orderId, amount, method, idempotencyKey }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch {}

    const mockSuccess = Math.random() < 0.9;
    return {
      message: mockSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại',
      idempotent: false,
      orderStatus: mockSuccess ? 'PAID' : 'PAYMENT_FAILED',
      payment: {
        id: 1,
        transactionRef: `MOCK-TXN-${Date.now()}`,
      },
    };
  },

  getOrCreateIdempotencyKey() {
    if (typeof window === 'undefined') return generateUUID();
    const stored = sessionStorage.getItem('brewlite_idempotency_key');
    if (stored) return stored;
    const key = generateUUID();
    sessionStorage.setItem('brewlite_idempotency_key', key);
    return key;
  },

  resetPaymentKey() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('brewlite_idempotency_key');
    }
  },
};
