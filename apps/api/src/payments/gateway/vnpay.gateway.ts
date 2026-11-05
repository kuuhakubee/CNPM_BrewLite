import * as crypto from 'crypto';

export interface CreateVnpayPaymentParams {
  orderId: number;
  amount: number;
  orderInfo: string;
  ipAddr: string;
  bankCode?: string;
  returnUrl?: string;
  txnRef?: string;
}

export class VNPayGateway {
  private readonly tmnCode: string;
  private readonly secretKey: string;
  private readonly vnpUrl: string;
  private readonly defaultReturnUrl: string;

  constructor() {
    this.tmnCode = process.env.VNP_TMN_CODE || 'HHLAZKIO';
    this.secretKey =
      process.env.VNP_HASH_SECRET || 'HABLURPFVBZMHOSDENDDTBDKNDGZDHCT';
    this.vnpUrl =
      process.env.VNP_URL ||
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.defaultReturnUrl =
      process.env.VNP_RETURN_URL ||
      'http://localhost:3000/checkout/confirmation';
  }

  /**
   * Sinh URL thanh toán chuyển hướng sang Cổng VNPay Sandbox
   */
  createPaymentUrl(params: CreateVnpayPaymentParams): string {
    const createDate = this.formatDate(new Date());
    const txnRef = params.txnRef || `${params.orderId}_${Date.now()}`;
    const returnUrl = params.returnUrl || this.defaultReturnUrl;

    const vnpParams: Record<string, string | number> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: params.orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: Math.round(params.amount * 100),
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: params.ipAddr || '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    if (params.bankCode && params.bankCode.trim() !== '') {
      vnpParams.vnp_BankCode = params.bankCode;
    }

    const sortedParams = this.sortObject(vnpParams);
    const signData = Object.keys(sortedParams)
      .map((k) => `${k}=${sortedParams[k]}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', this.secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return `${this.vnpUrl}?${signData}&vnp_SecureHash=${signed}`;
  }

  /**
   * Kiểm tra tính toàn vẹn và chữ ký của request từ VNPay (IPN hoặc Return)
   */
  verifyChecksum(params: Record<string, any>): boolean {
    const secureHash = params.vnp_SecureHash;
    if (!secureHash) return false;

    const clone: Record<string, any> = {};
    for (const key in params) {
      if (
        Object.prototype.hasOwnProperty.call(params, key) &&
        key !== 'vnp_SecureHash' &&
        key !== 'vnp_SecureHashType'
      ) {
        clone[key] = params[key];
      }
    }

    const sortedParams = this.sortObject(clone);
    const signData = Object.keys(sortedParams)
      .map((k) => `${k}=${sortedParams[k]}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', this.secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash.toLowerCase() === signed.toLowerCase();
  }

  /**
   * Sắp xếp object theo key A-Z và mã hóa URI theo chuẩn VNPay
   */
  private sortObject(obj: Record<string, any>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys: string[] = [];

    for (const key in obj) {
      if (
        Object.prototype.hasOwnProperty.call(obj, key) &&
        obj[key] !== undefined &&
        obj[key] !== null &&
        obj[key] !== ''
      ) {
        keys.push(encodeURIComponent(key));
      }
    }

    keys.sort();

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const decodedKey = decodeURIComponent(key);
      sorted[key] = encodeURIComponent(String(obj[decodedKey])).replace(
        /%20/g,
        '+',
      );
    }

    return sorted;
  }

  /**
   * Định dạng YYYYMMDDHHmmss theo giờ GMT+7
   */
  private formatDate(date: Date): string {
    const tzOffset = 7 * 60;
    const vnDate = new Date(
      date.getTime() + (tzOffset + date.getTimezoneOffset()) * 60000,
    );
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      vnDate.getFullYear() +
      pad(vnDate.getMonth() + 1) +
      pad(vnDate.getDate()) +
      pad(vnDate.getHours()) +
      pad(vnDate.getMinutes()) +
      pad(vnDate.getSeconds())
    );
  }
}
