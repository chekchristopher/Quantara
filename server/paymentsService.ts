import fs from 'fs';
import path from 'path';

export interface VerifiedPayment {
  paymentId: string;
  invoiceId: string;
  paymentStatus: 'finished' | 'confirmed' | 'sending' | 'waiting' | 'failed' | 'expired';
  priceAmount: number;
  actuallyPaid: number;
  payCurrency: string;
  createdAt: string;
  confirmedAt?: string;
  claimedByEmail?: string;
  claimedByUid?: string;
  claimedAt?: string;
  verifiedVia: 'NOWPAYMENTS_API' | 'NOWPAYMENTS_IPN_WEBHOOK' | 'ADMIN_APPROVAL';
  txHash?: string;
  rawPayload?: any;
}

export interface VerificationAttempt {
  id: string;
  timestamp: string;
  reference: string;
  userEmail: string;
  uid?: string;
  status: 'SUCCESS' | 'REJECTED';
  reason: string;
  ip?: string;
}

const STORAGE_DIR = path.join(process.cwd(), 'server', 'data');
const PAYMENTS_FILE = path.join(STORAGE_DIR, 'verified_payments.json');
const ATTEMPTS_FILE = path.join(STORAGE_DIR, 'verification_attempts.json');

export class PaymentsService {
  private verifiedPayments: Map<string, VerifiedPayment> = new Map();
  private verificationAttempts: VerificationAttempt[] = [];
  public readonly defaultInvoiceId = '5836437268';
  public readonly requiredUsdAmount = 100;
  public readonly adminEmail = 'chekchris85@gmail.com';

  constructor() {
    this.ensureStorageDir();
    this.loadData();
  }

  private ensureStorageDir() {
    try {
      if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
      }
    } catch (e) {
      console.warn('[PaymentsService] Failed to create storage dir:', e);
    }
  }

  private loadData() {
    try {
      if (fs.existsSync(PAYMENTS_FILE)) {
        const raw = fs.readFileSync(PAYMENTS_FILE, 'utf-8');
        const list: VerifiedPayment[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const item of list) {
            this.verifiedPayments.set(item.paymentId.toLowerCase(), item);
            if (item.txHash) {
              this.verifiedPayments.set(item.txHash.toLowerCase(), item);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[PaymentsService] Error loading verified payments:', e);
    }

    try {
      if (fs.existsSync(ATTEMPTS_FILE)) {
        const raw = fs.readFileSync(ATTEMPTS_FILE, 'utf-8');
        const list: VerificationAttempt[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          this.verificationAttempts = list.slice(-200); // keep last 200 attempts
        }
      }
    } catch (e) {
      console.warn('[PaymentsService] Error loading verification attempts:', e);
    }
  }

  private savePayments() {
    try {
      this.ensureStorageDir();
      const uniqueItems = Array.from(new Set(Array.from(this.verifiedPayments.values())));
      fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(uniqueItems, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[PaymentsService] Error saving verified payments:', e);
    }
  }

  private saveAttempts() {
    try {
      this.ensureStorageDir();
      fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify(this.verificationAttempts.slice(-200), null, 2), 'utf-8');
    } catch (e) {
      console.warn('[PaymentsService] Error saving verification attempts:', e);
    }
  }

  public recordAttempt(attempt: Omit<VerificationAttempt, 'id' | 'timestamp'>) {
    const entry: VerificationAttempt = {
      ...attempt,
      id: `att_${Date.now()}_${Math.floor(Math.random() * 8999 + 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.verificationAttempts.unshift(entry);
    if (this.verificationAttempts.length > 200) {
      this.verificationAttempts = this.verificationAttempts.slice(0, 200);
    }
    this.saveAttempts();
    return entry;
  }

  public getAttempts(): VerificationAttempt[] {
    return [...this.verificationAttempts];
  }

  public getVerifiedPayments(): VerifiedPayment[] {
    return Array.from(new Set(Array.from(this.verifiedPayments.values())));
  }

  /**
   * Process incoming IPN callback from NOWPayments webhook
   */
  public handleIpnWebhook(payload: any): { success: boolean; message: string; payment?: VerifiedPayment } {
    if (!payload || typeof payload !== 'object') {
      return { success: false, message: 'Invalid payload' };
    }

    const paymentId = String(payload.payment_id || payload.id || '').trim();
    if (!paymentId) {
      return { success: false, message: 'Missing payment_id' };
    }

    const status = String(payload.payment_status || '').toLowerCase();
    const invoiceId = String(payload.invoice_id || this.defaultInvoiceId);
    const priceAmount = Number(payload.price_amount || payload.outcome_amount || this.requiredUsdAmount);
    const actuallyPaid = Number(payload.actually_paid || payload.pay_amount || 0);
    const payCurrency = String(payload.pay_currency || payload.outcome_currency || 'CRYPTO').toUpperCase();
    const txHash = payload.payin_extra_id || payload.payment_extra_ids || payload.tx_hash || payload.pay_address;

    let payment = this.verifiedPayments.get(paymentId.toLowerCase());
    const validStatus = (['finished', 'confirmed', 'sending', 'waiting', 'failed', 'expired'] as const).includes(status as any)
      ? (status as VerifiedPayment['paymentStatus'])
      : 'waiting';

    if (payment) {
      payment.paymentStatus = validStatus;
      payment.actuallyPaid = actuallyPaid || payment.actuallyPaid;
      if (['finished', 'confirmed'].includes(validStatus) && !payment.confirmedAt) {
        payment.confirmedAt = new Date().toISOString();
      }
      if (txHash && !payment.txHash) {
        payment.txHash = String(txHash);
      }
      payment.rawPayload = payload;
    } else {
      payment = {
        paymentId,
        invoiceId,
        paymentStatus: validStatus,
        priceAmount,
        actuallyPaid,
        payCurrency,
        createdAt: new Date().toISOString(),
        confirmedAt: ['finished', 'confirmed'].includes(validStatus) ? new Date().toISOString() : undefined,
        verifiedVia: 'NOWPAYMENTS_IPN_WEBHOOK',
        txHash: txHash ? String(txHash) : undefined,
        rawPayload: payload,
      };
    }

    this.verifiedPayments.set(paymentId.toLowerCase(), payment);
    if (payment.txHash) {
      this.verifiedPayments.set(payment.txHash.toLowerCase(), payment);
    }
    this.savePayments();

    return {
      success: true,
      message: `Payment ${paymentId} updated with status: ${validStatus}`,
      payment,
    };
  }

  /**
   * Query NOWPayments live API for a payment status
   */
  public async queryNowPaymentsApi(paymentIdOrRef: string): Promise<VerifiedPayment | null> {
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    const cleanRef = paymentIdOrRef.trim();

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }

      // Query standard NOWPayments payment status endpoint
      const response = await fetch(`https://api.nowpayments.io/v1/payment/${encodeURIComponent(cleanRef)}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data && (data.payment_id || data.id)) {
          const status = String(data.payment_status || '').toLowerCase();
          const validStatus = (['finished', 'confirmed', 'sending', 'waiting', 'failed', 'expired'] as const).includes(status as any)
            ? (status as VerifiedPayment['paymentStatus'])
            : 'waiting';

          const verified: VerifiedPayment = {
            paymentId: String(data.payment_id || data.id),
            invoiceId: String(data.invoice_id || this.defaultInvoiceId),
            paymentStatus: validStatus,
            priceAmount: Number(data.price_amount || this.requiredUsdAmount),
            actuallyPaid: Number(data.actually_paid || data.pay_amount || 0),
            payCurrency: String(data.pay_currency || 'CRYPTO').toUpperCase(),
            createdAt: data.created_at || new Date().toISOString(),
            confirmedAt: ['finished', 'confirmed'].includes(validStatus) ? new Date().toISOString() : undefined,
            verifiedVia: 'NOWPAYMENTS_API',
            txHash: data.payin_extra_id || data.pay_address,
            rawPayload: data,
          };

          this.verifiedPayments.set(verified.paymentId.toLowerCase(), verified);
          this.savePayments();
          return verified;
        }
      }
    } catch (err) {
      console.warn('[PaymentsService] NOWPayments API query failed:', err);
    }

    return null;
  }

  /**
   * Strictly verify a user payment reference
   */
  public async verifyReference(
    reference: string,
    userEmail: string,
    uid?: string,
    isAdminUser: boolean = false
  ): Promise<{
    verified: boolean;
    message: string;
    errorDetail?: string;
    payment?: VerifiedPayment;
  }> {
    const trimmed = (reference || '').trim();
    const lower = trimmed.toLowerCase();

    // Mandatory input check
    if (!trimmed) {
      this.recordAttempt({
        reference: '',
        userEmail: userEmail || 'anonymous',
        uid,
        status: 'REJECTED',
        reason: 'Missing reference string',
      });
      return {
        verified: false,
        message: 'Not verified',
        errorDetail: 'Payment reference is mandatory. Please enter your confirmed NOWPayments Payment ID or Transaction Hash.',
      };
    }

    // Reject obvious placeholders / dummies
    const invalidPlaceholders = [
      'test', 'none', 'dummy', 'fake', 'placeholder', '12345', '123456',
      'asdf', 'nil', 'null', 'undefined', 'test1234', 'testing', 'admin'
    ];
    if (trimmed.length < 6 || invalidPlaceholders.includes(lower)) {
      this.recordAttempt({
        reference: trimmed,
        userEmail: userEmail || 'anonymous',
        uid,
        status: 'REJECTED',
        reason: 'Format rejected: placeholder or string too short (< 6 chars)',
      });
      return {
        verified: false,
        message: 'Not verified',
        errorDetail: 'Invalid payment reference format. Please enter the authentic Payment ID from your NOWPayments receipt or blockchain explorer.',
      };
    }

    // Admin VIP emergency bypass strictly for platform owner
    if (isAdminUser && userEmail.toLowerCase() === this.adminEmail && trimmed.startsWith('ADMIN_VIP_OVERRIDE')) {
      const adminPayment: VerifiedPayment = {
        paymentId: trimmed,
        invoiceId: this.defaultInvoiceId,
        paymentStatus: 'finished',
        priceAmount: this.requiredUsdAmount,
        actuallyPaid: this.requiredUsdAmount,
        payCurrency: 'ADMIN_CLEARANCE',
        createdAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
        claimedByEmail: userEmail,
        claimedByUid: uid,
        claimedAt: new Date().toISOString(),
        verifiedVia: 'ADMIN_APPROVAL',
      };
      this.recordAttempt({
        reference: trimmed,
        userEmail,
        uid,
        status: 'SUCCESS',
        reason: 'Authorized administrator clearance',
      });
      return {
        verified: true,
        message: 'Payment successful',
        payment: adminPayment,
      };
    }

    // Step 1: Check existing ledger of verified payments (from IPN webhooks or earlier API validations)
    let payment = this.verifiedPayments.get(lower);

    // Step 2: If not found in memory, query NOWPayments API directly
    if (!payment) {
      payment = await this.queryNowPaymentsApi(trimmed);
    }

    // Step 3: Evaluate payment state
    if (!payment) {
      this.recordAttempt({
        reference: trimmed,
        userEmail,
        uid,
        status: 'REJECTED',
        reason: 'Payment reference not found on NOWPayments invoice #5836437268',
      });
      return {
        verified: false,
        message: 'Not verified',
        errorDetail: `Payment reference "${trimmed}" could not be confirmed on NOWPayments invoice #5836437268. Please ensure you completed your $100 cryptocurrency payment and allow sufficient blockchain confirmations before verifying.`,
      };
    }

    // Check payment status
    if (['waiting', 'confirming'].includes(payment.paymentStatus)) {
      this.recordAttempt({
        reference: trimmed,
        userEmail,
        uid,
        status: 'REJECTED',
        reason: `Payment found on NOWPayments but status is ${payment.paymentStatus}`,
      });
      return {
        verified: false,
        message: 'Not verified',
        errorDetail: `Payment #${payment.paymentId} was found on NOWPayments, but its status is currently "${payment.paymentStatus}". Please wait 2-5 minutes for blockchain confirmations, then verify again.`,
      };
    }

    if (['failed', 'expired'].includes(payment.paymentStatus)) {
      this.recordAttempt({
        reference: trimmed,
        userEmail,
        uid,
        status: 'REJECTED',
        reason: `Payment is ${payment.paymentStatus}`,
      });
      return {
        verified: false,
        message: 'Not verified',
        errorDetail: `Payment #${payment.paymentId} on NOWPayments has status "${payment.paymentStatus}". Please initiate a new payment to subscribe.`,
      };
    }

    // Payment must be confirmed or finished
    if (!['finished', 'confirmed', 'sending'].includes(payment.paymentStatus)) {
      this.recordAttempt({
        reference: trimmed,
        userEmail,
        uid,
        status: 'REJECTED',
        reason: `Payment status is ${payment.paymentStatus}`,
      });
      return {
        verified: false,
        message: 'Not verified',
        errorDetail: `Payment #${payment.paymentId} has not reached confirmed status on NOWPayments (current status: ${payment.paymentStatus}).`,
      };
    }

    // Anti-replay: Check if already claimed by another user
    if (
      payment.claimedByEmail &&
      payment.claimedByEmail.toLowerCase() !== userEmail.toLowerCase() &&
      payment.claimedByUid &&
      payment.claimedByUid !== uid
    ) {
      this.recordAttempt({
        reference: trimmed,
        userEmail,
        uid,
        status: 'REJECTED',
        reason: `Anti-replay: Payment already claimed by ${payment.claimedByEmail}`,
      });
      return {
        verified: false,
        message: 'Not verified',
        errorDetail: `This payment reference has already been redeemed by another account (${payment.claimedByEmail}). Each cryptocurrency payment can only be redeemed once.`,
      };
    }

    // Claim the payment for this user
    payment.claimedByEmail = userEmail;
    payment.claimedByUid = uid;
    payment.claimedAt = new Date().toISOString();
    this.verifiedPayments.set(payment.paymentId.toLowerCase(), payment);
    if (payment.txHash) {
      this.verifiedPayments.set(payment.txHash.toLowerCase(), payment);
    }
    this.savePayments();

    this.recordAttempt({
      reference: trimmed,
      userEmail,
      uid,
      status: 'SUCCESS',
      reason: `Verified on NOWPayments (status: ${payment.paymentStatus}, paid: ${payment.actuallyPaid} ${payment.payCurrency})`,
    });

    return {
      verified: true,
      message: 'Payment successful',
      payment,
    };
  }

  /**
   * Admin manual approval of a transaction hash / payment ID
   */
  public adminManualApprove(
    adminEmail: string,
    targetPaymentId: string,
    targetUserEmail: string,
    targetUid?: string,
    notes?: string
  ): { success: boolean; message: string; payment?: VerifiedPayment } {
    if (adminEmail.toLowerCase() !== this.adminEmail) {
      return { success: false, message: 'Unauthorized: Admin privileges required.' };
    }

    const cleanId = targetPaymentId.trim();
    if (!cleanId) {
      return { success: false, message: 'Payment ID / reference is required' };
    }

    const payment: VerifiedPayment = {
      paymentId: cleanId,
      invoiceId: this.defaultInvoiceId,
      paymentStatus: 'finished',
      priceAmount: this.requiredUsdAmount,
      actuallyPaid: this.requiredUsdAmount,
      payCurrency: 'CRYPTO_MANUAL_VERIFIED',
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      claimedByEmail: targetUserEmail,
      claimedByUid: targetUid,
      claimedAt: new Date().toISOString(),
      verifiedVia: 'ADMIN_APPROVAL',
      txHash: cleanId,
      rawPayload: { manualApprovalBy: adminEmail, notes },
    };

    this.verifiedPayments.set(cleanId.toLowerCase(), payment);
    this.savePayments();

    this.recordAttempt({
      reference: cleanId,
      userEmail: targetUserEmail,
      uid: targetUid,
      status: 'SUCCESS',
      reason: `Manually approved by administrator (${adminEmail}): ${notes || 'Verified on blockchain'}`,
    });

    return {
      success: true,
      message: `Payment ${cleanId} successfully approved and credited to ${targetUserEmail}.`,
      payment,
    };
  }
}

export const paymentsService = new PaymentsService();
